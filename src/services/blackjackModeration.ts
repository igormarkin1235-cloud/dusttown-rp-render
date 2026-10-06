/**
 * BLACKJACK MODERATION & BLACKLIST ENGINE
 * 
 * Управление черным списком:
 * - Временные и постоянные муты (с таймштампом истечения)
 * - Баны (выдворение из чата/сообщества)
 * - Блокировка активности в боте и Mini App
 * - Обязательная фиксация причины каждого действия
 */

import fs from 'fs';
import path from 'path';
import { loadBlackjackConfig } from './blackjackConfig';

export interface MuteRecord {
  id: string;
  targetUser: string; // @username or ID
  targetDisplayName?: string;
  adminUser: string;
  reason: string;
  durationMinutes: number;
  mutedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  revokedAt?: string;
  revokeReason?: string;
}

export interface BanRecord {
  id: string;
  targetUser: string;
  targetDisplayName?: string;
  adminUser: string;
  reason: string;
  bannedAt: string;
  status: 'active' | 'revoked';
  revokedAt?: string;
  revokeReason?: string;
}

export interface BotBlockRecord {
  id: string;
  targetUser: string;
  targetDisplayName?: string;
  adminUser: string;
  reason: string;
  durationMinutes?: number;
  blockedAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  revokedAt?: string;
  revokeReason?: string;
}

export interface BlackjackModerationState {
  mutes: MuteRecord[];
  bans: BanRecord[];
  botBlocks: BotBlockRecord[];
  auditLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    admin: string;
    target: string;
    reason: string;
    details?: string;
  }>;
}

const MODERATION_FILE = path.resolve(process.cwd(), '.blackjack_moderation.json');

const INITIAL_STATE: BlackjackModerationState = {
  mutes: [],
  bans: [],
  botBlocks: [],
  auditLogs: []
};

export function loadModerationState(): BlackjackModerationState {
  try {
    if (fs.existsSync(MODERATION_FILE)) {
      const raw = fs.readFileSync(MODERATION_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      // Auto-expire stale mutes and bot-blocks
      const now = Date.now();
      const updatedMutes = (parsed.mutes || []).map((m: MuteRecord) => {
        if (m.status === 'active' && new Date(m.expiresAt).getTime() <= now) {
          return { ...m, status: 'expired' as const };
        }
        return m;
      });
      const updatedBotBlocks = (parsed.botBlocks || []).map((b: BotBlockRecord) => {
        if (b.status === 'active' && b.expiresAt && new Date(b.expiresAt).getTime() <= now) {
          return { ...b, status: 'expired' as const };
        }
        return b;
      });
      return {
        mutes: updatedMutes,
        bans: parsed.bans || [],
        botBlocks: updatedBotBlocks,
        auditLogs: parsed.auditLogs || []
      };
    }
  } catch (err) {
    console.warn('Could not read .blackjack_moderation.json:', err);
  }
  return INITIAL_STATE;
}

export function saveModerationState(state: BlackjackModerationState): void {
  try {
    fs.writeFileSync(MODERATION_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save .blackjack_moderation.json:', err);
  }
}

/**
 * Execute Telegram API call for moderation (e.g. restrictChatMember, banChatMember)
 */
export async function executeTelegramModerationAction(
  chatId: string | number,
  userId: string | number,
  action: 'mute' | 'unmute' | 'ban' | 'unban',
  untilDateTimestamp?: number
): Promise<{ success: boolean; error?: string }> {
  const cfg = loadBlackjackConfig();
  const bjToken = process.env.BLACKJACK_TELEGRAM_BOT_TOKEN || cfg.telegramBotToken;
  const pipToken = process.env.TELEGRAM_BOT_TOKEN;
  const candidateTokens = [bjToken, pipToken].filter((t): t is string => Boolean(t && t.length > 10));
  if (candidateTokens.length === 0) return { success: false, error: 'Ни один токен Telegram не настроен' };

  // Telegram requires numeric user ID for restrictChatMember and banChatMember
  let numericUserId: number | undefined;
  if (typeof userId === 'number') {
    numericUserId = userId;
  } else if (typeof userId === 'string') {
    const cleanId = userId.replace(/^@id/, '').replace(/^id/, '').replace(/^@/, '');
    if (/^\d+$/.test(cleanId)) {
      numericUserId = parseInt(cleanId, 10);
    }
  }

  if (!numericUserId || isNaN(numericUserId)) {
    return {
      success: false,
      error: `Невозможно применить Telegram ограничение: user_id [${userId}] не является числовым ID Telegram. Ответьте на сообщение нарушителя через reply.`
    };
  }

  try {
    let endpoint = '';
    let body: any = { chat_id: chatId, user_id: numericUserId };

    if (action === 'mute') {
      endpoint = 'restrictChatMember';
      body.permissions = {
        can_send_messages: false,
        can_send_audios: false,
        can_send_documents: false,
        can_send_photos: false,
        can_send_videos: false,
        can_send_video_notes: false,
        can_send_voice_notes: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
        can_change_info: false,
        can_invite_users: false,
        can_pin_messages: false,
        can_manage_topics: false
      };
      if (untilDateTimestamp) {
        body.until_date = Math.floor(untilDateTimestamp / 1000);
      }
    } else if (action === 'unmute') {
      endpoint = 'restrictChatMember';
      body.permissions = {
        can_send_messages: true,
        can_send_audios: true,
        can_send_documents: true,
        can_send_photos: true,
        can_send_videos: true,
        can_send_video_notes: true,
        can_send_voice_notes: true,
        can_send_polls: true,
        can_send_other_messages: true,
        can_add_web_page_previews: true,
        can_invite_users: true
      };
    } else if (action === 'ban') {
      endpoint = 'banChatMember';
      if (untilDateTimestamp) {
        body.until_date = Math.floor(untilDateTimestamp / 1000);
      }
    } else if (action === 'unban') {
      endpoint = 'unbanChatMember';
      body.only_if_banned = true;
    }

    let lastError = 'Telegram API call failed';
    for (const token of candidateTokens) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        if (data.ok) {
          return { success: true };
        } else {
          lastError = data.description || 'Telegram API call failed';
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error';
      }
    }
    return { success: false, error: lastError };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Issue a mute
 */
export function issueMute(
  targetUser: string,
  adminUser: string,
  reason: string,
  durationMinutes: number = 10,
  targetDisplayName?: string
): MuteRecord {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim();
  const now = new Date();
  const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);

  // Invalidate any previous active mutes for this target
  state.mutes.forEach(m => {
    if (m.targetUser.toLowerCase() === cleanTarget.toLowerCase() && m.status === 'active') {
      m.status = 'revoked';
      m.revokedAt = now.toISOString();
      m.revokeReason = 'Заменён новым мутом';
    }
  });

  const record: MuteRecord = {
    id: `mute_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetUser: cleanTarget,
    targetDisplayName,
    adminUser,
    reason: reason || 'Нарушение дисциплины в чате',
    durationMinutes,
    mutedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    status: 'active'
  };

  state.mutes.unshift(record);
  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: now.toISOString(),
    action: 'MUTE',
    admin: adminUser,
    target: cleanTarget,
    reason: record.reason,
    details: `Длительность: ${durationMinutes} минут (до ${expires.toLocaleTimeString()})`
  });

  saveModerationState(state);
  return record;
}

/**
 * Revoke an active mute
 */
export function revokeMute(
  targetUser: string,
  adminUser: string,
  reason: string
): { success: boolean; message: string; record?: MuteRecord } {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim().toLowerCase();
  const activeMute = state.mutes.find(
    m => m.targetUser.toLowerCase() === cleanTarget && m.status === 'active'
  );

  if (!activeMute) {
    return {
      success: false,
      message: `У пользователя ${targetUser} нет активного мута.`
    };
  }

  activeMute.status = 'revoked';
  activeMute.revokedAt = new Date().toISOString();
  activeMute.revokeReason = reason || 'Амнистия администратора';

  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UNMUTE',
    admin: adminUser,
    target: targetUser,
    reason: activeMute.revokeReason
  });

  saveModerationState(state);
  return {
    success: true,
    message: `Мут с ${targetUser} снят. Причина: ${activeMute.revokeReason}`,
    record: activeMute
  };
}

/**
 * Issue a ban
 */
export function issueBan(
  targetUser: string,
  adminUser: string,
  reason: string,
  targetDisplayName?: string
): BanRecord {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim();
  const now = new Date();

  // Invalidate previous active bans
  state.bans.forEach(b => {
    if (b.targetUser.toLowerCase() === cleanTarget.toLowerCase() && b.status === 'active') {
      b.status = 'revoked';
      b.revokedAt = now.toISOString();
    }
  });

  const record: BanRecord = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetUser: cleanTarget,
    targetDisplayName,
    adminUser,
    reason: reason || 'Грубое нарушение правил сообщества',
    bannedAt: now.toISOString(),
    status: 'active'
  };

  state.bans.unshift(record);
  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: now.toISOString(),
    action: 'BAN',
    admin: adminUser,
    target: cleanTarget,
    reason: record.reason
  });

  saveModerationState(state);
  return record;
}

/**
 * Revoke a ban
 */
export function revokeBan(
  targetUser: string,
  adminUser: string,
  reason: string
): { success: boolean; message: string; record?: BanRecord } {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim().toLowerCase();
  const activeBan = state.bans.find(
    b => b.targetUser.toLowerCase() === cleanTarget && b.status === 'active'
  );

  if (!activeBan) {
    return {
      success: false,
      message: `Пользователь ${targetUser} не находится в бане.`
    };
  }

  activeBan.status = 'revoked';
  activeBan.revokedAt = new Date().toISOString();
  activeBan.revokeReason = reason || 'Снятие бана администрацией';

  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'UNBAN',
    admin: adminUser,
    target: targetUser,
    reason: activeBan.revokeReason
  });

  saveModerationState(state);
  return {
    success: true,
    message: `Бан с ${targetUser} снят. Причина: ${activeBan.revokeReason}`,
    record: activeBan
  };
}

/**
 * Block user bot/mini-app activity
 */
export function blockBotActivity(
  targetUser: string,
  adminUser: string,
  reason: string,
  durationMinutes: number = 60,
  targetDisplayName?: string
): BotBlockRecord {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

  state.botBlocks.forEach(b => {
    if (b.targetUser.toLowerCase() === cleanTarget.toLowerCase() && b.status === 'active') {
      b.status = 'revoked';
      b.revokedAt = now.toISOString();
      b.revokeReason = 'Перезаписано новой блокировкой';
    }
  });

  const record: BotBlockRecord = {
    id: `botblock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    targetUser: cleanTarget,
    targetDisplayName,
    adminUser,
    reason: reason || 'Злоупотребление функционалом бота',
    durationMinutes,
    blockedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active'
  };

  state.botBlocks.unshift(record);
  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: now.toISOString(),
    action: 'BOT_BLOCK',
    admin: adminUser,
    target: cleanTarget,
    reason: record.reason,
    details: `Срок: ${durationMinutes} мин (до ${expiresAt.toISOString()})`
  });

  saveModerationState(state);
  return record;
}

/**
 * Unblock user bot/mini-app activity
 */
export function unblockBotActivity(
  targetUser: string,
  adminUser: string,
  reason: string
): { success: boolean; message: string; record?: BotBlockRecord } {
  const state = loadModerationState();
  const cleanTarget = targetUser.trim().toLowerCase();
  const activeBlock = state.botBlocks.find(
    b => b.targetUser.toLowerCase() === cleanTarget && b.status === 'active'
  );

  if (!activeBlock) {
    return {
      success: false,
      message: `У пользователя ${targetUser} нет активной блокировки активности бота.`
    };
  }

  activeBlock.status = 'revoked';
  activeBlock.revokedAt = new Date().toISOString();
  activeBlock.revokeReason = reason || 'Разблокировка активности бота';

  state.auditLogs.unshift({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'BOT_UNBLOCK',
    admin: adminUser,
    target: targetUser,
    reason: activeBlock.revokeReason
  });

  saveModerationState(state);
  return {
    success: true,
    message: `Блокировка активности бота с ${targetUser} снята. Причина: ${activeBlock.revokeReason}`,
    record: activeBlock
  };
}

/**
 * Checks if a user is currently muted, banned, or bot-blocked
 */
export function getPlayerRestrictions(targetUser: string): {
  isMuted: boolean;
  muteRecord?: MuteRecord;
  isBanned: boolean;
  banRecord?: BanRecord;
  isBotBlocked: boolean;
  botBlockRecord?: BotBlockRecord;
} {
  const state = loadModerationState();
  const clean = targetUser.trim().toLowerCase();
  const now = Date.now();

  const muteRecord = state.mutes.find(m =>
    m.targetUser.toLowerCase() === clean &&
    m.status === 'active' &&
    new Date(m.expiresAt).getTime() > now
  );
  const banRecord = state.bans.find(b => b.targetUser.toLowerCase() === clean && b.status === 'active');
  const botBlockRecord = state.botBlocks.find(b =>
    b.targetUser.toLowerCase() === clean &&
    b.status === 'active' &&
    (!b.expiresAt || new Date(b.expiresAt).getTime() > now)
  );

  return {
    isMuted: Boolean(muteRecord),
    muteRecord,
    isBanned: Boolean(banRecord),
    banRecord,
    isBotBlocked: Boolean(botBlockRecord),
    botBlockRecord
  };
}

/**
 * Generates formatted Blacklist overview for chat or UI
 */
export function generateBlacklistReport(): string {
  const state = loadModerationState();
  const activeMutes = state.mutes.filter(m => m.status === 'active');
  const activeBans = state.bans.filter(b => b.status === 'active');
  const activeBlocks = state.botBlocks.filter(b => b.status === 'active');

  const total = activeMutes.length + activeBans.length + activeBlocks.length;

  if (total === 0) {
    return `📋 **Чёрный список Пустоши чист.**\nНа данный момент ни у кого нет активных мутов, банов или блокировок в боте. В секторе тишина и порядок.`;
  }

  let text = `📋 **ЧЁРНЫЙ СПИСОК СТОЙЛА 99 / DUSTTOWN RP**\n` +
    `_Офицер безопасности Блэкджек докладывает текущую сводку:_\n\n`;

  if (activeMutes.length > 0) {
    text += `🔇 **В муте (${activeMutes.length}):**\n`;
    activeMutes.forEach((m, idx) => {
      const expires = new Date(m.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      text += `${idx + 1}. **${m.targetUser}** (до ${expires})\n   └ Причина: ${m.reason} [выдал: ${m.adminUser}]\n`;
    });
    text += '\n';
  }

  if (activeBans.length > 0) {
    text += `⛔ **В перманентном бане (${activeBans.length}):**\n`;
    activeBans.forEach((b, idx) => {
      text += `${idx + 1}. **${b.targetUser}**\n   └ Причина: ${b.reason} [выдал: ${b.adminUser}]\n`;
    });
    text += '\n';
  }

  if (activeBlocks.length > 0) {
    text += `🤖 **Блокировка активности в боте (${activeBlocks.length}):**\n`;
    activeBlocks.forEach((bb, idx) => {
      const expires = bb.expiresAt
        ? ` (до ${new Date(bb.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        : '';
      text += `${idx + 1}. **${bb.targetUser}**${expires}\n   └ Причина: ${bb.reason} [выдал: ${bb.adminUser}]\n`;
    });
    text += '\n';
  }

  text += `_Для снятия ограничения укажи команду: «Блэкджек, сними мут с @пользователь по причине [причина]»._`;
  return text;
}
