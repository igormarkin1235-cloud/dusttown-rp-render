import { ChatMessage, NukeBroadcastAlert } from '../types';

function telegramAuthHeaders(json = false): Record<string, string> {
  const initData = (window as any).Telegram?.WebApp?.initData || '';
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `tma ${initData}`
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Не удалось выполнить запрос чата');
  }
  return payload as T;
}

export async function fetchChatMessages(userId?: string, recipientId?: string): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  if (recipientId) params.set('recipientId', recipientId);
  const response = await fetch(`/api/chat/messages?${params}`, {
    cache: 'no-store',
    headers: telegramAuthHeaders()
  });
  const payload = await readJson<{ messages: ChatMessage[] }>(response);
  return payload.messages;
}

export async function sendChatMessage(input: {
  senderId: string;
  content: string;
  recipientId?: string;
  style?: ChatMessage['style'];
}): Promise<ChatMessage> {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: telegramAuthHeaders(true),
    body: JSON.stringify(input)
  });
  const payload = await readJson<{ message: ChatMessage }>(response);
  return payload.message;
}

export async function sendNukeMessage(content: string, senderId: string, style?: ChatMessage['style']): Promise<ChatMessage> {
  const response = await fetch('/api/chat/send', {
    method: 'POST',
    headers: telegramAuthHeaders(true),
    body: JSON.stringify({ content, senderId, isNuke: true, style })
  });
  const payload = await readJson<{ message: ChatMessage }>(response);
  return payload.message;
}

export async function fetchNukeAlerts(): Promise<NukeBroadcastAlert[]> {
  const response = await fetch('/api/chat/nuke-alerts', { cache: 'no-store' });
  const payload = await readJson<{ alerts: NukeBroadcastAlert[] }>(response);
  return payload.alerts;
}