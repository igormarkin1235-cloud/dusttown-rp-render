import { GoogleGenAI } from '@google/genai';

const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const TTS_VOICES = ['Kore', 'Aoede', 'Zephyr'];

export function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLittlepipSpeechRequest(text: string, voiceName = 'Kore') {
  return {
    input: [{
      type: 'user_input' as const,
      content: [{
        type: 'text' as const,
        text,
        annotations: [{
          type: 'speech_metadata' as const,
          style: 'Speak in natural, clear, warm, lightly playful Russian with a youthful feminine voice.'
        }]
      }]
    }],
    response_format: { type: 'audio' as const, mime_type: 'audio/wav' as const },
    generation_config: {
      speech_config: [{ voice: voiceName, language: 'ru-RU' }]
    }
  };
}

export function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const wav = Buffer.alloc(44 + pcm.length);
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;

  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + pcm.length, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(pcm.length, 40);
  pcm.copy(wav, 44);
  return wav;
}

export async function generateLittlepipVoice(text: string, apiKey: string): Promise<Buffer> {
  const speechText = sanitizeTextForSpeech(text).slice(0, 500);
  if (!speechText) throw new Error('Текст для озвучки пустой');

  const client = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (const voiceName of TTS_VOICES) {
    try {
      const response = await client.interactions.create({
        model: TTS_MODEL,
        ...buildLittlepipSpeechRequest(speechText, voiceName)
      });
      const outputAudio = response.output_audio;
      if (!outputAudio?.data) throw new Error(`Gemini TTS returned no audio data for ${voiceName}`);

      const audio = Buffer.from(outputAudio.data, 'base64');
      if (outputAudio.mime_type?.includes('wav')) return audio;

      const sampleRate = outputAudio.sample_rate || 24000;
      return pcmToWav(audio, sampleRate);
    } catch (error) {
      lastError = error;
      console.warn(`[Littlepip TTS] Voice ${voiceName} failed:`, error);
      if (typeof error === 'object' && error !== null && 'status' in error && error.status === 429) {
        break;
      }
    }
  }

  throw new Error('All configured Littlepip TTS voices failed', { cause: lastError });
}