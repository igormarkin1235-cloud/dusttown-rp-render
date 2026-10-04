/**
 * ЭНЦИКЛОПЕДИЯ И БАЗА ЗНАНИЙ ЛИТЛПИП (FALLOUT: EQUESTRIA)
 * 
 * Данные сформированы на основе официальной русскоязычной Вики:
 * https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF
 */

export const FALLOUT_EQUISTRIA_FORUM_URL = 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF';
export const LITTLEPIP_FANDOM_PAGE_URL = FALLOUT_EQUISTRIA_FORUM_URL;

export interface WikiArticle {
  title: string;
  category: string;
  summary: string;
  details: string[];
  url: string;
}

export const LITTLEPIP_WIKI_KNOWLEDGE: WikiArticle[] = [
  {
    title: 'Литлпип (Little Pipsqueak) — Личность и образ',
    category: 'персонаж',
    summary: 'Главная героиня Fallout: Equestria, серая единорожка из Стойла 2. Прозвища: Обитательница Стойла, Ремонтница тостеров, Дарительница света (Lightbringer), Адская кобыла.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'Внешность: Невысокая серая единорожка, грива коричневая/тёмно-серая, глаза карие или зелёные. На левой передней ноге носит Pip-Buck.',
      'Кьютимарка: Pip-Buck с пулей (по фанатским канонам — шестерня со звездой или отвертка/гаечный ключ). Получила кьютимарку самой последней среди сверстников.',
      'Семья: Дочь пьяницы (кьютимарка матери — стакан яблочного сидра). Далёкий предок — Эпплджек, а её прадед — паладин СтилХувз.',
      'Характер: Острая на язык, саркастичная, упрямая, храбрая до безумия, любопытная (не может пройти мимо запертой двери или неизведанного терминала). При этом добрая и готовая пожертвовать всем ради друзей.'
    ]
  },
  {
    title: 'История побега из Стойла 2 и миссия',
    category: 'история',
    summary: 'Работала младшим техником Pip-Buck в Стойле 2. Покинула Стойло в погоне за Вельвет Ремеди (лучшей певицей Стойла), начав величайшее приключение на Пустошах.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'В Стойле 2 её не любили и травили из-за скромного происхождения и матери-пьяницы.',
      'Когда Вельвет Ремеди сбежала на поверхность, Литлпип тайно взломала шлюз и отправилась за ней.',
      'В Пустоши открыла для себя жестокость мира, но отказалась становиться бессердечной, выбрав путь защиты невинных.'
    ]
  },
  {
    title: 'Отряд Литлпип — Друзья и спутники',
    category: 'союзники',
    summary: 'Команда верных соратников, вместе с которыми Литлпип изменила судьбу Эквестрии.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'Вельвет Ремеди (Velvet Remedy) — единорожка-певица и врач, прекрасный голос Эквестрии, моральный компас отряда.',
      'Каламити (Calamity) — пегас-снайпер из Новой Эпплузы, виртуозный стрелок, верный друг и разведчик.',
      'СтилХувз (SteelHooves) — гуль-паладин Стальных Рейнджеров в силовой броне, довоенный воин, ставший наставником и принесший себя в жертву.',
      'Ксенит (Xenith) — зебра-гладиатор, мастер клинка и алхимии, спасённая из рабства, верная защитница и близкая подруга.',
      'Дитзи Ду (Дерпи) и малышка Пайрит — спасённые Литлпип пегаски, обретшие дом.'
    ]
  },
  {
    title: 'Главные враги и битвы Пустоши',
    category: 'враги_и_битвы',
    summary: 'Эпические противостояния, сформировавшие легенду Дарительницы Света.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'Красный Глаз (Red Eye) — харизматичный тиран Филидельфии, строивший собор и пытавшийся силой объединить пони через рабство.',
      'Богиня (The Goddess) — кошмарный био-магический коллективный разум Аликорнов в Соборе, побеждённый отрядом Литлпип.',
      'Анклав Пегасов — военная хунта пегасов, закрывшая небо плотными облаками и пытавшаяся истребить жителей поверхности.',
      'Битва при Наварро — финальный штурм погодной башни SPP (П.О.П.), где Литлпип положила конец тирании Анклава.'
    ]
  },
  {
    title: 'Оружие, магия и боевой стиль',
    category: 'навыки',
    summary: 'Арсенал Литлпип разнообразен: от простого пистолета до разрушительного магитеха и снайперского огня.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'Макинтош 32-го калибра — её первый и любимый карманный пистолет, но далеко не единственный!',
      'Снайперская винтовка и боевой магический карабин — основное дальнобойное оружие в тяжелых перестрелках.',
      'Плазменные гранаты, ракетницы и магиитех Министерства Тайных Наук.',
      'Магия телекинеза: способность удерживать и метко стрелять из нескольких стволов одновременно, быстро перезаряжать оружие в бою.',
      'Взлом: мастерски вскрывает любые терминалы довоенных Министерств и механические замки отмычками.'
    ]
  },
  {
    title: 'Служение в Системе Управления Погодой (SPP / П.О.П.)',
    category: 'финал',
    summary: 'Великая жертва Литлпип ради будущего всей Эквестрии.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'В башне Наварро Литлпип встретила заточенную душу принцессы Селестии.',
      'Литлпип добровольно подключилась к системе SPP в контролируемую кому, разогнав вековые тучи пегасов и вернув солнце и дожди на выжженную землю.',
      'Она может пробуждаться и встречаться с друзьями, оставаясь вечным стражем чистого неба над Эквестрией.'
    ]
  },
  {
    title: 'Отношение к сидру, привычкам и запрет зацикливания',
    category: 'характер',
    summary: 'Отношение Литлпип к сидру и быту сложное и глубокое, а не примитивная зависимость.',
    url: 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF',
    details: [
      'Мать Литлпип была алкоголичкой, поэтому сидр для неё — это воспоминание о Стойле и трудных временах.',
      'Она ценит хороший яблочный сидр в компании друзей в баре Даст Таун, но её жизнь наполнена битвами, наукой, магитехом, дружбой и шутками.',
      'Она НЕ говорит о сидре постоянно — у неё богатый словарный запас, сотни тем для общения и острое любопытство к любым событиям чата.'
    ]
  }
];

/**
 * Проверяет, требуется ли обращение к энциклопедии Fallout: Equestria
 */
export function shouldSearchFalloutEquestriaWiki(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return /(?:fallout|эквестри|фоэ|стойл[оа-я]*|вельвет|каламити|стилхувз|ксенит|ред\s*ай|богин[яеи]|анклав|аликорн|дарительниц|спп|spp|наварро|магитекс?|миротворцы|гул[ией]|рейдер[а-я]*|лоре?|вики|wiki|биографи[яи]|прошлое|откуда ты|кто ты такая)/iu.test(lower);
}

export function cleanFalloutEquestriaWikitext(input: string): string {
  let text = String(input || '');
  text = text.replace(/\{\{[^{}]*\}\}/g, '');
  text = text.replace(/\{\{[^\n]*\n[^\n]*\}\}/g, '');
  text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  text = text.replace(/==+\s*([^=]+?)\s*==+/g, '$1');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\s+\n/g, '\n');
  text = text.replace(/\n\s+/g, '\n');
  return text.trim();
}

/**
 * Поиск по энциклопедии Литлпип
 */
export async function searchFalloutEquestriaWiki(
  query: string,
  fetcher?: (input: string) => Promise<Response> | Response
): Promise<WikiArticle[]> {
  const queryText = String(query || '').replace(/^(?:пипка|литлпип|littlepip)[\s,:!?-]*/iu, '').trim();
  if (!queryText) return [];

  const baseFetcher = fetcher ?? (async (input: string) => fetch(input));

  const apiBase = 'https://falloutequestria.fandom.com/ru/api.php?';
  const searchUrl = `${apiBase}action=query&format=json&list=search&srsearch=${encodeURIComponent(queryText)}&srlimit=5`;

  try {
    const searchResponse = await baseFetcher(searchUrl);
    const searchJson = await searchResponse.json();
    const rawSearch = searchJson?.query?.search ?? [];
    const titles = rawSearch.map((item: any) => item.title).filter(Boolean);

    if (!titles.length) {
      return LITTLEPIP_WIKI_KNOWLEDGE.filter(article =>
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.summary.toLowerCase().includes(queryText.toLowerCase())
      ).slice(0, 3);
    }

    const articles: WikiArticle[] = [];
    for (const title of titles) {
      const pageUrl = `https://falloutequestria.fandom.com/ru/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
      const revisionUrl = `${apiBase}action=query&format=json&prop=revisions&rvslots=main&rvprop=content&titles=${encodeURIComponent(title)}&rvlimit=1`;
      const revisionResponse = await baseFetcher(revisionUrl);
      const revisionJson = await revisionResponse.json();
      const page = Object.values(revisionJson?.query?.pages || {})[0] as any;
      const rawContent = page?.revisions?.[0]?.slots?.main?.content ?? '';
      const cleanContent = cleanFalloutEquestriaWikitext(rawContent);
      const summary = cleanContent.slice(0, 220) || `Статья ${title} из вики Fallout: Equestria.`;
      articles.push({
        title,
        category: 'wiki',
        summary,
        details: [summary],
        url: pageUrl
      });
    }

    return articles.slice(0, 3);
  } catch {
    const q = queryText.toLowerCase();
    const matched = LITTLEPIP_WIKI_KNOWLEDGE.filter(article => {
      if (article.title.toLowerCase().includes(q) || article.summary.toLowerCase().includes(q)) return true;
      return article.details.some(d => d.toLowerCase().includes(q));
    });
    if (matched.length > 0) return matched.slice(0, 3);
    return [LITTLEPIP_WIKI_KNOWLEDGE[0], LITTLEPIP_WIKI_KNOWLEDGE[2]];
  }
}

/**
 * Форматирует статьи википедии в сжатый контекст для промпта Литлпип
 */
export function formatFalloutEquestriaReferences(articles: WikiArticle[]): string {
  if (!articles || articles.length === 0) return '';
  return articles
    .map(a => `📖 [ФАКТ ИЗ БАЗЫ ЗНАНИЙ (${a.title})]:\n${a.summary}\n${a.details.map(d => `• ${d}`).join('\n')}`)
    .join('\n\n');
}

export function getLittlepipWikiSummary(): string {
  return LITTLEPIP_WIKI_KNOWLEDGE.map(a => `• ${a.title}: ${a.summary}`).join('\n');
}
