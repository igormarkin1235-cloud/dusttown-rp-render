import assert from 'node:assert/strict';
import test from 'node:test';

import { pcmToWav } from './littlepipVoice';

test('wraps generated PCM as a mono 24 kHz WAV file', () => {
  const pcm = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const wav = pcmToWav(pcm);

  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wav.readUInt32LE(24), 24000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
});