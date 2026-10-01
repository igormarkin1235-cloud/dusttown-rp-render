import { GoogleGenAI, Modality } from '@google/genai';

const TTS_MODEL = 'gemini-3.8-flash-lite-tts';

export function buildLittlepipSpeechRequest(text: string) {
  return {
    contents: [{
      role: 'user' as const,
      parts: [{ text }]
    }],
    config: {
      systemInstruction: 'Ты синтезируешь русскую речь. Произнеси только текст пользователя, без перевода, вступления, комментариев и добавленных слов. Голос мягкий, тёплый, молодой женский, с лёгкой игривой звонкостью и чуть повышенной высотой; говори естественно и разборчиво, не детским голосом.',
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        languageCode: 'ru-RU',
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' }
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
  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model: TTS_MODEL,
    ...buildLittlepipSpeechRequest(text)
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
  const inlineData = audioPart?.inlineData;
  if (!inlineData?.data) throw new Error('Gemini TTS returned no audio data');

  const audio = Buffer.from(inlineData.data, 'base64');
  if (inlineData.mimeType?.includes('wav')) return audio;

  const sampleRate = Number(inlineData.mimeType?.match(/rate=(\d+)/)?.[1] || 24000);
  return pcmToWav(audio, sampleRate);
}