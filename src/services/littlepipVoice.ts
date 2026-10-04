import { GoogleGenAI, Modality } from '@google/genai';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const TTS_FALLBACK_VOICES = ['Puck', 'Zephyr', 'Kore'];

export const DEFAULT_GEMINI_KEY = 'AQ.Ab8RN6LodaR4rcIYJ_qGPaBkhwc5GoLFhqvKEWm_Djx8U7XVWw';

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
    .replace(/\[MEME(?:_[A-Z]+)?:\s*[^\]]+\]/gi, '')
    .replace(/\( ͡° ͜ʖ ͡°\)|¯\\_\(ツ\)_/g, '')
    .replace(/[:;]-?[)(DPpdOo3]/g, '')
    .replace(/\b(?:xd|xD|XD)\b/g, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[«»"']/g, '')
    .replace(/([!?.]){2,}/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildLittlepipSpeechRequest(text: string, voiceName = 'Kore') {
  return {
    contents: [{
      role: 'user' as const,
      parts: [{
        text,
        speechMetadata: {
          style: 'Young, energetic, cute, slightly squeaky and sweet cheerful teenage pony girl heroine voice, enthusiastic, melodic and ringing'
        }
      }]
    }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
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

// Применяет легкий питч-шифт (+15% к частоте дискретизации), делая голос звонким, чуточку писклявым и мягким
export function tuneWavPitch(wav: Buffer, pitchMultiplier = 1.15): Buffer {
  if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF') return wav;
  const originalRate = wav.readUInt32LE(24) || 24000;
  const tunedRate = Math.round(originalRate * pitchMultiplier);
  const channels = wav.readUInt16LE(22) || 1;
  const bitsPerSample = wav.readUInt16LE(34) || 16;
  const blockAlign = channels * Math.floor(bitsPerSample / 8);
  const byteRate = tunedRate * blockAlign;

  wav.writeUInt32LE(tunedRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  return wav;
}

/**
 * Синтезирует оригинальный голос Литлпип:
 * эмоциональный, мягкий, звонкий, чуть писклявый девичий голос сталкерши из Стойла 2.
 * Использует нейросетевую модель Microsoft Edge TTS (ru-RU-SvetlanaNeural с повышенным тоном +18%).
 */
async function generateEdgeTtsAudio(
  text: string,
  voiceName = 'ru-RU-SvetlanaNeural',
  pitch = '+14%',
  rate = '+4%'
): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  return new Promise<Buffer>((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    try {
      const { audioStream } = tts.toStream(text, { pitch, rate });
      const chunks: Buffer[] = [];

      timeoutId = setTimeout(() => {
        try { tts.close(); } catch (_) {}
        reject(new Error('Edge TTS generation timed out'));
      }, 10000);

      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => {
        if (timeoutId) clearTimeout(timeoutId);
        try { tts.close(); } catch (_) {}
        const audio = Buffer.concat(chunks);
        if (audio.length > 300) {
          resolve(audio);
        } else {
          reject(new Error('Edge TTS buffer too small'));
        }
      });
      audioStream.on('error', (err: Error | unknown) => {
        if (timeoutId) clearTimeout(timeoutId);
        try { tts.close(); } catch (_) {}
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      try { tts.close(); } catch (_) {}
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export async function generateLittlepipVoice(text: string, apiKey?: string): Promise<Buffer> {
  const clean = sanitizeTextForSpeech(text) || text;
  if (!clean || clean.length < 2) {
    throw new Error('Текст для озвучки пустой');
  }

  // Ограничиваем длину реплики для стабильной и быстрой генерации звука
  const speechText = clean.length > 500 ? clean.slice(0, 497) + '...' : clean;

  // 1. ПРИОРИТЕТ 1: Нейросетевой звонкий, мягкий, чуть писклявый девичий голос Литлпип (SvetlanaNeural +18% pitch)
  try {
    const audio = await generateEdgeTtsAudio(speechText, 'ru-RU-SvetlanaNeural', '+18%', '+6%');
    return audio;
  } catch (err: any) {
    console.warn('[Littlepip Voice] Edge SvetlanaTTS failed, trying DariyaNeural:', err?.message || err);
  }

  // 2. ПРИОРИТЕТ 2: Альтернативный женский нейроголос (DariyaNeural +16% pitch)
  try {
    const audio = await generateEdgeTtsAudio(speechText, 'ru-RU-DariyaNeural', '+16%', '+6%');
    return audio;
  } catch (err: any) {
    console.warn('[Littlepip Voice] Edge DariyaTTS failed, checking Gemini TTS:', err?.message || err);
  }

  // 3. ПРИОРИТЕТ 3: Gemini TTS (с питч-тюнингом)
  const candidateKeys = Array.from(
    new Set([DEFAULT_GEMINI_KEY, apiKey, process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY].filter(Boolean))
  ) as string[];

  let lastErr: any = null;

  for (const key of candidateKeys) {
    const client = new GoogleGenAI({ apiKey: key });
    for (const voice of TTS_FALLBACK_VOICES) {
      try {
        const response = await client.models.generateContent({
          model: TTS_MODEL,
          ...buildLittlepipSpeechRequest(speechText, voice)
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
        const inlineData = audioPart?.inlineData;
        if (!inlineData?.data) {
          throw new Error('Gemini TTS returned no audio data');
        }

        const audio = Buffer.from(inlineData.data, 'base64');
        const baseRate = Number(inlineData.mimeType?.match(/rate=(\d+)/)?.[1] || 24000);
        const wav = inlineData.mimeType?.includes('wav') ? audio : pcmToWav(audio, baseRate);
        return tuneWavPitch(wav, 1.15);
      } catch (err: any) {
        lastErr = err;
      }
    }
  }

  throw lastErr || new Error('Не удалось сгенерировать голос Литлпип');
}
