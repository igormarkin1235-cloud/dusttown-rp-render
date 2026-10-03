export interface YouTubeTrackResult {
  id: string;
  url: string;
  title: string;
  author: string;
}

const playbackVerb = /(?:^|[\s,:!])(?:включи|поставь|найди|подбери|запусти|проиграй)(?=$|[\s,:!])/iu;
const musicTerm = /(?:песн[яиюей]|трек[аиу]?|музык[ауеы]|youtube|ютуб)/iu;
const YOUTUBE_SEARCH_URL = 'https://www.youtube.com/results';

function getYouTubeText(value: any): string {
  if (typeof value?.simpleText === 'string') return value.simpleText;
  if (Array.isArray(value?.runs)) return value.runs.map((run: any) => run.text || '').join('');
  return '';
}

export function extractYouTubeInitialData(html: string): any | null {
  const marker = /(?:var|window\.)\s*ytInitialData\s*=\s*/.exec(html);
  if (!marker) return null;

  const start = html.indexOf('{', marker.index + marker[0].length);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, index + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function parsePublicYouTubeSearchResults(html: string): YouTubeTrackResult[] {
  const data = extractYouTubeInitialData(html);
  if (!data) return [];

  const renderers: any[] = [];
  const visit = (value: any) => {
    if (!value || typeof value !== 'object' || renderers.length >= 20) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value.videoRenderer) renderers.push(value.videoRenderer);
    Object.values(value).forEach(visit);
  };
  visit(data);

  const tracks: YouTubeTrackResult[] = [];
  const seen = new Set<string>();
  for (const renderer of renderers) {
    const id = String(renderer.videoId || '');
    const title = getYouTubeText(renderer.title);
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    tracks.push({
      id,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
      title,
      author: getYouTubeText(renderer.ownerText) || getYouTubeText(renderer.longBylineText) || 'YouTube'
    });
    if (tracks.length >= 5) break;
  }
  return tracks;
}

export function extractSongSearchQuery(text: string): string | null {
  const withoutAddress = text.trim().replace(/^(?:пипка|литлпип|литка|лилька|littlepip)[\s,:!?-]*/iu, '');
  const command = playbackVerb.exec(withoutAddress);
  if (!command) return null;
  const tail = withoutAddress.slice(command.index + command[0].length).trim();
  if (!tail || (command[0].trim().toLowerCase() === 'найди' && !musicTerm.test(tail))) return null;

  const query = tail
    .replace(/^(?:мне\s+)?(?:(?:какую|какую-нибудь|какую-то|любую|какой-нибудь)\s+)?(?:песню|песенку|трек|музыку)\s*/iu, '')
    .replace(/^(?:на\s+ютубе|на\s+youtube)\s*/iu, '')
    .trim();

  return query || (musicTerm.test(tail) ? 'Fallout Equestria soundtrack' : null);
}

export async function searchYouTubeTrack(
  query: string,
  apiKey?: string,
  fetcher: typeof fetch = fetch
): Promise<YouTubeTrackResult | null> {
  if (apiKey) {
    try {
      const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        maxResults: '5',
        q: query,
        key: apiKey
      });
      const response = await fetcher(`https://www.googleapis.com/youtube/v3/search?${params}`, {
        signal: AbortSignal.timeout(7000)
      });
      if (response.ok) {
        const data = await response.json();
        const item = data.items?.find((result: any) => result.id?.videoId && result.snippet?.title);
        if (item) {
          const id = String(item.id.videoId);
          return {
            id,
            url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
            title: String(item.snippet.title),
            author: String(item.snippet.channelTitle || 'YouTube')
          };
        }
      }
    } catch (error: any) {
      console.warn('[YouTube search] Data API unavailable; trying public search:', error?.message || error);
    }
  }

  const params = new URLSearchParams({ search_query: query });
  const response = await fetcher(`${YOUTUBE_SEARCH_URL}?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.7'
    },
    signal: AbortSignal.timeout(9000)
  });
  if (!response.ok) throw new Error(`Public YouTube search failed (${response.status})`);
  const results = parsePublicYouTubeSearchResults(await response.text());
  return results[0] || null;
}