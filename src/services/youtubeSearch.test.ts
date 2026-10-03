import assert from 'node:assert/strict';
import test from 'node:test';

import { extractSongSearchQuery, searchYouTubeTrack } from './youtubeSearch';

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