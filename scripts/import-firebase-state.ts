import 'dotenv/config';
import fs from 'node:fs';
import { CloudChatState, FirebaseCloudStore } from '../src/services/firebaseCloud';
import { migrateAppState } from '../src/services/dataMigrations';
import { AppStateData } from '../src/types';

async function main() {
  const exportPath = process.env.FIREBASE_IMPORT_STATE_FILE;
  if (!exportPath) throw new Error('Set FIREBASE_IMPORT_STATE_FILE to a downloaded /api/data JSON export');

  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  const state = (exported.appState || exported) as AppStateData;
  const chatState = exported.chatState as CloudChatState | undefined;
  if (!state || !Array.isArray(state.profiles) || state.profiles.length === 0) {
    throw new Error('The export must contain a non-empty profiles array');
  }

  const cloud = new FirebaseCloudStore();
  if (!await cloud.connect()) {
    throw new Error('Set FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_STORAGE_BUCKET before importing');
  }

  const migration = migrateAppState(state);
  await cloud.saveAppState(migration.data);
  if (chatState) await cloud.saveChatState(chatState);
  console.info(`Imported ${migration.data.profiles.length} profiles, ${(migration.data.events || []).length} events, and ${migration.data.characters.length} characters.`);
  if (chatState) console.info(`Imported ${(chatState.messages || []).length} chat message(s).`);
  console.info(`Migration v${migration.data.schemaVersion}: refunded ${migration.refundedBackgrounds} obsolete cosmetics and removed ${migration.removedEvents} incompatible events.`);
}

main().catch(error => {
  console.error('Firebase state import failed:', error.message);
  process.exitCode = 1;
});