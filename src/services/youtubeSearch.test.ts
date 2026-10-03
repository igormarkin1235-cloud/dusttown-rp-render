import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractSongSearchQuery,
  parsePublicYouTubeSearchResults,
  searchYouTubeTrack
} from './youtubeSearch';

test('extracts a Fallout search from a direct Pipka music request', () => {
  assert.equal(extractSongSearchQuery('Пипка, включи какую-то песню фаллаут'), 'фаллаут');
  assert.equal(extractSongSearchQuery('включи музыку Fallout Equestria'), 'Fallout Equestria');
});

test('does not treat unrelated find requests as music searches', () => {
  assert.equal(extractSongSearchQuery('найди информацию про фракции'), null);
});

test('returns a playable YouTube track from the official search response', async () => {
  const track = await searchYouTubeTrack('Fallout soundtrack', 'test-key', async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('q'), 'Fallout soundtrack');
    assert.equal(url.searchParams.get('type'), 'video');
    return new Response(JSON.stringify({
      items: [{
        id: { videoId: 'abc123' },
        snippet: { title: 'Fallout Radio', channelTitle: 'Wasteland Radio' }
      }]
    }), { status: 200 });
  });

  assert.deepEqual(track, {
    id: 'abc123',
    url: 'https://www.youtube.com/watch?v=abc123',
    title: 'Fallout Radio',
    author: 'Wasteland Radio'
  });
});

test('finds a playable result from public YouTube search without any API key', async () => {
  const page = {
    contents: {
      twoColumnSearchResultsRenderer: {
        primaryContents: {
          sectionListRenderer: {
            contents: [{
              itemSectionRenderer: {
                contents: [{
                  videoRenderer: {
                    videoId: 'keyless42',
                    title: { runs: [{ text: 'Fallout Song & Radio' }] },
                    ownerText: { runs: [{ text: 'Wasteland Singer' }] }
                  }
                }]
              }
            }]
          }
        }
      }
    }
  };
  const html = `<script>var ytInitialData = ${JSON.stringify(page)};</script>`;
  const parsed = parsePublicYouTubeSearchResults(html);
  assert.equal(parsed[0].id, 'keyless42');

  const track = await searchYouTubeTrack('Fallout Song', undefined, async input => {
    assert.match(String(input), /^https:\/\/www\.youtube\.com\/results\?/);
    return new Response(html, { status: 200 });
  });
  assert.equal(track?.title, 'Fallout Song & Radio');
  assert.equal(track?.author, 'Wasteland Singer');
});