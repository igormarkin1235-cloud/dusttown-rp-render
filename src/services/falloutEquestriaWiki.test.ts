import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cleanFalloutEquestriaWikitext,
  FALLOUT_EQUISTRIA_FORUM_URL,
  formatFalloutEquestriaReferences,
  searchFalloutEquestriaWiki,
  shouldSearchFalloutEquestriaWiki
} from './falloutEquestriaWiki';

test('points Littlepip to the real Russian Fallout Equestria community forum', () => {
  assert.match(FALLOUT_EQUISTRIA_FORUM_URL, /^https:\/\/falloutequestria\.fandom\.com\/ru\/wiki\//);
});

test('looks up lore questions and leaves unrelated chat alone', () => {
  assert.equal(shouldSearchFalloutEquestriaWiki('Пипка, кто такая Литлпип?'), true);
  assert.equal(shouldSearchFalloutEquestriaWiki('Пипка, кто такая Флаттершай?'), true);
  assert.equal(shouldSearchFalloutEquestriaWiki('Пипка, привет!'), false);
  assert.equal(shouldSearchFalloutEquestriaWiki('включи песню про лето'), false);
});

test('searches Fandom and returns linked article extracts as grounded context', async () => {
  const requestedUrls: URL[] = [];
  const result = await searchFalloutEquestriaWiki('Пипка, расскажи про Литлпип', async input => {
    const url = new URL(String(input));
    requestedUrls.push(url);
    if (url.searchParams.get('list') === 'search') {
      return new Response(JSON.stringify({ query: { search: [{ title: 'Литлпип' }] } }), { status: 200 });
    }
    return new Response(JSON.stringify({
      query: {
        pages: [{
          title: 'Литлпип',
          revisions: [{ slots: { main: { content: '{{Персонаж|имя=Пипка}}\nГероиня [[Fallout: Equestria|Fallout: Equestria]]. Она покинула Стойло 2 и отправилась исследовать Эквестрию вместе со спутниками.' } } }]
        }]
      }
    }), { status: 200 });
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Литлпип');
  assert.match(result[0].url, /falloutequestria\.fandom\.com/);
  assert.match(formatFalloutEquestriaReferences(result), /Героиня Fallout: Equestria/);
  assert.equal(requestedUrls.length, 2);
});

test('fetches each revision separately because Fandom rejects rvlimit with multiple titles', async () => {
  const revisionTitles: string[] = [];
  const result = await searchFalloutEquestriaWiki('расскажи про Литлпип', async input => {
    const url = new URL(String(input));
    if (url.searchParams.get('list') === 'search') {
      return new Response(JSON.stringify({ query: { search: [{ title: 'Литлпип' }, { title: 'Отряд Литлпип' }] } }), { status: 200 });
    }

    const title = url.searchParams.get('titles') || '';
    revisionTitles.push(title);
    assert.equal(url.searchParams.get('rvlimit'), '1');
    assert.equal(title.includes('|'), false);
    return new Response(JSON.stringify({
      query: {
        pages: [{
          title,
          revisions: [{ slots: { main: { content: `Статья ${title} содержит достаточно текста, чтобы пройти минимальный порог извлечения и добавить источник в контекст Пипки.` } } }]
        }]
      }
    }), { status: 200 });
  });

  assert.deepEqual(revisionTitles, ['Литлпип', 'Отряд Литлпип']);
  assert.equal(result.length, 2);
});

test('cleans nested wiki templates and keeps readable article text', () => {
  const clean = cleanFalloutEquestriaWikitext('{{Outer|x={{Inner|y=z}}}}\n== История ==\nПипка [[Стойло 2|нашла дом]].');
  assert.equal(clean, 'История\nПипка нашла дом.');
});