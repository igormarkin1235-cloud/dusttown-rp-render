import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hasBlackjackMention,
  parseModerationIntent
} from './blackjackAgent';
import {
  checkBlackjackTopicPermission,
  isAuthorizedBlackjackAdmin
} from './blackjackConfig';

test('detects Blackjack mentions and triggers correctly', () => {
  assert.equal(hasBlackjackMention('Блэкджек, глянь сюда'), true);
  assert.equal(hasBlackjackMention('Блэки, вылезай из бара'), true);
  assert.equal(hasBlackjackMention('Джеки, разберись с ним'), true);
  assert.equal(hasBlackjackMention('позови блэкджек'), true);
  assert.equal(hasBlackjackMention('Blackjack, take him down'), true);
  assert.equal(hasBlackjackMention('просто обычный текст без имени'), false);
});

test('parses Blackjack moderation commands properly', () => {
  const muteCmd = parseModerationIntent('!mute @violator 15 Спам и флуд');
  assert.equal(muteCmd.action, 'mute');
  assert.equal(muteCmd.targetUser, '@violator');
  assert.equal(muteCmd.durationMinutes, 15);

  const banCmd = parseModerationIntent('!ban @griefer Рейд');
  assert.equal(banCmd.action, 'ban');
  assert.equal(banCmd.targetUser, '@griefer');

  const regularChat = parseModerationIntent('Привет, Блэкджек, как обстановка на Пустоши?');
  assert.equal(regularChat.action, null);
});

test('validates topic permissions and admin rights', () => {
  const topicPerm = checkBlackjackTopicPermission('general');
  assert.equal(topicPerm.canObserve, true);

  const forbidden = checkBlackjackTopicPermission('private_staff');
  assert.equal(forbidden.canObserve, false);

  assert.equal(isAuthorizedBlackjackAdmin('@MrWhitePio'), true);
  assert.equal(isAuthorizedBlackjackAdmin('MrWhitePio'), true);
  assert.equal(isAuthorizedBlackjackAdmin('@random_user'), false);
});
