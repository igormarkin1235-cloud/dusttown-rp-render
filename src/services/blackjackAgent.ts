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
import { getBlackjackMemoryContextForPrompt } from './blackjackMemory';

export const BLACKJACK_GEMINI_MODEL = 'gemini-3.8-flash';
export const BLACKJACK_GEMINI_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

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
 * Checks if a text is a moderation command (mute, ban, block, etc.)
 */
export function isModerationCommand(text: string): boolean {
  if (!text) return false;
  const t = text.trim();
  return /(?:^\/(?:mute|unmute|ban|unban|block|bot_block|botblock|bj|blackjack|blacklist)\b|(?:^|\s)(?:замуть|кинь в мут|выдай мут|\bмут\b|размут|размуть|сними мут|забань|выдай бан|\bбан\b|разбан|разбань|сними бан|заблокируй в боте|блокни в боте|блок в боте|\bблок\b|черный список|чёрный список|блеклист|blacklist|досье|статус)\b)/iu.test(t);
}

/**
 * Checks if a text mentions or addresses Blackjack
 */
export function hasBlackjackMention(text: string): boolean {
  if (!text) return false;
  return /(?:блэкджек|блекджек|блэкджэк|блекджэк|джеки|блэки|блеки|блэк|блек|джека|джекич|дилер|шериф|офицер|blackjack|bleckjek|@bleckjek_bot|@blackjack|\/bj|\/blackjack|\/mute|\/unmute|\/ban|\/unban|\/blacklist|\/block|\/bot_block|\/botblock|\bмут\b|\bзамуть\b|\bбан\b|\bзабань\b|\bразмут\b|\bразбан\b|\bразмуть\b|\bразбань\b|\bблок\b|\bзаблокируй\b)/iu.test(text);
}

/**
 * Fast deterministic parser for moderation commands in natural language
 */
export function parseModerationIntent(text: string): BlackjackCommandParseResult {
  const isTrigger = hasBlackjackMention(text) || isModerationCommand(text);
  if (!isTrigger) {
    return { isBlackjackTrigger: false, action: 'chat' };
  }

  const clean = text.trim();

  // 1. Blacklist check
  if (/(?:ч[её]рный список|черный список|блеклист|blacklist|кто в муте|список наказан|список нарушител)/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'blacklist' };
  }

  // 2. Help command
  if (/(?:помощь|команды|что умеешь|help|\/help|\/bj_help)/iu.test(clean) && !/(?:мут|бан|блокиров)/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'help' };
  }

  // Extract target @username or user
  const userMatch = clean.match(/@([a-zA-Z0-9_]{3,32})/);
  const targetUser = userMatch ? `@${userMatch[1]}` : undefined;

  // Extract duration: "на 10 минут", "на минут так 10", "на 15 мин", "на час", "на 2 часа", "10m", "60m"
  let durationMinutes = 10;
  let customDurationFound = false;
  const durMatch = clean.match(/(?:минут\s+так\s+(\d+)|\b(\d+)\s*(?:мин|минут|m)\b|на\s+(\d+)\s*(?:мин|минут)|на\s+(\d+)\s*(?:час|часа|часов)|(\d+)\s*(?:час|часа|часов|h)|\b(\d+)\b)/iu);
  if (durMatch) {
    if (durMatch[1]) { durationMinutes = parseInt(durMatch[1], 10); customDurationFound = true; }
    else if (durMatch[2]) { durationMinutes = parseInt(durMatch[2], 10); customDurationFound = true; }
    else if (durMatch[3]) { durationMinutes = parseInt(durMatch[3], 10); customDurationFound = true; }
    else if (durMatch[4]) { durationMinutes = parseInt(durMatch[4], 10) * 60; customDurationFound = true; }
    else if (durMatch[5]) { durationMinutes = parseInt(durMatch[5], 10) * 60; customDurationFound = true; }
  }

  // 3. Unmute
  if (/(?:сними\s+(?:с\s+(?:него|неё)\s+)?мут|размут|размуть|снять\s+мут|\bunmute\b|^\/unmute\b)/iu.test(clean)) {
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
  if (/(?:выдай\s+(?:ему\s+|ей\s+)?мут|кинь\s+(?:его\s+|её\s+)?в\s+мут|замуть|дай\s+(?:ему\s+|ей\s+)?мут|\bмут\b|заглуши|заткни|\bmute\b|^\/mute\b)/iu.test(clean)) {
    let reason: string | undefined;

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
  if (/(?:разбан|разбань|сними бан|снять бан|\bunban\b|^\/unban\b)/iu.test(clean)) {
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
  if (/(?:выдай бан|забань|кинь в бан|вышвырни|\bбан\b|\bban\b|^\/ban\b)/iu.test(clean)) {
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

  // 7. Bot block (with explicit timer)
  if (/(?:заблокируй в боте|блокни в боте|блокировка активности|запрети бота|блок в боте|заблокируй|блокни|\bблок\b|^\/bot_block\b|^\/block\b|^\/botblock\b)/iu.test(clean)) {
    const reasonMatch = clean.match(/(?:по причине|причина|из-за|за)\s*[:\-—]?\s*(.+)$/iu);
    const dur = customDurationFound ? durationMinutes : 60;
    return {
      isBlackjackTrigger: true,
      action: 'bot_block',
      targetUser,
      durationMinutes: dur,
      reason: reasonMatch ? reasonMatch[1].trim() : 'Нарушение правил использования бота'
    };
  }

  // 8. Bot unblock
  if (/(?:разблокируй в боте|сними блок с бота|верни доступ к боту|разблокируй|\bunblock\b|^\/unblock\b|^\/bot_unblock\b)/iu.test(clean)) {
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
  if (/(?:статус|что по|кто такой|досье|инфо|проверь|^\/status\b)\s*@?/iu.test(clean)) {
    return { isBlackjackTrigger: true, action: 'status', targetUser };
  }

  return { isBlackjackTrigger: true, action: 'chat' };
}

export interface BlackjackMessageParams {
  text: string;
  senderUsername: string;
  senderDisplayName?: string;
  senderId?: string | number;
  isSenderAdmin?: boolean;
  topicId?: string | number | null;
  chatId?: string | number;
  adminsList?: string[];
  replyTargetUserId?: number | string;
  replyTargetUsername?: string;
}

/**
 * Handle message with Blackjack AI Agent
 */
export async function handleBlackjackMessage(params: BlackjackMessageParams): Promise<{
  replyText: string;
  actionTaken?: string;
  moderationRecord?: any;
  interBotTrigger?: string;
}> {
  const { text, senderUsername, senderDisplayName, senderId, topicId, chatId, adminsList, replyTargetUsername, replyTargetUserId } = params;

  // 1. Topic permission check
  const topicCheck = checkBlackjackTopicPermission(topicId);
  if (!topicCheck.canReply) {
    return {
      replyText: `🤐 _[Офицер Блэкджек: ${topicCheck.reason || 'В этом топике мне запрещено отвечать.'}]_`
    };
  }

  const isAdmin = params.isSenderAdmin ?? (
    isAuthorizedBlackjackAdmin(senderUsername, adminsList) ||
    Boolean(senderId && adminsList && adminsList.some(a => a.toLowerCase() === String(senderId)))
  );
  const intent = parseModerationIntent(text);

  // If command was sent in reply to another user, adopt the replied user as target!
  if (!intent.targetUser && replyTargetUsername) {
    intent.targetUser = replyTargetUsername;
  }

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
        `• 🔇 **Мут**: «Блэкджек, замуть @пользователь на 10 минут за флуд» (или ответом через reply)\n` +
        `• 🔊 **Размут**: «Блэкджек, сними мут с @пользователь по причине [причина]»\n` +
        `• ⛔ **Бан**: «Блэкджек, вышвырни @пользователь за оскорбления»\n` +
        `• 🤖 **Блок в боте**: «Блэкджек, заблокируй в боте @пользователь на 30 минут за читы»\n` +
        `• 📋 **Черный список**: «Блэкджек, покажи черный список»\n` +
        `• 🔍 **Досье игрока**: «Блэкджек, статус @пользователь»\n\n` +
        `_Помни: на любое снятие или ограничение я требую внятную причину для рапорта._`
    };
  }

  // 4. Action: Player Status
  if (intent.action === 'status' && (intent.targetUser || replyTargetUsername)) {
    const target = intent.targetUser || replyTargetUsername!;
    const restr = getPlayerRestrictions(target);
    const rep = getOrCreateBlackjackReputation(target, target, target);

    let statusMsg = `🔍 **ДОСЬЕ НАРУШИТЕЛЯ: ${target}**\n` +
      `• Репутация перед Блэкджек: **${rep.respectScore} / 100** (${rep.tierTitle})\n` +
      `• Предупреждений: **${rep.warningsCount}** | Мутов: **${rep.mutesCount}**\n\n`;

    if (restr.isMuted) {
      const exp = new Date(restr.muteRecord!.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      statusMsg += `🔇 **АКТИВНЫЙ МУТ**: до ${exp}\n   └ Причина: ${restr.muteRecord!.reason} [выдал: ${restr.muteRecord!.adminUser}]\n`;
    }
    if (restr.isBanned) {
      statusMsg += `⛔ **АКТИВНЫЙ БАН**: бессрочно\n   └ Причина: ${restr.banRecord!.reason}\n`;
    }
    if (restr.isBotBlocked) {
      const exp = restr.botBlockRecord!.expiresAt
        ? ` до ${new Date(restr.botBlockRecord!.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : '';
      statusMsg += `🤖 **БЛОКИРОВКА В БОТЕ**: доступ закрыт${exp}\n   └ Причина: ${restr.botBlockRecord!.reason}\n`;
    }
    if (!restr.isMuted && !restr.isBanned && !restr.isBotBlocked) {
      statusMsg += `✅ Ограничений нет. Оружие в кобуре, чист перед законом.`;
    }

    return { replyText: statusMsg, actionTaken: 'check_status' };
  }

  // 5. Moderation actions (Mute, Unmute, Ban, Unban, Bot Block)
  if (['mute', 'unmute', 'ban', 'unban', 'bot_block', 'bot_unblock'].includes(intent.action)) {
    // If ordinary player tries to command moderation: brush them off in character!
    if (!isAdmin) {
      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const brushOffPrompt = `Пользователь ${senderDisplayName || senderUsername} (обычный игрок пустоши без прав шерифа) пытается скомандовать тебе применить наказание: "${text}".
Ответь ему кратко (1-2 предложения) в своем фирменном характере сурового офицера СБ Стойла 99 Блэкджек (Project Horizons).
Осади его, отмахнись от его команды, скажи что ты подчиняешься только шерифам поселения (@админам), а не обычным сталкерам, и чтобы не смел тобой командовать. Нахально, саркастично, жестко.`;
          const resp = await ai.models.generateContent({
            model: BLACKJACK_GEMINI_MODEL,
            contents: brushOffPrompt,
            config: {
              systemInstruction: getBlackjackSystemPrompt(),
              temperature: 0.8,
              maxOutputTokens: 150
            }
          });
          if (resp.text?.trim()) {
            return {
              replyText: resp.text.trim(),
              actionTaken: 'brush_off_unauthorized'
            };
          }
        }
      } catch (_) {}

      const brushOffs = [
        `🔫 **Копыта придержи, бродяга.** Ты кем себя возомнил — смотрителем Стойла 99? Наручники и карцер работают только по приказу шерифов и администрации (@админов). А ты сиди смирно и не пытайся отдавать мне команды.`,
        `🥃 **Ага, сейчас, разбежалась.** Я подчиняюсь только шерифам поселения. Вот получишь значок и допуск службы безопасности — тогда и поговорим, а пока займись своими делами.`,
        `💥 **Слышь, сталкер, палец с курка убери.** Командовать службой безопасности здесь не в твоей юрисдикции. Ещё раз попробуешь мной помыкать — сама тебя в изолятор определю для профилактики!`,
        `🃏 **Ха, шустрый какой.** Заказы на наручники я от простых зевак не принимаю. Если кто-то нарушает — зови шерифов, а мной распоряжаться нечего.`,
        `📻 **Твой рапорт отправлен прямиком в мусорку.** У тебя нет жетона шерифа. Не лезь под горячее копыто, пока я не вспомнила, где оставила свой боевой дробовик.`,
        `🛡️ **Осади назад.** В Стойле 99 субординация строгая. Командовать мутами и банами могут только дежурные офицеры, а ты тут обычный посетитель. Отдыхай.`
      ];
      const pick = brushOffs[Math.floor(Math.random() * brushOffs.length)];
      return {
        replyText: pick,
        actionTaken: 'brush_off_unauthorized'
      };
    }

    if (!intent.targetUser) {
      return {
        replyText: `❓ **Шериф, а на кого наручники цеплять?**\nУкажи тег пользователя через @ (например, «Блэкджек, замуть @нарушитель на 10 минут за спам») или просто ответь реплаем (reply) на его сообщение.`
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
      const expTime = new Date(muteRec.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Dynamic report generation via Gemini
      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const repPrompt = `Шериф ${adminTag} отдал приказ замутить нарушителя ${target} на ${dur} минут по причине: "${reason}".
Срок мута: до ${expTime}.
Напиши короткий (2 предложения) сочный и атмосферный рапорт от лица офицера безопасности Стойла 99 Блэкджек (Project Horizons):
Подтверди исполнение, упомяни ${target}, срок (${dur} мин) и причину, используя атмосферу пустошей (карцер, наручники, дробовик, Pip-Buck, изолятор Стойла 99).`;
          const resp = await ai.models.generateContent({
            model: BLACKJACK_GEMINI_MODEL,
            contents: repPrompt,
            config: {
              systemInstruction: getBlackjackSystemPrompt(),
              temperature: 0.75,
              maxOutputTokens: 180
            }
          });
          if (resp.text?.trim()) {
            return {
              replyText: `🔇 ${resp.text.trim()}\n\n📋 **Запись в рапорте СБ:** ${reason} | До ${expTime}`,
              actionTaken: 'mute',
              moderationRecord: muteRec
            };
          }
        }
      } catch (_) {}

      const muteResponses = [
        `🔇 **Принято, шериф!** Защёлкнула наручники на ${target}. Пасть запечатана на ${dur} мин (до ${expTime}).\n📋 **Причина в рапорте:** ${reason}\n_Пусть посидит в тёмном карцере Стойла 99, остынет и послушает тишину в эфире._`,
        `🔒 **Исполнено!** Нарушитель ${target} изолирован от радиоэфира на ${dur} мин (до ${expTime}).\n📋 **Основание:** ${reason}\n_Оружие сдано на склад, передатчик заглушен. Ни пикнет, пока таймер не оттикает._`,
        `💥 **Есть, шериф!** Выбила предохранитель у ${target}. Мут на ${dur} мин (до ${expTime}).\n📋 **Запись в журнале СБ:** ${reason}\n_Сидит в изоляторе под прицелом турелей Стойла 99._`,
        `⛔ **Наручники на копытах!** ${target} отправлен в режим тишины на ${dur} мин (до ${expTime}).\n📋 **Причина:** ${reason}\n_Будет думать над своими словами, пока шерифы не решат иначе._`
      ];
      const replyText = muteResponses[Math.floor(Math.random() * muteResponses.length)];
      return {
        replyText,
        actionTaken: 'mute',
        moderationRecord: muteRec
      };
    }

    if (intent.action === 'unmute') {
      const res = revokeMute(target, adminTag, reason);
      return {
        replyText: `🔊 **Наручники сняты.** Мут с ${target} аннулирован по приказу шерифа.\n` +
          `📋 **Причина амнистии:** ${reason}\n` +
          `_Смотри у меня, ${target}, второй раз картечь дважды просить не будет._`,
        actionTaken: 'unmute',
        moderationRecord: res.record
      };
    }

    if (intent.action === 'ban') {
      const banRec = issueBan(target, adminTag, reason);
      recordBlackjackInfraction(target, target, 'ban');
      return {
        replyText: `⛔ **Вышвырнула за гермозатвор!** Пользователь ${target} отправлен в перманентный бан из сообщества.\n` +
          `📋 **Причина ликвидации:** ${reason}\n` +
          `_Дверь шлюза Стойла 99 запечатана намертво, турели взведены._`,
        actionTaken: 'ban',
        moderationRecord: banRec
      };
    }

    if (intent.action === 'unban') {
      const res = revokeBan(target, adminTag, reason);
      return {
        replyText: `🔓 **Гермозатвор открыт.** Бан с ${target} снят по приказу администрации.\n` +
          `📋 **Причина амнистии:** ${reason}`,
        actionTaken: 'unban',
        moderationRecord: res.record
      };
    }

    if (intent.action === 'bot_block') {
      const dur = intent.durationMinutes || 60;
      const rec = blockBotActivity(target, adminTag, reason, dur);
      const expTime = rec.expiresAt ? new Date(rec.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'таймер';
      return {
        replyText: `🤖 **Доступ к терминалам заблокирован!**\nПользователь ${target} отключен от функционала бота на **${dur} мин** (до ${expTime}).\n📋 **Основание:** ${reason}\n_Терминал опечатан протоколом службы безопасности Стойла 99._`,
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
  // If the user has an active mute or bot block, enforce it: do not engage in cheerful chat!
  const senderRestrictions = getPlayerRestrictions(senderUsername || String(senderId || ''));
  if (senderRestrictions.isMuted) {
    const muteRec = senderRestrictions.muteRecord!;
    const remaining = Math.max(1, Math.round((new Date(muteRec.expiresAt).getTime() - Date.now()) / 60000));
    const expTime = new Date(muteRec.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      replyText: `🔇 **В эфире радиомолчание!**\nТы находишься в изоляторе (активный мут). До окончания срока: **${remaining} мин** (до ${expTime}).\n📋 **Причина в рапорте:** ${muteRec.reason} [выдал: ${muteRec.adminUser}].\n_Оружие на складе, микрофон запечатан. Сиди тихо и жди окончания срока._`,
      actionTaken: 'muted_response'
    };
  }
  if (senderRestrictions.isBotBlocked) {
    const blockRec = senderRestrictions.botBlockRecord!;
    const remaining = blockRec.expiresAt
      ? Math.max(1, Math.round((new Date(blockRec.expiresAt).getTime() - Date.now()) / 60000))
      : 0;
    const expTime = blockRec.expiresAt
      ? new Date(blockRec.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'бессрочно';
    return {
      replyText: `🤖 **Доступ к функциям бота заблокирован!**\nТаймер блокировки: ещё **${remaining} мин** (до ${expTime}).\n📋 **Причина:** ${blockRec.reason} [выдал: ${blockRec.adminUser}].\n_Протокол безопасности СБ Стойла 99. Команды не принимаются._`,
      actionTaken: 'bot_blocked_response'
    };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const memoryContext = getBlackjackMemoryContextForPrompt();
      const prompt = `Пользователь ${senderDisplayName || senderUsername} пишет: "${text}".
${memoryContext ? memoryContext + '\n' : ''}Ответь кратко (2-4 предложения) в своем фирменном характере сурового охранника Стойла 99 Блэкджек (Project Horizons).
Если спрашивают о боте или правилах, помоги чётко и без лишней воды.`;

      for (const model of [BLACKJACK_GEMINI_MODEL, ...BLACKJACK_GEMINI_FALLBACK_MODELS]) {
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => reject(new Error('Blackjack timeout')), 7000);
          });
          const response = await Promise.race([
            ai.models.generateContent({
              model,
              contents: prompt,
              config: {
                systemInstruction: getBlackjackSystemPrompt(),
                temperature: 0.7,
                maxOutputTokens: 350
              }
            }),
            timeoutPromise
          ]);

          if (response.text && response.text.trim()) {
            return { replyText: response.text.trim(), actionTaken: 'chat_ai' };
          }
        } catch (mErr: any) {
          console.warn(`[Blackjack AI] Model ${model} failed, trying next fallback:`, mErr?.message || mErr);
        } finally {
          if (timeoutHandle) clearTimeout(timeoutHandle);
        }
      }
    }
  } catch (err) {
    console.warn('Blackjack Gemini call failed, using dynamic lore fallback:', err);
  }

  // Dynamic fallback in character (no repetitive template!)
  const name = senderDisplayName || senderUsername || 'сталкер';
  const cleanLower = text.toLowerCase();
  let fallbackReply = `🚬 **Блэкджек на связи.** Стволы начищены, в Стойле 99 всё спокойно. Держи ухо востро, ${name}, пустошь ошибок не прощает.`;

  if (cleanLower.includes('привет') || cleanLower.includes('здравствуй') || cleanLower.includes('хай') || cleanLower.includes('ку')) {
    fallbackReply = `🚬 Здорово, ${name}. Я на посту у гермошлюза. Если по делу — выкладывай быстро, а если просто поболтать — не путайся под копытами, пока я патроны считаю.`;
  } else if (cleanLower.includes('как дела') || cleanLower.includes('как ты') || cleanLower.includes('что делаешь')) {
    fallbackReply = `🔫 Дела в порядке, ${name}: дробовик смазан, наручники на поясе, на радаре чисто. Слежу, чтобы никто в чате не превратил всё в балаган. У тебя всё тихо?`;
  } else if (cleanLower.includes('кто ты') || cleanLower.includes('о себе') || cleanLower.includes('джеки')) {
    fallbackReply = `🛡️ Я офицер безопасности Блэкджек из Стойла 99. Моя работа — охранять порядок в Даст Тауне, вешать муты на дебоширов и помогать шерифам. Не нарушай правил — и мы поладим.`;
  } else if (cleanLower.includes('правил') || cleanLower.includes('закон')) {
    fallbackReply = `📋 Правила простые, ${name}: никакого спама, взаимного дерьма, токсичности и рекламы. За соблюдением слежу я и Пипка. Нарушишь — получишь 10 минут тишины в карцере без лишних предупреждений.`;
  } else if (cleanLower.includes('помоги') || cleanLower.includes('хелп') || cleanLower.includes('команд')) {
    fallbackReply = `⚙️ По командам: \`/bj_topic <ссылка> <режим>\` для настройки топиков, \`/bj_topics\` список веток, «Блэкджек, статус @юзер» для досье, а для админов — команды мута и бана. Выкладывай, в чём затык!`;
  }

  return {
    replyText: fallbackReply,
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
  violatorUserId?: number | string;
}): Promise<{
  blackjackMessage: string;
  triggerDialogueToLittlepip?: string;
}> {
  const { violatorTag, ruleNumber, ruleTitle, reason, chatId, adminUsernames, violatorUserId } = params;
  const cfg = loadBlackjackConfig();

  // 1. Issue 10-minute mute
  const muteReason = `Нарушение правила №${ruleNumber} (${ruleTitle}): ${reason}`;
  const muteRec = issueMute(violatorTag, 'Пипка (Система обнаружения)', muteReason, cfg.defaultMuteDurationMinutes || 10);
  recordBlackjackInfraction(violatorTag, violatorTag, 'mute');

  if (chatId) {
    const targetId = violatorUserId || violatorTag.replace('@', '');
    executeTelegramModerationAction(chatId, targetId, 'mute', Date.now() + 10 * 60 * 1000).catch(() => {});
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
