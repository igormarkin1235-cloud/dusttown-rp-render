import assert from 'node:assert/strict';
import test from 'node:test';

import { buildLittlepipSpeechRequest, pcmToWav, sanitizeTextForSpeech } from './littlepipVoice';

test('sends only the Russian reply as speech content, not English voice directions', () => {
  const reply = 'Привет, я рада тебя слышать!';
  const request = buildLittlepipSpeechRequest(reply);
  const spokenContent = request.input
    .flatMap(input => input.content)
    .map(content => content.text)
    .join(' ');

  assert.equal(spokenContent, reply);
  assert.match(request.input[0].content[0].annotations[0].style, /feminine voice/);
  assert.equal(request.generation_config.speech_config[0].voice, 'Kore');
  assert.equal(request.generation_config.speech_config[0].language, 'ru-RU');
  assert.deepEqual(request.response_format, { type: 'audio', mime_type: 'audio/wav' });
  assert.doesNotMatch(spokenContent, /Read this Russian message|warm|feminine voice/i);
});

test('cleans markup and links before speech synthesis', () => {
  assert.equal(
    sanitizeTextForSpeech('**Привет!** Подробности: https://example.com'),
    'Привет! Подробности:'
  );
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