/**
 * BLACKJACK AI AGENT — DustTown Collective RP (Fallout: Equestria: Project Horizons)
 * 
 * Персонаж: Блэкджек (Blackjack / Джеки / Блэки / Дилер)
 * Источник лора: https://falloutequestria.fandom.com/ru/wiki/%D0%91%D0%BB%D1%8D%D0%BA%D0%B4%D0%B6%D0%B5%D0%BA_(Project_Horizons)
 * 
 * Основное назначение:
 * - Боевой ИИ-помощник администрации и шериф чата
 * - Распознавание команд модерации на естественном русском языке (мут, бан, блокировка в боте)
 * - Требование причины для каждого наказания или амнистии
 * - Отображение и ведение черного списка
 * - Проверка статуса игроков
 * - Связка с Литлпип (Пипкой): при нарушении Пипка зовет Блэкджек, та выдает 10 мин мута и тегает админов
 * - Защита от зацикливания между ботами (anti-loop guard)
 */

import { GoogleGenAI } from '@google/genai';
import { getBlackjackSystemPrompt } from './blackjackDossier';
import {
  loadBlackjackConfig,
  checkBlackjackTopicPermission,
  isAuthorizedBlackjackAdmin
} from './blackjackConfig';
import {
  issueMute,
  revokeMute,
  issueBan,
  revokeBan,
  blockBotActivity,
  unblockBotActivity,
  getPlayerRestrictions,
  generateBlacklistReport,
  executeTelegramModerationAction
} from './blackjackModeration';
import {
  getOrCreateBlackjackReputation,
  adjustBlackjackReputation,
  recordBlackjackInfraction
} from './blackjackReputation';
import { fetchBlackjackWikiDossier } from './projectHorizonsWiki';

export const BLACKJACK_GEMINI_MODEL = 'gemini-2.5-flash';

// Anti-loop trigger flag
let lastInterBotTriggerTime = 0;
const INTER_BOT_COOLDOWN_MS = 60 * 1000; // 1 minute minimum cooldown to prevent loops

export interface BlackjackCommandParseResult {
  isBlackjackTrigger: boolean;
  action: 'mute' | 'unmute' | 'ban' | 'unban' | 'bot_block' | 'bot_unblock' | 'blacklist' | 'status' | 'help' | 'chat';
  targetUser?: string;
  durationMinutes?: number;
  reason?: string;
  needsReasonPrompt?: boolean;
}

/**
 * Checks if a text mentions or addresses Blackjack
 */
export function hasBlackjackMention(text: string): boolean {
  if (!text) return false;
  return /(?:@?bleckjek(?:_bot)?|@?blackjack(?:_bot)?|блэкджек|блекджек|джеки|блэки|блеки|блэк|блек|дилер|шериф|секьюрити|security|blackjack|\/bj|\/blackjack|\/mute|\/unmute|\/ban|\/unban|\/blacklist|\/status|\/help)/iu.test(text);
}

/**
 * Fast deterministic parser for moderation commands in natural language
 */
export function parseModerationIntent(text: string): BlackjackCommandParseResult {
  const isTrigger = hasBlackjackMention(text);
  if (!isTrigger) {
    return { isBlackjackTrigger: false, action: 'chat' };
  }

  const clean = text.trim();

  // 1. Blacklist check
  if (/(?:ч[её]рный список|черный список|блеклист|blacklist|кто в муте|список наказан|список нарушител)/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'blacklist' };
  }

  // 2. Help command
  if (/(?:помощь|команды|что умеешь|help|\/help)/iu.test(clean) && !/(?:мут|бан|блокиров)/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'help' };
  }

  // Extract target @username or user
  const userMatch = clean.match(/@([a-zA-Z0-9_]{3,32})/);
  const targetUser = userMatch ? `@${userMatch[1]}` : undefined;

  // Extract duration: "на 10 минут", "на минут так 10", "на 15 мин", "на час"
  let durationMinutes = 10;
  const durMatch = clean.match(/(?:минут\s+так\s+(\d+)|\b(\d+)\s*(?:мин|минут|m)\b|на\s+(\d+)\s*(?:мин|минут)|на\s+(\d+)\s*(?:час|часа|часов)|(\d+)\s*(?:час|часа|часов|h))/iu);
  if (durMatch) {
    if (durMatch[1]) durationMinutes = parseInt(durMatch[1], 10);
    else if (durMatch[2]) durationMinutes = parseInt(durMatch[2], 10);
    else if (durMatch[3]) durationMinutes = parseInt(durMatch[3], 10);
    else if (durMatch[4]) durationMinutes = parseInt(durMatch[4], 10) * 60;
    else if (durMatch[5]) durationMinutes = parseInt(durMatch[5], 10) * 60;
  }

  // 3. Unmute
  if (/(?:сними\s+(?:с\s+(?:него|неё)\s+)?мут|размут|снять\s+мут|размути|\bunmute\b)/iu.test(clean)) {
    // Extract reason if present: "по причине [причина]", "за [причина]"
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    const reason = reasonMatch ? reasonMatch[1].trim() : undefined;
    return {
      isBlackjackTrigger: true,
      action: 'unmute',
      targetUser,
      reason,
      needsReasonPrompt: !reason
    };
  }

  // 4. Mute
  if (/(?:выдай\s+(?:ему\s+|ей\s+)?мут|кинь\s+(?:его\s+|её\s+)?в\s+мут|замуть|дай\s+(?:ему\s+|ей\s+)?мут|\bмут\b|заглуши|заткни|\bmute\b)/iu.test(clean)) {
    let reason: string | undefined;

    // Check specific "слишком ... умный" or descriptive phrasing
    const smartMatch = clean.match(/,\s*(слишком\s+[^,]+?),/iu) || clean.match(/(слишком\s+[^,]+)/iu);
    if (smartMatch) {
      reason = smartMatch[1].trim();
    } else {
      const reasonMatch = clean.match(/(?:по причине|причина|из-за|за|потому что)\s*[:\-—]?\s*(.+?)(?:\s*(?:на\s+\d+|на\s+минут|$))/iu);
      if (reasonMatch) reason = reasonMatch[1].trim();
    }

    return {
      isBlackjackTrigger: true,
      action: 'mute',
      targetUser,
      durationMinutes,
      reason: reason || 'Нарушение правил общения',
      needsReasonPrompt: false
    };
  }

  // 5. Unban
  if (/(?:разбан|сними бан|снять бан|разбань|unban)/iu.test(clean)) {
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    const reason = reasonMatch ? reasonMatch[1].trim() : undefined;
    return {
      isBlackjackTrigger: true,
      action: 'unban',
      targetUser,
      reason,
      needsReasonPrompt: !reason
    };
  }

  // 6. Ban
  if (/(?:выдай бан|забань|кинь в бан|вышвырни|ban)/iu.test(clean)) {
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    const reason = reasonMatch ? reasonMatch[1].trim() : undefined;
    return {
      isBlackjackTrigger: true,
      action: 'ban',
      targetUser,
      reason: reason || 'Грубейшее нарушение правил и дебош',
      needsReasonPrompt: false
    };
  }

  // 7. Bot block
  if (/(?:заблокируй в боте|блокни в боте|блокировка активности|запрети бота)/iu.test(clean)) {
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    return {
      isBlackjackTrigger: true,
      action: 'bot_block',
      targetUser,
      reason: reasonMatch ? reasonMatch[1].trim() : 'Нарушение правил использования бота'
    };
  }

  // 8. Bot unblock
  if (/(?:разблокируй в боте|сними блок с бота|верни доступ к боту)/iu.test(clean)) {
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    const reason = reasonMatch ? reasonMatch[1].trim() : undefined;
    return {
      isBlackjackTrigger: true,
      action: 'bot_unblock',
      targetUser,
      reason,
      needsReasonPrompt: !reason
    };
  }

  // 9. Status of player
  if (/(?:статус|что по|кто такой|досье|инфо|проверь)\s+@?/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'status', targetUser };
  }

  return { isBlackjackTrigger: true, action: 'chat' };
}

/**
 * Handle message with Blackjack AI Agent
 */
export async function handleBlackjackMessage(params: {
  text: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderId?: string;
  topicId?: string | number | null;
  chatId?: string | number;
  adminsList?: string[];
}): Promise<{
  replyText: string;
  actionTaken?: string;
  moderationRecord?: any;
  interBotTrigger?: string;
}> {
  const { text, senderUsername, senderDisplayName, senderId, topicId, chatId, adminsList } = params;

  // 1. Topic permission check
  const topicCheck = checkBlackjackTopicPermission(topicId);
  if (!topicCheck.canReply) {
    return {
      replyText: `🤐 _[Офицер Блэкджек: ${topicCheck.reason || 'В этом топике мне запрещено отвечать.'}]_`
    };
  }

  const isAdmin = isAuthorizedBlackjackAdmin(senderUsername);
  const intent = parseModerationIntent(text);

  // 2. Action: Blacklist report
  if (intent.action === 'blacklist') {
    const report = generateBlacklistReport();
    return {
      replyText: report,
      actionTaken: 'view_blacklist'
    };
  }

  // 3. Action: Help
  if (intent.action === 'help') {
    const wiki = await fetchBlackjackWikiDossier();
    return {
      replyText: `🛡️ **ОФИЦЕР БОЕВОЙ БЕЗОПАСНОСТИ БЛЭКДЖЕК (Project Horizons)**\n\n` +
        `Я старший офицер Стойла 99 и боевой помощник шерифов DustTown RP. Моя работа — порядок, наручники и картечь.\n\n` +
        `**Что я умею распознавать на русском языке:**\n` +
        `• 🔇 **Мут**: «Блэкджек, замуть @пользователь на 10 минут за флуд»\n` +
        `• 🔊 **Размут**: «Блэкджек, сними мут с @пользователь по причине [причина]»\n` +
        `• ⛔ **Бан**: «Блэкджек, вышвырни @пользователь за оскорбления»\n` +
        `• 🤖 **Блок в боте**: «Блэкджек, заблокируй активность в боте для @пользователь»\n` +
        `• 📋 **Черный список**: «Блэкджек, покажи черный список»\n` +
        `• 🔍 **Досье игрока**: «Блэкджек, статус @пользователь»\n\n` +
        `_Помни: на любое снятие или ограничение я требую внятную причину для рапорта._`
    };
  }

  // 4. Action: Player Status
  if (intent.action === 'status' && intent.targetUser) {
    const target = intent.targetUser;
    const restr = getPlayerRestrictions(target);
    const rep = getOrCreateBlackjackReputation(target, target, target);

    let statusMsg = `🔍 **ДОСЬЕ НАРУШИТЕЛЯ: ${target}**\n` +
      `• Репутация перед Блэкджек: **${rep.respectScore} / 100** (${rep.tierTitle})\n` +
      `• Предупреждений: **${rep.warningsCount}** | Мутов: **${rep.mutesCount}**\n\n`;

    if (restr.isMuted) {
      const exp = new Date(restr.muteRecord!.expiresAt).toLocaleTimeString();
      statusMsg += `🔇 **АКТИВНЫЙ МУТ**: до ${exp}\n   └ Причина: ${restr.muteRecord!.reason} [выдал: ${restr.muteRecord!.adminUser}]\n`;
    }
    if (restr.isBanned) {
      statusMsg += `⛔ **АКТИВНЫЙ БАН**: бессрочно\n   └ Причина: ${restr.banRecord!.reason}\n`;
    }
    if (restr.isBotBlocked) {
      statusMsg += `🤖 **БЛОКИРОВКА В БОТЕ**: доступ закрыт\n   └ Причина: ${restr.botBlockRecord!.reason}\n`;
    }
    if (!restr.isMuted && !restr.isBanned && !restr.isBotBlocked) {
      statusMsg += `✅ Ограничений нет. Оружие в кобуре, чист перед законом.`;
    }

    return { replyText: statusMsg, actionTaken: 'check_status' };
  }

  // 5. Moderation actions (Mute, Unmute, Ban, Unban, Bot Block)
  if (['mute', 'unmute', 'ban', 'unban', 'bot_block', 'bot_unblock'].includes(intent.action)) {
    if (!isAdmin) {
      return {
        replyText: `🚫 **Осади назад, бродяга.**\nУ тебя нет полномочий шерифа отдавать приказы службе безопасности Стойла 99. Командовать мутами и банами могут только администраторы сообщества.`
      };
    }

    if (!intent.targetUser) {
      return {
        replyText: `❓ **Шериф, а на кого наручники цеплять?**\nУкажи тег пользователя через @ (например, «Блэкджек, замуть @нарушитель на 10 минут за спам»).`
      };
    }

    // Checking if reason is missing for unmute / unban
    if (intent.needsReasonPrompt) {
      return {
        replyText: `⚠️ **Шериф, стоп! А по какой причине амнистия?**\n` +
          `Я не снимаю наказания без записи в журнале. Напиши: «Блэкджек, сними мут с ${intent.targetUser} по причине [твоя причина]», и я сразу открою камеру.`
      };
    }

    const adminTag = senderUsername || '@Admin';
    const target = intent.targetUser;
    const reason = intent.reason || 'Распоряжение дежурного администратора';

    if (intent.action === 'mute') {
      const dur = intent.durationMinutes || 10;
      const muteRec = issueMute(target, adminTag, reason, dur);
      recordBlackjackInfraction(target, target, 'mute');

      if (chatId) {
        // Attempt Telegram API restriction in background
        executeTelegramModerationAction(chatId, target.replace('@', ''), 'mute', Date.now() + dur * 60 * 1000).catch(() => {});
      }

      return {
        replyText: `🔇 **Принято, шериф!** Заткнула пасть ${target} на ${dur} минут.\n` +
          `📋 **Причина в рапорте:** ${reason}\n` +
          `_Пусть посидит в изоляторе Стойла 99 и почистит стволы. До ${new Date(muteRec.expiresAt).toLocaleTimeString()} ни звука не издаст._`,
        actionTaken: 'mute',
        moderationRecord: muteRec
      };
    }

    if (intent.action === 'unmute') {
      const res = revokeMute(target, adminTag, reason);
      if (chatId) {
        executeTelegramModerationAction(chatId, target.replace('@', ''), 'unmute').catch(() => {});
      }
      return {
        replyText: `🔊 **Наручники сняты.** Мут с ${target} аннулирован.\n` +
          `📋 **Причина амнистии:** ${reason}\n` +
          `_Смотри у меня, ${target}, второй раз картечь дважды просить не будет._`,
        actionTaken: 'unmute',
        moderationRecord: res.record
      };
    }

    if (intent.action === 'ban') {
      const banRec = issueBan(target, adminTag, reason);
      recordBlackjackInfraction(target, target, 'ban');
      if (chatId) {
        executeTelegramModerationAction(chatId, target.replace('@', ''), 'ban').catch(() => {});
      }
      return {
        replyText: `⛔ **Вышвырнула за шлюз Стойла 99!** Пользователь ${target} отправлен в перманентный бан.\n` +
          `📋 **Причина ликвидации:** ${reason}\n` +
          `_Дверь гермозатвора запечатана намертво._`,
        actionTaken: 'ban',
        moderationRecord: banRec
      };
    }

    if (intent.action === 'unban') {
      const res = revokeBan(target, adminTag, reason);
      if (chatId) {
        executeTelegramModerationAction(chatId, target.replace('@', ''), 'unban').catch(() => {});
      }
      return {
        replyText: `🔓 **Гермозатвор открыт.** Бан с ${target} снят по приказу администрации.\n` +
          `📋 **Причина амнистии:** ${reason}`,
        actionTaken: 'unban',
        moderationRecord: res.record
      };
    }

    if (intent.action === 'bot_block') {
      const rec = blockBotActivity(target, adminTag, reason);
      return {
        replyText: `🤖 **Доступ к боту заблокирован.** Пользователю ${target} перекрыты каналы терминала.\n` +
          `📋 **Причина:** ${reason}`,
        actionTaken: 'bot_block',
        moderationRecord: rec
      };
    }

    if (intent.action === 'bot_unblock') {
      const rec = unblockBotActivity(target, adminTag, reason);
      return {
        replyText: `✅ **Доступ к боту восстановлен.** Пользователь ${target} снова может использовать Mini App.\n` +
          `📋 **Причина:** ${reason}`,
        actionTaken: 'bot_unblock',
        moderationRecord: rec
      };
    }
  }

  // 6. Conversational / Lore / Assistance via Gemini
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Пользователь ${senderDisplayName || senderUsername} пишет: "${text}".
Ответь кратко (2-4 предложения) в своем фирменном характере сурового охранника Стойла 99 Блэкджек (Project Horizons).
Если спрашивают о боте или правилах, помоги чётко и без лишней воды.`;

      const response = await ai.models.generateContent({
        model: BLACKJACK_GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: getBlackjackSystemPrompt(),
          temperature: 0.7,
          maxOutputTokens: 350
        }
      });

      if (response.text) {
        return { replyText: response.text.trim(), actionTaken: 'chat_ai' };
      }
    }
  } catch (err) {
    console.warn('Blackjack Gemini call failed, using lore fallback:', err);
  }

  // Fallback in character
  return {
    replyText: `🚬 **Блэкджек на связи.** Стволы начищены, в Стойле 99 всё спокойно. Если кто-то нарушает дисциплину — дай знать, шериф, и наручники защёлкнутся быстрее, чем он успеет мигнуть.`,
    actionTaken: 'chat_fallback'
  };
}

/**
 * Littlepip summons Blackjack when a chat rule violation occurs!
 * Blackjack mutes the violator for 10 minutes and pings admins.
 * With anti-loop protection!
 */
export async function summonBlackjackForViolation(params: {
  violatorTag: string;
  ruleNumber: number;
  ruleTitle: string;
  reason: string;
  chatId?: string | number;
  adminUsernames?: string[];
}): Promise<{
  blackjackMessage: string;
  triggerDialogueToLittlepip?: string;
}> {
  const { violatorTag, ruleNumber, ruleTitle, reason, chatId, adminUsernames } = params;
  const cfg = loadBlackjackConfig();

  // 1. Issue 10-minute mute
  const muteReason = `Нарушение правила №${ruleNumber} (${ruleTitle}): ${reason}`;
  const muteRec = issueMute(violatorTag, 'Пипка (Система обнаружения)', muteReason, cfg.defaultMuteDurationMinutes || 10);
  recordBlackjackInfraction(violatorTag, violatorTag, 'mute');

  if (chatId) {
    executeTelegramModerationAction(chatId, violatorTag.replace('@', ''), 'mute', Date.now() + 10 * 60 * 1000).catch(() => {});
  }

  // 2. Format admin pings
  const admins = adminUsernames && adminUsernames.length > 0
    ? adminUsernames.map(a => a.startsWith('@') ? a : `@${a}`).join(' ')
    : cfg.adminUsernames.join(' ');

  let message = `💥 **Зафиксировано, Пипка!**\n` +
    `Служба безопасности Стойла 99 в деле. Нарушитель **${violatorTag}** отправлен в мут на 10 минут за нарушение правила №${ruleNumber} (${ruleTitle}).\n\n` +
    `👮‍♂️ **Внимание шерифов:** ${admins} — проверьте инцидент и решите, продлевать ли изоляцию!`;

  // 3. One-shot trigger line between Blackjack and Littlepip (strict anti-loop guard)
  let triggerLine: string | undefined = undefined;
  const now = Date.now();
  if (cfg.antiLoopProtection && (now - lastInterBotTriggerTime > INTER_BOT_COOLDOWN_MS)) {
    lastInterBotTriggerTime = now;
    triggerLine = `Блэкджек: Хэй, Пипка, видела как я отработала? Нарушитель уже в изоляторе.`;
  }

  return {
    blackjackMessage: message,
    triggerDialogueToLittlepip: triggerLine
  };
}
