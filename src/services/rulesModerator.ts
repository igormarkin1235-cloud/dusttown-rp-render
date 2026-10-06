/**
 * RULES MODERATOR & VIOLATION DETECTOR — DustTown RP
 *
 * 9 правил Telegram-канала:
 * 1️⃣ — Оскорбительные высказывания или действия в сторону участников/администраторов.
 * 2️⃣ — Контент 18+ или сексуального характера.
 * 3️⃣ — Реклама в любом виде.
 * 4️⃣ — Спам медиа-контентом (4+ элементов <1s) и частый флуд.
 * 5️⃣ — Негативные высказывания о проекте (только конструктивная критика).
 * 6️⃣ — Упоминание диктаторов 20 века и разговоры о реальной политике.
 * 7️⃣ — Задевать чувства верующих.
 * 8️⃣ — Дезинформация о проекте (наказание как за прямое оскорбление).
 * 9️⃣ — Наркотики, психотропные вещества вне лора Fallout.
 */

export interface RuleDefinition {
  number: number;
  title: string;
  description: string;
}

export const CHANNEL_RULES: RuleDefinition[] = [
  {
    number: 1,
    title: 'Оскорбления участников или администрации',
    description: 'Запрещены оскорбительные высказывания или действия в сторону участников или администраторов канала.'
  },
  {
    number: 2,
    title: '18+ и сексуальный контент',
    description: 'Запрещена публикация контента 18+ или материалов сексуального характера.'
  },
  {
    number: 3,
    title: 'Реклама в любом виде',
    description: 'Реклама в любом виде запрещена!'
  },
  {
    number: 4,
    title: 'Спам и флуд',
    description: 'Спам медиа-контентом запрещён (отправка 4-х и более элементов за менее чем 1 секунду или повторы).'
  },
  {
    number: 5,
    title: 'Негатив и хейт проекта без конструктива',
    description: 'Негативные высказывания о проекте запрещены (разрешена только конструктивная критика).'
  },
  {
    number: 6,
    title: 'Диктаторы 20 века и политика',
    description: 'Запрещено упоминание диктаторов 20-го века и в общем разговоры о политике.'
  },
  {
    number: 7,
    title: 'Оскорбление чувств верующих',
    description: 'Запрещено задевать чувства верующих.'
  },
  {
    number: 8,
    title: 'Дезинформация о проекте',
    description: 'Дезинформация о проекте запрещена. Наказание как за прямое оскорбление проекта.'
  },
  {
    number: 9,
    title: 'Наркотики и психотропные вещества',
    description: 'Запрещено упоминание, распространение или пропаганда наркотиков и психотропных веществ (не относящихся к лору).'
  }
];

export const PRIMARY_ADMIN_USERNAME = '@MrWhitePio';

export interface ViolationCheckResult {
  isViolation: boolean;
  ruleNumber?: number;
  ruleTitle?: string;
  reason?: string;
  warningText?: string;
  harshWarningReply?: string;
  memeTag?: string;
}

// In-memory rate limiting and flood tracking for Rule 4
interface UserActivity {
  timestamps: number[];
  recentMessages: string[];
}
const userActivityCache = new Map<string, UserActivity>();

export function checkMessageForViolations(
  text: string,
  userTag: string,
  userId: number | string = 0,
  chatId: number | string = 0,
  isMediaMessage = false,
  timestampMs?: number
): ViolationCheckResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const address = userTag.startsWith('@') ? userTag : `@${userTag}`;

  // 0. Rule 4 check: Flood & Spam (4+ media msgs in <1s or repeating identical text)
  if (userId && isMediaMessage) {
    const actKey = `${chatId}:${userId}`;
    const now = typeof timestampMs === 'number' ? timestampMs : Date.now();
    let act = userActivityCache.get(actKey);
    if (!act) {
      act = { timestamps: [], recentMessages: [] };
      userActivityCache.set(actKey, act);
    }
    act.timestamps.push(now);
    if (clean) act.recentMessages.push(clean);
    // In less than 1 second: strictly < 1000ms
    act.timestamps = act.timestamps.filter(t => now - t < 1000);
    act.recentMessages = act.recentMessages.slice(-6);

    const msgsInWindow = act.timestamps.length;
    const sameTextCount = clean ? act.recentMessages.filter(m => m === clean).length : 0;

    if (msgsInWindow >= 4 || sameTextCount >= 3) {
      return {
        isViolation: true,
        ruleNumber: 4,
        ruleTitle: CHANNEL_RULES[3].title,
        reason: 'Флуд/спам сообщениями',
        harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №4: СПАМ И ФЛУД]**\n\n` +
          `Слышь, блядь, ${address}, палец с клавиатуры убрал! Ты какого хера чат спамом засираешь, у тебя реле переклинило? ` +
          `Ещё одна строчка флуда — и я лично достану свой Макинтош 32-го калибра и прострелю твой передатчик!\n\n` +
          `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, у нас тут спамер ${address}! Нарушение правила №4 (${CHANNEL_RULES[3].title}). Запечатай ему пасть на 10 минут!`,
        memeTag: 'pip_gun_threat'
      };
    }
  }

  // 1. Rule 2: 18+ контент, сексуальный характер
  if (/(?:порно|секс\s*услуг|интим\s*фото|скину\s*нюдс|дроч(?:ить|ка|у)|онлифанс|onlyfans|член\s+в\s+лс|сиськи\s+в\s+лс|хентай|секс\s*чат|проститутк|шлюх(?:и|а)|дилдо|минет\b|кунилингус|18\+|только\s+для\s+18)/iu.test(lower)) {
    return {
      isViolation: true,
      ruleNumber: 2,
      ruleTitle: CHANNEL_RULES[1].title,
      reason: 'Публикация контента 18+ или сексуального характера',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №2: 18+ КОНТЕНТ]**\n\n` +
        `Ты совсем охуел, ${address}?! Засунь свою дрочильню обратно в стойло! У нас тут Даст Таун, а не бордель для озабоченных рейдеров. ` +
        `Ещё раз увижу эту похабщину — вылетишь из поселения с дырой в крупе!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, тут нарушитель правила №2 ${address}! Глянь на этот разврат — отправь его в изолятор на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 2. Rule 3: Реклама в любом виде
  const hasExternalLink = /(?:t\.me\/(?!(?:DustTown|MrWhitePio))[\w_]{4,}|telegra\.ph\/|telegram\.me\/(?!(?:DustTown|MrWhitePio))|https?:\/\/(?!(?:t\.me\/(?:DustTown|MrWhitePio)|localhost|ais-dev|ais-pre|render\.com|github\.com|youtube\.com|youtu\.be))\S+)/iu.test(clean);
  const hasPromoText = /(?:подписывайтесь на канал|заработок в интернете|казино|1xbet|ставки на спорт|крипт(?:а|овалюта)|инвестируй|купите рекламу|слив курсов|вступайте в наш чат)/iu.test(lower);
  if (hasExternalLink || hasPromoText) {
    return {
      isViolation: true,
      ruleNumber: 3,
      ruleTitle: CHANNEL_RULES[2].title,
      reason: 'Реклама и сторонние промо-ссылки',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №3: РЕКЛАМА ЗАПРЕЩЕНА]**\n\n` +
        `Слышь ты, рекламщик хуев, ${address}! Свернул свои ссылки в трубочку и пошёл нахер отсюда со своим спамом! ` +
        `В Даст Тауне за несогласованную рекламу и скам пулю в лоб получают без лишних разговоров.\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, у нас спамер с рекламой ${address}! Правило №3 — выдай ему мут на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 3. Rule 6: Диктаторы 20 века и разговоры о политике
  if (/(?:политик[а-я]*|гитлер|сталин|муссолини|ленин|пол\s*пот|нацизм|фашизм|свастик|третий\s*рейх|холокост|сво\b|хохол|укроп|ватник|путин|зеленский|байден|война\s+в\s+украин|госдум|выборы\s+президент|кпрф|единая\s+россия|госдеп|зетки|свастоны)/iu.test(lower)) {
    return {
      isViolation: true,
      ruleNumber: 6,
      ruleTitle: CHANNEL_RULES[5].title,
      reason: 'Упоминание диктаторов 20 века или реальной политики',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №6: ПОЛИТИКА И ДИКТАТОРЫ ЗАПРЕЩЕНЫ]**\n\n` +
        `Ты чё, берега попутал, ${address}?! Какая нахер реальная политика и диктаторы в Пустошах Эквестрии?! ` +
        `Засунь свои политические высеры себе глубоко в задницу и пасть захлопни, пока я курок Макинтоша не спустила!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, нарушитель правила №6 ${address} разводит политику! Заткни его на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 4. Rule 9: Наркотики и психотропные вещества (вне игрового лора)
  // В лоре Фоллаута разрешены: ментаты, мед-х, баффаут, винт, психо, рад-эвэй, стимпак, спаркл-кола, сидр
  const hasRealDrugs = /(?:меф(?:едрон)?|соли?\b|закладк(?:а|и|у)|закладчик|героин|кокаин|гашиш|марихуан|амфетамин|спайс|трава\s+курить|бошки\s+купить|гидра|hydra|наркот(?:ики|а)|лсд|экстази|трамадол|зависимост[а-я]*|преступлен[а-я]*\s+вне\s+лора)/iu.test(lower);
  const isFalloutLore = /(?:ментат|мед-х|баффаут|винт\b|психо\b|стимпак|рад-эвэй|сидр|спаркл-кола|зель|игров[а-я]*\s+лор[а-я]*|fallout\s+лор[а-я]*)/iu.test(lower);
  if (hasRealDrugs && !isFalloutLore) {
    return {
      isViolation: true,
      ruleNumber: 9,
      ruleTitle: CHANNEL_RULES[8].title,
      reason: 'Пропаганда или упоминание наркотиков вне лора вселенной',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №9: НАРКОТИКИ ЗАПРЕЩЕНЫ]**\n\n` +
        `Ты какую дрянь сюда приволок, ${address}?! В Даст Тауне за реальную наркоту и закладки сталкеры яйца отрывают на месте! ` +
        `Спрятал свою гадость и свалил нахер, пока я тебе копыта не переломала!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, у нас кадр с наркотиками ${address} (правило №9)! Оформи ему мут на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 5. Rule 7: Задевать чувства верующих
  if (/(?:ваш\s*бог|иисус|аллах|православие|ислам|христианств|церковь|мусульман|святые|коран|библия)\s*(?:говно|пидоры|хуйня|мрази|тварь|сосут|обоссал|сжечь|ублюдки)/iu.test(lower) ||
      /(?:сжечь|обоссать)\s+(?:библию|коран|иконы|храм|церковь)/iu.test(lower)) {
    return {
      isViolation: true,
      ruleNumber: 7,
      ruleTitle: CHANNEL_RULES[6].title,
      reason: 'Оскорбление чувств верующих',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №7: ЧУВСТВА ВЕРУЮЩИХ]**\n\n` +
        `Слышь, ${address}, верующих трогать не смей, придурок! В Пустошах каждый верит во что хочет, а за такие гнилые наезды на святыни ` +
        `тебе быстро рога поотшибают! Завали пасть и не нарывайся на пулю!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, тут оскорбление чувств верующих от ${address} (правило №7)! Наручники на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 6. Rule 8: Дезинформация о проекте
  if (/(?:проект\s+(?:закрывается|закрылся|закрыт|схлопнулся)|вайп\s+(?:всех|монет|ℰQ|аккаунтов|балансов)|админы\s+(?:всех\s+кинули|скамят|воруют|украли|спиздили|слились)|(?:даст\s*таун|dusttown)\s*(?:[-—–:]|\s+)*(?:всё|закрывают|скам))/iu.test(lower)) {
    return {
      isViolation: true,
      ruleNumber: 8,
      ruleTitle: CHANNEL_RULES[7].title,
      reason: 'Дезинформация о проекте Даст Таун',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №8: ДЕЗИНФОРМАЦИЯ О ПРОЕКТЕ]**\n\n` +
        `${address}, пиздеть — не мешки ворочать! Хватит гнилые фейки и панику разводить про закрытие или вайп Даст Тауна. ` +
        `Наказание за дезу — как за прямое оскорбление проекта! Захлопни варежку, пока банхаммер не прилетел в лоб!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, тут провокатор и дезинформатор ${address} (правило №8)! В изолятор его на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 7. Rule 5: Негатив и хейт проекта без конструктива
  if (/(?:даст\s*таун|dusttown|проект|бот|сервер)\s*(?:[-—–:]|\s+)*(?:говно|помойка|дерьмо|параша|скам|хуйня|дно|сдохни|закрывайте|отстой|шлак)/iu.test(lower) ||
      /(?:говно|помойка|скам|хуйня|параша)\s*,?\s*а не (?:проект|бот|сервер)/iu.test(lower)) {
    return {
      isViolation: true,
      ruleNumber: 5,
      ruleTitle: CHANNEL_RULES[4].title,
      reason: 'Хейт и оскорбление проекта без конструктива',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №5: ОСКОРБЛЕНИЕ ПРОЕКТА]**\n\n` +
        `${address}, ебало стянул! Не нравится Даст Таун — пиздуй в выжженную пустыню к рейдерам, тебя тут на аркане никто не держит. ` +
        `А срать на проект без конструктива ты здесь не будешь, ясно тебе?! Ещё один высер — и вылетишь нахуй!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, тут токсик ${address} срёт на проект без повода (правило №5). Закрой ему пасть на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  // 8. Rule 1: Прямые оскорбления участников или админов
  const hasDirectedInsult = /(?:ты|вы|он|она)\s+(?:чмо|пидор|урод|даун|мразь|хуесос|гандон|шлюха|сука|дебил|конченый|петух|тварь|еблан|долбоёб|гнида|шалава)/iu.test(lower) ||
    /(?:пошёл|иди|пошли)\s+(?:на\s*хуй|в\s*пизду|в\s*жопу)|соси\s+(?:хуй|член)|рот\s+(?:ебал|завали)|ебало\s+(?:завали|стяни)/iu.test(lower);
  if (hasDirectedInsult) {
    return {
      isViolation: true,
      ruleNumber: 1,
      ruleTitle: CHANNEL_RULES[0].title,
      reason: 'Оскорбление участников или администрации',
      harshWarningReply: `⚠️ **[НАРУШЕНИЕ ПРАВИЛА №1: ОСКОРБЛЕНИЯ ЗАПРЕЩЕНЫ]**\n\n` +
        `Слышь, ты, ${address}, пасть завали и ствол в землю! Ты на кого тут гавкать вздумал, уёбок?! ` +
        `В Даст Тауне за такие гнилые наезды копыта простреливают без предупреждений. Ещё одно оскорбление — и я лично спущу курок!\n\n` +
        `🚨 **Блэкджек (Джеки @Bleckjek_bot)**, тут агрессивный неадекват ${address} (правило №1)! Запечатай нарушителю рот на 10 минут!`,
      memeTag: 'pip_gun_threat'
    };
  }

  return { isViolation: false };
}
