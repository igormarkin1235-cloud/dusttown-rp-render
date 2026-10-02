export interface RuleDefinition {
  number: number;
  title: string;
  description: string;
}

export const CHANNEL_RULES: RuleDefinition[] = [
  { number: 1, title: 'Оскорбления участников и администрации', description: 'Запрещены оскорбительные высказывания и действия в сторону участников или администраторов.' },
  { number: 2, title: 'Контент 18+ и сексуальные материалы', description: 'Запрещена публикация контента 18+ и материалов сексуального характера.' },
  { number: 3, title: 'Реклама', description: 'Реклама в любом виде запрещена.' },
  { number: 4, title: 'Спам медиа', description: 'Четыре и более медиа-элемента менее чем за секунду считаются спамом.' },
  { number: 5, title: 'Негатив о проекте', description: 'Запрещены негативные высказывания о проекте; конструктивная критика разрешена.' },
  { number: 6, title: 'Диктаторы XX века и политика', description: 'Запрещены упоминания диктаторов XX века и разговоры о реальной политике.' },
  { number: 7, title: 'Оскорбление чувств верующих', description: 'Запрещено задевать чувства верующих.' },
  { number: 8, title: 'Дезинформация о проекте', description: 'Запрещена дезинформация о проекте; наказание такое же, как за прямое оскорбление проекта.' },
  { number: 9, title: 'Наркотики и опасный контент вне лора', description: 'Запрещены упоминание, распространение или пропаганда наркотиков и психотропных веществ, а также контент о зависимостях, насилии или нарушении закона, если это не относится к лору игровой вселенной.' }
];

export interface ViolationCheckResult {
  isViolation: boolean;
  ruleNumber?: number;
  ruleTitle?: string;
  reason?: string;
  warningText?: string;
}

const mediaTimestamps = new Map<string, number[]>();

const violationPatterns: Array<{ ruleNumber: number; reason: string; pattern: RegExp }> = [
  {
    ruleNumber: 1,
    reason: 'Оскорбление участника или администратора',
    pattern: /(?:ты.{0,32}?(?:идиот|дебил|дурак|урод|мразь|тварь|мудак|долбо[её]б|ублюдок|пидор|хуйло)(?![\p{L}\p{N}_])|@[\w_]+\s*,?\s*(?:ты\s+)?(?:идиот|дебил|дурак|урод|мразь|тварь|мудак|долбо[её]б|ублюдок|пидор|хуйло)(?![\p{L}\p{N}_])|(?:идиот|дебил|дурак|урод|мразь|тварь|мудак|долбо[её]б|ублюдок|пидор|хуйло)(?![\p{L}\p{N}_])\s*@[\w_]+)/iu
  },
  {
    ruleNumber: 2,
    reason: 'Публикация или предложение сексуального контента',
    pattern: /(?:порно|порнограф\w*|нюдс|хентай|онлифанс|onlyfans|эротик\w*|интим(?:ные фото|ные материалы)?|секс(?:уальн\w+ контент|чат|услуг\w*)|дилдо|проститут\w*|кунилингус|минет)(?![\p{L}\p{N}_])/iu
  },
  {
    ruleNumber: 3,
    reason: 'Рекламная ссылка или призыв к продвижению',
    pattern: /(?:https?:\/\/|www\.|t\.me\/|telegram\.me\/|telegra\.ph\/|(?:подписывайтесь|вступайте|переходите)\s+(?:на|в)\s+(?:мой|наш|этот)\s+(?:канал|чат|проект)|(?:казино|ставки на спорт|заработок в интернете|купите рекламу|промокод)(?![\p{L}\p{N}_]))/iu
  },
  {
    ruleNumber: 6,
    reason: 'Упоминание диктатора XX века или обсуждение реальной политики',
    pattern: /(?:гитлер|сталин|муссолини|пол\s*пот|пиночет|нацизм|фашизм|третий\s*рейх|холокост|реальная\s+политика|политическ\w+\s+(?:партия|выборы|дебаты)|президентские\s+выборы|госдума|политик\w*)/iu
  },
  {
    ruleNumber: 7,
    reason: 'Оскорбление верующих или религиозных святынь',
    pattern: /(?:(?:бог|иисус|аллах|православие|ислам|христианств\w*|церковь|мусульман\w*|коран|библия|икон\w*|храм).{0,40}(?:говно|хуйня|мрази|твари|сжечь|обоссать|ублюдки)|(?:сжечь|обоссать).{0,30}(?:библию|коран|икон\w*|храм|церковь))/iu
  },
  {
    ruleNumber: 8,
    reason: 'Обвинение проекта в мошенничестве или распространение неподтверждённого слуха о нём',
    pattern: /(?:даст\s*таун|dusttown|проект|админ\w*|разработчик\w*|создател\w*).{0,48}(?:вор\w*|украл\w*|украли|воруют|мошенник\w*|скам|закрыва\w*|удалят\s+все|обнулят\s+аккаунт\w*)|(?:вор\w*|украл\w*|украли|воруют|мошенник\w*|скам|закрыва\w*|удалят\s+все|обнулят\s+аккаунт\w*).{0,48}(?:даст\s*таун|dusttown|проект|админ\w*|разработчик\w*|создател\w*)/iu
  },
  {
    ruleNumber: 5,
    reason: 'Оскорбительный негатив о проекте',
    pattern: /(?:даст\s*таун|dusttown|проект|мини.?апп|бот).{0,48}(?:говно|помойка|мусор|ужасн\w*|убог\w*|говён\w*)|(?:говно|помойка|мусор|ужасн\w*|убог\w*|говён\w*).{0,48}(?:даст\s*таун|dusttown|проект|мини.?апп|бот)/iu
  },
  {
    ruleNumber: 9,
    reason: 'Упоминание или продвижение реальных наркотиков вне лора',
    pattern: /(?:меф(?:едрон)?|героин|кокаин|гашиш|марихуан\w*|амфетамин\w*|спайс|закладк\w*|закладчик\w*|лсд|экстази|наркотик\w*|психотропн\w+\s+веществ\w*)/iu
  }
];

function warningFor(ruleNumber: number, ruleTitle: string): string {
  return `⚠️ **Нарушение правила №${ruleNumber}: ${ruleTitle}.**\n` +
    `Эй, давай без этого. Тут правила не для красоты висят: остановись и не повторяй нарушение. ` +
    `Конструктив и нормальный тон — пожалуйста, а этот заход придётся свернуть.`;
}

export function checkMessageForViolations(
  text: string,
  _userTag: string,
  userId: number | string = 0,
  chatId: number | string = 0,
  isMedia = false,
  now = Date.now()
): ViolationCheckResult {
  const clean = text.trim();

  if (isMedia && userId) {
    const key = `${chatId}:${userId}`;
    const timestamps = (mediaTimestamps.get(key) || []).filter(timestamp => now - timestamp < 1000);
    timestamps.push(now);
    mediaTimestamps.set(key, timestamps);

    if (timestamps.length >= 4) {
      const rule = CHANNEL_RULES[3];
      return {
        isViolation: true,
        ruleNumber: rule.number,
        ruleTitle: rule.title,
        reason: 'Отправлено четыре или более медиа-элемента менее чем за секунду',
        warningText: warningFor(rule.number, rule.title)
      };
    }
  }

  const lower = clean.toLocaleLowerCase('ru');
  if (!lower) return { isViolation: false };

  const matched = violationPatterns.find(item => item.pattern.test(lower));
  if (!matched) return { isViolation: false };
  if (
    matched.ruleNumber === 9 &&
    /(?:fallout|эквестри|внутриигров\w*|игров\w+\s+лор|лора\s+игровой\s+вселенной|ментат|мед-х|баффаут|рад-эвэй|стимпак|психо\b)/iu.test(lower) &&
    !/(?:меф(?:едрон)?|героин|кокаин|гашиш|марихуан\w*|амфетамин\w*|спайс|закладк\w*|лсд|экстази|вне\s+лора|не\s+относящ\w*)/iu.test(lower)
  ) {
    return { isViolation: false };
  }

  const rule = CHANNEL_RULES.find(item => item.number === matched.ruleNumber);
  if (!rule) throw new Error(`Missing channel rule ${matched.ruleNumber}`);

  return {
    isViolation: true,
    ruleNumber: rule.number,
    ruleTitle: rule.title,
    reason: matched.reason,
    warningText: warningFor(rule.number, rule.title)
  };
}
