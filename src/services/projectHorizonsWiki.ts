/**
 * PROJECT HORIZONS WIKI SERVICE
 * 
 * Интеграция с русскоязычной вики Fallout: Equestria по Project Horizons:
 * https://falloutequestria.fandom.com/ru/wiki/%D0%91%D0%BB%D1%8D%D0%BA%D0%B4%D0%B6%D0%B5%D0%BA_(Project_Horizons)
 */

export const BLACKJACK_FANDOM_PAGE_URL = 'https://falloutequestria.fandom.com/ru/wiki/%D0%91%D0%BB%D1%8D%D0%BA%D0%B4%D0%B6%D0%B5%D0%BA_(Project_Horizons)';
const WIKI_API_URL = 'https://falloutequestria.fandom.com/ru/api.php';
const WIKI_USER_AGENT = 'DustTownRP-Blackjack/1.0 (Project Horizons Lore Enforcer)';

export interface ProjectHorizonsReference {
  title: string;
  url: string;
  extract: string;
}

// In-memory cache with 24h TTL
const wikiCache = new Map<string, { data: ProjectHorizonsReference[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const blackjackLoreTerms = /(?:блэкджек|джеки|блэки|project horizons|горизонты|хуффингтон|стойло 99|дилер|глори|p-21|п-21|лакуна|бузи|сомбер|кибер|имплант|дробовик|магнум|девятка)/iu;

export function shouldSearchProjectHorizonsWiki(text: string): boolean {
  return blackjackLoreTerms.test(text) || /(?:кто такая|расскажи про|история|откуда|почему дилер|проект горизонты)/iu.test(text);
}

function removeTemplates(wikitext: string): string {
  let output = '';
  let index = 0;
  while (index < wikitext.length) {
    if (!wikitext.startsWith('{{', index)) {
      output += wikitext[index++];
      continue;
    }
    let depth = 1;
    index += 2;
    while (index < wikitext.length && depth > 0) {
      if (wikitext.startsWith('{{', index)) {
        depth += 1;
        index += 2;
      } else if (wikitext.startsWith('}}', index)) {
        depth -= 1;
        index += 2;
      } else {
        index += 1;
      }
    }
    output += '\n';
  }
  return output;
}

export function cleanProjectHorizonsWikitext(wikitext: string): string {
  return removeTemplates(wikitext)
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, ' ')
    .replace(/<ref\b[^>]*\/>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''(.*?)'''/g, '$1')
    .replace(/''(.*?)''/g, '$1')
    .replace(/==+\s*([^=]+?)\s*==+/g, '\n### $1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fetch knowledge about Blackjack and Project Horizons from fandom wiki
 */
export async function fetchBlackjackWikiDossier(): Promise<ProjectHorizonsReference | null> {
  const cacheKey = 'blackjack_main';
  const cached = wikiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
    return cached.data[0];
  }

  try {
    const pageTitle = 'Блэкджек_(Project_Horizons)';
    const queryUrl = `${WIKI_API_URL}?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;
    const res = await fetch(queryUrl, {
      headers: { 'User-Agent': WIKI_USER_AGENT }
    });

    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages || {};
      const firstPageId = Object.keys(pages)[0];
      if (firstPageId && firstPageId !== '-1') {
        const page = pages[firstPageId];
        const ref: ProjectHorizonsReference = {
          title: page.title || 'Блэкджек (Project Horizons)',
          url: BLACKJACK_FANDOM_PAGE_URL,
          extract: (page.extract || '').substring(0, 1800)
        };
        wikiCache.set(cacheKey, { data: [ref], timestamp: Date.now() });
        return ref;
      }
    }
  } catch (err) {
    console.warn('Could not fetch live Blackjack wiki page, falling back to embedded dossier:', err);
  }

  // Fallback to static canon reference
  const fallback: ProjectHorizonsReference = {
    title: 'Блэкджек (Project Horizons)',
    url: BLACKJACK_FANDOM_PAGE_URL,
    extract: 'Блэкджек (англ. Blackjack) — главная героиня повести «Fallout: Equestria — Project Horizons» автора Somber. Кобыла-единорог, бывший охранник Стойла 99 в окрестностях разрушенного города Хуффингтон (Hoofington). Метка — две карты, туз и валет (комбинация блэкджек / 21). Имеет репутацию отчаянного стрелка, любительницы виски и рискованных авантюр. В Пустоши известна под прозвищем «Дилер». Пережила многочисленные тяжелейшие ранения, заменена серией кибернетических имплантов и бионических протезов (включая шасси EC-1101).'
  };
  wikiCache.set(cacheKey, { data: [fallback], timestamp: Date.now() });
  return fallback;
}

/**
 * Search the Project Horizons wiki for topics
 */
export async function searchProjectHorizonsWiki(query: string): Promise<ProjectHorizonsReference[]> {
  const clean = query.trim().substring(0, 80);
  if (!clean) return [];

  const cached = wikiCache.get(clean);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const searchUrl = `${WIKI_API_URL}?action=query&list=search&srsearch=${encodeURIComponent(clean)}&srlimit=2&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': WIKI_USER_AGENT }
    });

    if (res.ok) {
      const data = await res.json();
      const hits = data.query?.search || [];
      const results: ProjectHorizonsReference[] = hits.map((hit: any) => ({
        title: hit.title,
        url: `https://falloutequestria.fandom.com/ru/wiki/${encodeURIComponent(hit.title.replace(/ /g, '_'))}`,
        extract: (hit.snippet || '').replace(/<[^>]+>/g, '')
      }));

      wikiCache.set(clean, { data: results, timestamp: Date.now() });
      return results;
    }
  } catch (e) {
    // fallback
  }

  return [];
}
