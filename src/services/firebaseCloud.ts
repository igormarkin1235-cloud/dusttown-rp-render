import { createHash, randomUUID } from 'crypto';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { BulkWriter, Firestore, getFirestore, DocumentReference } from 'firebase-admin/firestore';
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
  private root: DocumentReference | null = null;
  private collectionHashes = new Map<string, Map<string, string>>();

  async connect(): Promise<boolean> {
    const accountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!accountJson && !bucketName) return false;
    if (!accountJson || !bucketName) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET must both be configured');
    }

    const serviceAccount = JSON.parse(accountJson);
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const appName = 'dusttown-rp-cloud';
    const app: App = getApps().find((candidate: any) => candidate.name === appName) || initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName
    }, appName);

    this.firestore = getFirestore(app);
    this.bucket = getStorage(app).bucket(bucketName);
    this.root = this.firestore.collection('dusttown').doc('appState');
    await this.bucket.getMetadata();
    await this.firestore.doc('dusttown/health').set({ checkedAt: new Date().toISOString() }, { merge: true });
    return true;
  }

  async loadAppState(): Promise<AppStateData | null> {
    if (!this.root) return null;
    const metadata = await this.root.get();
    if (!metadata.exists) return null;

    const state: Record<string, any> = {};
    await Promise.all(stateCollections.map(async ({ key, collection }) => {
      const snapshot = await this.root!.collection(collection).get();
      this.collectionHashes.set(collection, new Map(snapshot.docs.map((doc: any) => [doc.id, dataHash(doc.data())])));
      state[key] = snapshot.docs
        .map((doc: any) => ({ data: doc.data(), index: doc.data().__sortIndex }))
        .sort((left: any, right: any) => (left.index ?? 0) - (right.index ?? 0))
        .map(({ data }: any) => {
          const { __sortIndex: _sortIndex, ...item } = data;
          return item;
        });
    }));

    const meta = metadata.data() || {};
    return {
      ...state,
      schemaVersion: meta.schemaVersion,
      lastUpdated: meta.lastUpdated,
      syncVersion: meta.syncVersion
    } as AppStateData;
  }

  async saveAppState(state: AppStateData): Promise<AppStateData> {
    if (!this.firestore || !this.root) return state;
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
  }

  async loadChatState(): Promise<CloudChatState | null> {
    if (!this.root) return null;
    const rootSnapshot = await this.root.get();
    if (!rootSnapshot.exists) return null;

    const [messages, nukeAlerts] = await Promise.all([
      this.root.collection('chatMessages').get(),
      this.root.collection('nukeAlerts').get()
    ]);
    this.collectionHashes.set('chatMessages', new Map(messages.docs.map((doc: any) => [doc.id, dataHash(doc.data())])));
    this.collectionHashes.set('nukeAlerts', new Map(nukeAlerts.docs.map((doc: any) => [doc.id, dataHash(doc.data())])));
    const state = {
      messages: messages.docs
        .map((doc: any) => ({ data: doc.data(), index: doc.data().__sortIndex }))
        .sort((left: any, right: any) => (left.index ?? 0) - (right.index ?? 0))
        .map(({ data }: any) => {
          const { __sortIndex: _sortIndex, ...message } = data;
          return message as ChatMessage;
        }),
      nukeAlerts: nukeAlerts.docs
        .map((doc: any) => ({ data: doc.data(), index: doc.data().__sortIndex }))
        .sort((left: any, right: any) => (left.index ?? 0) - (right.index ?? 0))
        .map(({ data }: any) => {
          const { __sortIndex: _sortIndex, ...alert } = data;
          return alert as NukeBroadcastAlert;
        })
    };
    return state.messages.length || state.nukeAlerts.length ? state : null;
  }

  async saveChatState(state: CloudChatState): Promise<CloudChatState> {
    if (!this.firestore || !this.root) return state;
    const normalized = await this.externalizeInlineImages(state) as CloudChatState;
    const writer = this.firestore.bulkWriter();
    const operations = [
      this.replaceCollection(writer, 'chatMessages', normalized.messages || []),
      this.replaceCollection(writer, 'nukeAlerts', normalized.nukeAlerts || [])
    ];
    await Promise.all(operations);
    await writer.close();
    return normalized;
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
      oldHashes = new Map(snapshot.docs.map((doc: any) => [doc.id, dataHash(doc.data())]));
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
      const payload = { ...jsonClone(item), __sortIndex: index };
      const hash = dataHash(payload);
      desiredHashes.set(id, hash);
      if (oldHashes.get(id) !== hash) operations.push(writer.set(collection.doc(id), payload));
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

  private async uploadInlineImage(dataUrl: string): Promise<string> {
    if (!this.bucket) throw new Error('Firebase Storage is not connected');
    const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,([\s\S]+)$/);
    if (!match) throw new Error('Unsupported inline image format');

    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 15 * 1024 * 1024) throw new Error('Inline image exceeds the 15 MB storage limit');

    const digest = createHash('sha256').update(buffer).digest('hex');
    const extension = contentType.split('/')[1].replace('+xml', '') || 'image';
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
  }
}