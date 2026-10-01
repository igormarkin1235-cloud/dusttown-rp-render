export interface YouTubeTrackResult {
  id: string;
  url: string;
  title: string;
  author: string;
}

const playbackVerb = /(?:^|[\s,:!])(?:включи|поставь|найди|подбери|запусти|проиграй)(?=$|[\s,:!])/iu;
const musicTerm = /(?:песн[яиюей]|трек[аиу]?|музык[ауеы]|youtube|ютуб)/iu;

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
  apiKey: string,
  fetcher: typeof fetch = fetch
): Promise<YouTubeTrackResult | null> {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '5',
    q: query,
    key: apiKey
  });
  const response = await fetcher(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!response.ok) throw new Error(`YouTube search failed (${response.status})`);

  const data = await response.json();
  const item = data.items?.find((result: any) => result.id?.videoId && result.snippet?.title);
  if (!item) return null;

  const id = String(item.id.videoId);
  return {
    id,
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    title: String(item.snippet.title),
    author: String(item.snippet.channelTitle || 'YouTube')
  };
}