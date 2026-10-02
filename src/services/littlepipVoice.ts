import { GoogleGenAI, Modality } from '@google/genai';

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
    contents: [{
      role: 'user' as const,
      parts: [{ text }]
    }],
    config: {
      systemInstruction: 'Ты синтезируешь русскую речь. Произнеси только текст пользователя, без перевода, вступления, комментариев и добавленных слов. Голос молодой женский, тёплый и живой, с лёгкой игривой звонкостью; говори естественно, уверенно и разборчиво, без чрезмерно высокого или детского звучания.',
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        languageCode: 'ru-RU',
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
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
      const response = await client.models.generateContent({
        model: TTS_MODEL,
        ...buildLittlepipSpeechRequest(speechText, voiceName)
      });
      const audioPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
      const inlineData = audioPart?.inlineData;
      if (!inlineData?.data) throw new Error(`Gemini TTS returned no audio data for ${voiceName}`);

      const audio = Buffer.from(inlineData.data, 'base64');
      if (inlineData.mimeType?.includes('wav')) return audio;

      const sampleRate = Number(inlineData.mimeType?.match(/rate=(\d+)/)?.[1] || 24000);
      return pcmToWav(audio, sampleRate);
    } catch (error) {
      lastError = error;
      console.warn(`[Littlepip TTS] Voice ${voiceName} failed:`, error);
    }
  }

  throw new Error('All configured Littlepip TTS voices failed', { cause: lastError });
}