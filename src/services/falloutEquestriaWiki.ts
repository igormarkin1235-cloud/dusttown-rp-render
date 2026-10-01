export const FALLOUT_EQUISTRIA_FORUM_URL = 'https://falloutequestria.fandom.com/ru/wiki/%D0%A4%D0%BE%D1%80%D1%83%D0%BC:%D0%94%D0%BE%D0%B1%D1%80%D0%BE_%D0%BF%D0%BE%D0%B6%D0%B0%D0%BB%D0%BE%D0%B2%D0%B0%D1%82%D1%8C_%D0%B2_%D1%84%D0%BE%D1%80%D1%83%D0%BC_%D1%81%D0%BE%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B0';

const WIKI_API_URL = 'https://falloutequestria.fandom.com/ru/api.php';
const WIKI_USER_AGENT = 'DustTownRP-Littlepip/1.0 (Fallout Equestria lore context)';
const loreTerms = /(?:fallout|эквестр|ф[оэ]е|канон|литлпип|пипка|стойл|анклав|братств|рейдер|грифон|аликорн|смотрител|супермутант|северн|содружест)/iu;

export interface FalloutEquestriaReference {
  title: string;
  url: string;
  extract: string;
}

export function shouldSearchFalloutEquestriaWiki(text: string): boolean {
  const query = text
    .trim()
    .replace(/^(?:пипка|литлпип|литка|лилька|littlepip)[\s,:!?-]*/iu, '');
  return loreTerms.test(query) || /(?:кто такая|кто такой|что такое|расскажи (?:про|о)|объясни)/iu.test(query);
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

export async function searchFalloutEquestriaWiki(
  question: string,
  fetcher: typeof fetch = fetch
): Promise<FalloutEquestriaReference[]> {
  const query = question
    .trim()
    .replace(/^(?:пипка|литлпип|литка|лилька|littlepip)[\s,:!?-]*/iu, '')
    .replace(/^(?:расскажи|объясни|кто такая|кто такой|что такое|где|когда|почему)\s*(?:про|о)?\s*/iu, '')
    .slice(0, 180);
  if (!query || !shouldSearchFalloutEquestriaWiki(question)) return [];

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

    return pageResults.flat()
      .map((page: any) => {
        const wikitext = page.revisions?.[0]?.slots?.main?.content || page.revisions?.[0]?.['*'] || '';
        return {
          title: String(page.title),
          url: `https://falloutequestria.fandom.com/ru/wiki/${encodeURIComponent(String(page.title).replace(/ /g, '_'))}`,
          extract: cleanFalloutEquestriaWikitext(String(wikitext)).slice(0, 1800)
        };
      })
      .filter((page: FalloutEquestriaReference) => page.extract.length > 80);
  } catch (error: any) {
    console.warn('[Littlepip wiki] Fandom lookup failed:', error?.message || error);
    return [];
  }
}

export function formatFalloutEquestriaReferences(references: FalloutEquestriaReference[]): string {
  if (!references.length) return '';
  return references
    .map(reference => `Статья: ${reference.title}\nИсточник: ${reference.url}\nФрагмент: ${reference.extract}`)
    .join('\n\n');
}