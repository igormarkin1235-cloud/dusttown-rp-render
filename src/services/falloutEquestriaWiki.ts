export const FALLOUT_EQUISTRIA_FORUM_URL = 'https://falloutequestria.fandom.com/ru/wiki/%D0%A4%D0%BE%D1%80%D1%83%D0%BC:%D0%94%D0%BE%D0%B1%D1%80%D0%BE_%D0%BF%D0%BE%D0%B6%D0%B0%D0%BB%D0%BE%D0%B2%D0%B0%D1%82%D1%8C_%D0%B2_%D1%84%D0%BE%D1%80%D1%83%D0%BC_%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B0';
export const LITTLEPIP_FANDOM_PAGE_URL = 'https://falloutequestria.fandom.com/ru/wiki/%D0%9B%D0%B8%D1%82%D0%BB%D0%BF%D0%B8%D0%BF';

const WIKI_API_URL = 'https://falloutequestria.fandom.com/ru/api.php';
const WIKI_USER_AGENT = 'DustTownRP-Littlepip/2.0 (Fallout Equestria lore engine)';

// Expanded lore triggers including companions, locations, technology, and factions
const loreTerms = /(?:fallout|эквестр|ф[оэ]е|канон|литлпип|пипка|стойл|анклав|братств|рейдер|грифон|аликорн|смотрител|супермутант|северн|содружест|вельвет|каламити|стилхувз|хомэйдж|ксэнит|арба|тенпони|минталки|пипбак|макинтош|тостер)/iu;

export interface FalloutEquestriaReference {
  title: string;
  url: string;
  extract: string;
}

// In-memory cache of fetched wiki articles
const wikiCache = new Map<string, { data: FalloutEquestriaReference[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function shouldSearchFalloutEquestriaWiki(text: string): boolean {
  const query = text
    .trim()
    .replace(/^(?:пипка|литлпип|литка|лилька|littlepip)[\s,:!?-]*/iu, '');
  return loreTerms.test(query) || /(?:кто такая|кто такой|что такое|расскажи (?:про|о)|объясни|где находится|кто этот)/iu.test(query);
}

function removeNestedTemplates(wikitext: string): string {
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

export function cleanFalloutEquestriaWikitext(wikitext: string): string {
  return removeNestedTemplates(wikitext)
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/\{\|[\s\S]*?\|\}/g, ' ')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref\s*>/gi, ' ')
    .replace(/<ref\b[^>]*\/>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\[(?:Файл|File|Категория|Category):[^\]]*\]\]/giu, ' ')
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[(?:https?:\/\/\S+)\s+([^\]]+)\]/g, '$1')
    .replace(/'''''?([^']+?)'''''?/g, '$1')
    .replace(/^\s*=+\s*(.*?)\s*=+\s*$/gm, '$1')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Direct lookup of the canonical Littlepip page from Fandom
 */
export async function fetchLittlepipFandomArticle(fetcher: typeof fetch = fetch): Promise<FalloutEquestriaReference | null> {
  const cached = wikiCache.get('__canonical_littlepip__');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data[0]) {
    return cached.data[0];
  }

  try {
    const url = new URL(WIKI_API_URL);
    url.searchParams.set('action', 'query');
    url.searchParams.set('prop', 'revisions');
    url.searchParams.set('titles', 'Литлпип');
    url.searchParams.set('rvslots', 'main');
    url.searchParams.set('rvprop', 'content');
    url.searchParams.set('format', 'json');
    url.searchParams.set('formatversion', '2');

    const res = await fetcher(url, {
      headers: { 'User-Agent': WIKI_USER_AGENT },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return null;
    const json = await res.json();
    const page = json.query?.pages?.[0];
    if (!page || page.missing) return null;

    const rawContent = page.revisions?.[0]?.slots?.main?.content || '';
    const cleanContent = cleanFalloutEquestriaWikitext(rawContent);

    const ref: FalloutEquestriaReference = {
      title: 'Литлпип (Fallout: Equestria Wiki)',
      url: LITTLEPIP_FANDOM_PAGE_URL,
      extract: cleanContent.slice(0, 3500)
    };

    wikiCache.set('__canonical_littlepip__', { data: [ref], timestamp: Date.now() });
    return ref;
  } catch (e) {
    console.warn('[Littlepip Wiki] Failed to fetch live Fandom article:', e);
    return null;
  }
}

export async function searchFalloutEquestriaWiki(
  question: string,
  fetcher: typeof fetch = fetch
): Promise<FalloutEquestriaReference[]> {
  const query = question
    .trim()
    .replace(/^(?:пипка|литлпип|литка|лилька|littlepip)[\s,:!?-]*/iu, '')
    .replace(/^(?:расскажи|объясни|кто такая|кто такой|что такое|где|когда|почему|что за)\s*(?:про|о)?\s*/iu, '')
    .slice(0, 180);

  if (!query) return [];

  const cacheKey = query.toLowerCase();
  const cached = wikiCache.get(cacheKey);
  if (fetcher === fetch && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const request = (params: Record<string, string>) => {
    const url = new URL(WIKI_API_URL);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return fetcher(url, {
      headers: { 'User-Agent': WIKI_USER_AGENT },
      signal: AbortSignal.timeout(7000)
    });
  };

  try {
    const searchResponse = await request({
      action: 'query',
      list: 'search',
      srsearch: query,
      srnamespace: '0',
      srlimit: '3',
      format: 'json'
    });
    if (!searchResponse.ok) return [];

    const searchData = await searchResponse.json();
    const titles = [...new Set<string>(
      (searchData.query?.search || [])
        .map((item: any) => String(item.title || ''))
        .filter(Boolean)
    )].slice(0, 3);
    if (!titles.length) return [];

    const pageResults = await Promise.all(titles.map(async title => {
      const pageResponse = await request({
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        rvlimit: '1',
        redirects: '1',
        titles: title,
        format: 'json',
        formatversion: '2'
      });
      if (!pageResponse.ok) return [];
      const pageData = await pageResponse.json();
      return pageData.query?.pages || [];
    }));

    const refs = pageResults.flat()
      .map((page: any) => {
        const wikitext = page.revisions?.[0]?.slots?.main?.content || page.revisions?.[0]?.['*'] || '';
        return {
          title: String(page.title),
          url: `https://falloutequestria.fandom.com/ru/wiki/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
          extract: cleanFalloutEquestriaWikitext(String(wikitext)).slice(0, 2000)
        };
      })
      .filter((page: FalloutEquestriaReference) => page.extract.length > 60);

    wikiCache.set(cacheKey, { data: refs, timestamp: Date.now() });
    return refs;
  } catch (error: any) {
    console.warn('[Littlepip wiki] Fandom lookup failed:', error?.message || error);
    return [];
  }
}

export function formatFalloutEquestriaReferences(references: FalloutEquestriaReference[]): string {
  if (!references.length) return '';
  return references
    .map(reference => `Статья: ${reference.title}\nИсточник: ${reference.url}\nФрагмент:\n${reference.extract}`)
    .join('\n\n---\n\n');
}
