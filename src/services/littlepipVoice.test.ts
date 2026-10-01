import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLittlepipSpeechRequest, pcmToWav } from './littlepipVoice';

test('sends only the Russian reply as speech content, not English voice directions', () => {
  const reply = 'Привет, я рада тебя слышать!';
  const request = buildLittlepipSpeechRequest(reply);
  const spokenContent = request.contents.flatMap(content => content.parts.map(part => part.text)).join(' ');

  assert.equal(spokenContent, reply);
  assert.match(request.config.systemInstruction, /Произнеси только текст пользователя/);
  assert.match(request.config.systemInstruction, /молодой женский/);
  assert.equal(request.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Aoede');
  assert.doesNotMatch(spokenContent, /Read this Russian message|warm|feminine voice/i);
});

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