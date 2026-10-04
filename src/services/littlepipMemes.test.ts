import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  extractLittlepipMemeTag,
  getLittlepipMemeCatalog,
  listLittlepipMemeFiles,
  LittlepipMeme
} from './littlepipMemes';

test('finds newly added supported meme photos and ignores unrelated files', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'littlepip-memes-'));
  try {
    writeFileSync(path.join(directory, 'new meme (1).jpg'), 'image');
    writeFileSync(path.join(directory, 'another.png'), 'image');
    writeFileSync(path.join(directory, 'notes.txt'), 'not an image');

    const files = listLittlepipMemeFiles(directory);
    assert.equal(files.length, 2);
    assert.deepEqual(files.map(file => file.fileName), ['another.png', 'new meme (1).jpg']);
    assert.match(files[1].id, /^new-meme-1$/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('uses the checked-in annotated catalog without Gemini OCR', async () => {
  const memes = await getLittlepipMemeCatalog('unused-api-key');

  assert.equal(memes.length, 85);
  assert.ok(memes.every(meme => meme.ocrText && meme.description));
  assert.ok(memes.some(meme => meme.ocrText === 'Это шедевр'));
  assert.ok(memes.some(meme => meme.ocrText === 'Не умничай'));
});

test('extracts only a known meme marker and cleans it from the spoken reply', () => {
  const meme: LittlepipMeme = {
    id: 'meme-1',
    fileName: 'meme-1.jpg',
    filePath: '/unused/meme-1.jpg',
    fileHash: 'hash',
    ocrText: 'text',
    description: 'description'
  };

  const selected = extractLittlepipMemeTag('Вот это поворот! [MEME:meme-1]', [meme]);
  assert.equal(selected.cleanText, 'Вот это поворот!');
  assert.equal(selected.meme, meme);

  const unknown = extractLittlepipMemeTag('Ответ [MEME:unknown-id]', [meme]);
  assert.equal(unknown.cleanText, 'Ответ');
  assert.equal(unknown.meme, undefined);
});
