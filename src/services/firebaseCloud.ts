import { createHash, randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { BulkWriter, Firestore, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { AppStateData, ChatMessage, NukeBroadcastAlert } from '../types';

type FirebaseStorageBucket = ReturnType<ReturnType<typeof getStorage>['bucket']>;

export interface CloudChatState {
  messages: ChatMessage[];
  nukeAlerts: NukeBroadcastAlert[];
}

const stateCollections: Array<{ key: keyof AppStateData; collection: string }> = [
  { key: 'profiles', collection: 'profiles' },
  { key: 'admins', collection: 'admins' },
  { key: 'characters', collection: 'characters' },
  { key: 'events', collection: 'events' },
  { key: 'awards', collection: 'awards' },
  { key: 'cases', collection: 'cases' },
  { key: 'caseItems', collection: 'caseItems' },
  { key: 'weeklyShopItems', collection: 'weeklyShopItems' },
  { key: 'auctionListings', collection: 'auctionListings' },
  { key: 'preReleasePosts', collection: 'preReleasePosts' },
  { key: 'achievements', collection: 'achievements' },
  { key: 'factions', collection: 'factions' },
  { key: 'artworks', collection: 'artworks' },
  { key: 'activityLogs', collection: 'activityLogs' },
  { key: 'notifications', collection: 'notifications' },
  { key: 'botVersions', collection: 'botVersions' }
];

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cleanFirestoreData(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = cleanFirestoreData(v);
      }
    }
    return res;
  }
  return obj;
}

function documentId(value: any, index: number): string {
  const identity = value?.id || value?.username || value?.version || `record-${index}`;
  return createHash('sha256').update(String(identity)).digest('hex');
}

function stableJson(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function dataHash(value: any): string {
  return createHash('sha256').update(stableJson(value)).digest('hex');
}

export class FirebaseCloudStore {
  private firestore: Firestore | null = null;
  private bucket: FirebaseStorageBucket | null = null;
  private root: FirebaseFirestore.DocumentReference | null = null;
  private collectionHashes = new Map<string, Map<string, string>>();

  async connect(): Promise<boolean> {
    let accountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    if (!accountJson) {
      const candidates = [
        path.join(process.cwd(), 'serviceAccountKey.json'),
        path.join(process.cwd(), 'firebase-service-account.json'),
        path.join(process.cwd(), 'firebase-key.json'),
        path.join(__dirname, '..', '..', 'serviceAccountKey.json'),
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ].filter(Boolean) as string[];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            accountJson = fs.readFileSync(p, 'utf-8');
            console.info(`[Firebase] Loaded credentials from file: ${p}`);
            break;
          } catch (_) {}
        }
      }
    }

    if (!accountJson) {
      console.warn('[Firebase] Warning: FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
      return false;
    }

    try {
      if (fs.existsSync(accountJson)) {
        accountJson = fs.readFileSync(accountJson, 'utf-8');
      }

      const serviceAccount = JSON.parse(accountJson);
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      const projectId = serviceAccount.project_id || 'aboba-bot';
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

      const appName = 'dusttown-rp-cloud';
      const app: App = getApps().find(candidate => candidate.name === appName) || initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName
      }, appName);

      this.firestore = getFirestore(app);
      try {
        this.firestore.settings({ ignoreUndefinedProperties: true });
      } catch (settingsErr) {
        // May already be initialized
      }

      try {
        if (bucketName) {
          this.bucket = getStorage(app).bucket(bucketName);
          await this.bucket.getMetadata();
        }
      } catch (bErr: any) {
        console.warn('[Firebase Storage] Bucket warning; Firestore data storage will continue normally:', bErr?.message || bErr);
      }

      this.root = this.firestore.collection('dusttown').doc('appState');
      await this.firestore.doc('dusttown/health').set({
        checkedAt: new Date().toISOString(),
        projectId
      }, { merge: true });
      console.info(`[Firebase] Connected to Cloud Firestore successfully (Project: ${projectId})`);
      return true;
    } catch (err: any) {
      console.error('[Firebase] Failed to connect:', err?.message || err);
      return false;
    }
  }

  async loadAppState(): Promise<AppStateData | null> {
    if (!this.firestore) return null;
    try {
      let metadata: any = null;
      if (this.root) {
        try {
          const metaDoc = await this.root.get();
          if (metaDoc.exists) {
            metadata = metaDoc.data();
          }
        } catch (_) {}
      }

      const state: Record<string, any> = {};
      let totalLoadedDocs = 0;

      await Promise.all(stateCollections.map(async ({ key, collection }) => {
        try {
          // 1. Try subcollection under dusttown/appState/collection
          let snapshot: FirebaseFirestore.QuerySnapshot | null = null;
          if (this.root) {
            snapshot = await this.root.collection(collection).get();
          }

          // 2. Fallback to top-level collection /collection if empty
          if (!snapshot || snapshot.empty) {
            const rootSnapshot = await this.firestore!.collection(collection).get();
            if (!rootSnapshot.empty) {
              snapshot = rootSnapshot;
            }
          }

          if (snapshot && !snapshot.empty) {
            totalLoadedDocs += snapshot.docs.length;
            this.collectionHashes.set(collection, new Map(snapshot.docs.map(document => [document.id, dataHash(document.data())])));
            state[key] = snapshot.docs
              .map(document => ({ data: document.data(), index: document.data().__sortIndex }))
              .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
              .map(({ data }) => {
                const { __sortIndex: _sortIndex, ...item } = data;
                return item;
              });
          } else {
            state[key] = [];
          }
        } catch (colErr: any) {
          console.error(`[Firebase] Failed to load collection ${collection}:`, colErr?.message || colErr);
          state[key] = [];
        }
      }));

      if (totalLoadedDocs === 0 && !metadata) {
        console.info('[Firebase] No documents found in Firestore collections');
        return null;
      }

      console.info(`[Firebase] Successfully retrieved ${totalLoadedDocs} documents from Cloud Firestore`);
      const meta = metadata || {};
      return {
        ...state,
        schemaVersion: meta.schemaVersion,
        lastUpdated: meta.lastUpdated,
        syncVersion: meta.syncVersion
      } as AppStateData;
    } catch (err: any) {
      console.error('[Firebase] Failed to loadAppState:', err?.message || err);
      return null;
    }
  }

  async saveAppState(state: AppStateData): Promise<AppStateData> {
    if (!this.firestore || !this.root) return state;
    try {
      const normalized = await this.externalizeInlineImages(state) as AppStateData;
      const writer = this.firestore.bulkWriter();
      await this.replaceStateCollections(writer, normalized);
      await writer.close();
      await this.root.set({
        schemaVersion: normalized.schemaVersion || 0,
        lastUpdated: normalized.lastUpdated || new Date().toISOString(),
        syncVersion: normalized.syncVersion || 0,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return normalized;
    } catch (err) {
      console.error('[Firebase] saveAppState error:', err);
      throw err;
    }
  }

  async loadChatState(): Promise<CloudChatState | null> {
    if (!this.root) return null;
    try {
      const rootSnapshot = await this.root.get();
      if (!rootSnapshot.exists) return null;

      const [messages, nukeAlerts] = await Promise.all([
        this.root.collection('chatMessages').get(),
        this.root.collection('nukeAlerts').get()
      ]);
      this.collectionHashes.set('chatMessages', new Map(messages.docs.map(document => [document.id, dataHash(document.data())])));
      this.collectionHashes.set('nukeAlerts', new Map(nukeAlerts.docs.map(document => [document.id, dataHash(document.data())])));
      const state = {
        messages: messages.docs
          .map(document => ({ data: document.data(), index: document.data().__sortIndex }))
          .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
          .map(({ data }) => {
            const { __sortIndex: _sortIndex, ...message } = data;
            return message as ChatMessage;
          }),
        nukeAlerts: nukeAlerts.docs
          .map(document => ({ data: document.data(), index: document.data().__sortIndex }))
          .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
          .map(({ data }) => {
            const { __sortIndex: _sortIndex, ...alert } = data;
            return alert as NukeBroadcastAlert;
          })
      };
      return state.messages.length || state.nukeAlerts.length ? state : null;
    } catch (err) {
      console.error('[Firebase] loadChatState error:', err);
      return null;
    }
  }

  async saveChatState(state: CloudChatState): Promise<CloudChatState> {
    if (!this.firestore || !this.root) return state;
    try {
      const normalized = await this.externalizeInlineImages(state) as CloudChatState;
      const writer = this.firestore.bulkWriter();
      const operations = [
        this.replaceCollection(writer, 'chatMessages', normalized.messages || []),
        this.replaceCollection(writer, 'nukeAlerts', normalized.nukeAlerts || [])
      ];
      await Promise.all(operations);
      await writer.close();
      return normalized;
    } catch (err) {
      console.error('[Firebase] saveChatState error:', err);
      throw err;
    }
  }

  private async replaceStateCollections(writer: BulkWriter, state: AppStateData) {
    await Promise.all(stateCollections.map(({ key, collection }) => {
      const items = Array.isArray(state[key]) ? state[key] as any[] : [];
      return this.replaceCollection(writer, collection, items);
    }));
  }

  private async replaceCollection(writer: BulkWriter, name: string, items: any[]) {
    if (!this.root) return;
    const collection = this.root.collection(name);
    let oldHashes = this.collectionHashes.get(name);
    if (!oldHashes) {
      const snapshot = await collection.get();
      oldHashes = new Map(snapshot.docs.map(document => [document.id, dataHash(document.data())]));
      this.collectionHashes.set(name, oldHashes);
    }
    const desiredHashes = new Map<string, string>();
    const operations: Array<Promise<any>> = [];

    for (const [id] of oldHashes) {
      if (!items.some((item, index) => documentId(item, index) === id)) {
        operations.push(writer.delete(collection.doc(id)));
      }
    }
    items.forEach((item, index) => {
      const id = documentId(item, index);
      const payload = { ...cleanFirestoreData(jsonClone(item)), __sortIndex: index };
      const hash = dataHash(payload);
      desiredHashes.set(id, hash);
      if (oldHashes!.get(id) !== hash) operations.push(writer.set(collection.doc(id), payload));
    });
    await Promise.all(operations);
    this.collectionHashes.set(name, desiredHashes);
  }

  private async externalizeInlineImages<T>(value: T): Promise<T> {
    const cache = new Map<string, Promise<string>>();
    const visit = async (current: any): Promise<any> => {
      if (typeof current === 'string' && current.startsWith('data:image/')) {
        if (!cache.has(current)) cache.set(current, this.uploadInlineImage(current));
        return cache.get(current);
      }
      if (Array.isArray(current)) return Promise.all(current.map(visit));
      if (current && typeof current === 'object') {
        const entries = await Promise.all(Object.entries(current).map(async ([key, item]) => [key, await visit(item)]));
        return Object.fromEntries(entries);
      }
      return current;
    };
    return visit(value);
  }

  public async uploadInlineImage(dataUrl: string): Promise<string> {
    const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/);
    if (!match) return dataUrl;

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 25 * 1024 * 1024) throw new Error('Inline image exceeds the 25 MB storage limit');

    const digest = createHash('sha256').update(buffer).digest('hex');
    const extension = contentType.split('/')[1].replace('+xml', '') || 'image';

    // 1. Try Firebase Storage if bucket is available
    if (this.bucket) {
      try {
        const objectName = `user-media/${digest.slice(0, 2)}/${digest}.${extension}`;
        const file = this.bucket.file(objectName);
        const [exists] = await file.exists();
        let token: string | undefined;

        if (exists) {
          const [metadata] = await file.getMetadata();
          const downloadTokens = metadata.metadata?.firebaseStorageDownloadTokens;
          token = typeof downloadTokens === 'string' ? downloadTokens.split(',')[0] : undefined;
        }
        if (!token) {
          token = randomUUID();
          await file.save(buffer, {
            resumable: false,
            metadata: {
              contentType,
              cacheControl: 'public,max-age=31536000,immutable',
              metadata: { firebaseStorageDownloadTokens: token }
            }
          });
        }
        return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(this.bucket.name)}/o/${encodeURIComponent(objectName)}?alt=media&token=${token}`;
      } catch (storageErr) {
        console.warn('[Firebase Storage] Failed to upload to bucket, falling back to local disk:', storageErr);
      }
    }

    // 2. Fallback to local disk storage in public/uploads/
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `${digest}.${extension}`;
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, buffer);
      }
      return `/uploads/${filename}`;
    } catch (fsErr) {
      console.warn('[Storage] Failed to save image locally, preserving data URL:', fsErr);
      return dataUrl;
    }
  }
}
