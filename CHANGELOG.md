# Changelog

## [1.2.6] - 2026-10-02

### Added
- **Система памяти и репутации игроков** (`src/services/littlepipReputation.ts`):
  - Персональное отслеживание отношений к каждому сталкеру (от -100 до +100).
  - Статусы: `best_friend` (любимчик), `friend` (друг), `neutral`, `suspicious`, `offended` (обида), `nemesis` (чёрный список).
  - Команды Telegram: `/pip_rep` (личное досье игрока), `/pip_top` (доска почёта и розыска), `/pip_joke` (байки Пустоши).
  - Реакция на извинения: возможность помириться и снять обиду.
- **База культовых интернет-мемов и анекдотов** (`src/services/littlepipMemesQuotes.ts`):
  - Популярные мемы рунета и гейминга («Это не баг, а фича», «Press F», «Шо, опять?!», «Слабоумие и отвага», «Карл!», «И так сойдёт»).
  - Сталкерские анекдоты и байки про Стойло 2, рейдеров и тостеры.
- **Каноничное досье Fandom Wiki** (`src/services/littlepipDossier.ts`):
  - Полная интеграция с русской Fandom Wiki о Литлпип (биография, друзья, психология, слабости).
- **Управление Пипкой из панели бота**:
  - Настройки поведения и разрешений на уровне топиков: чтение, ответы и блокировка.
  - Просмотр репутации игроков, ручная корректировка и снятие обид.

### Fixed
- **Устранено зацикливание на сидре и Макинтоше**:
  - Внедрена система Anti-Loop & Repetition Detection (автоматический запрет повторять слова, если они звучали в последних репликах).
  - Разнообразие тем: жизнь в Стойле, ремонт тостеров, любовь к Хомэйдж, подколы над ростом, проверка на радиацию.
- **Устранено падение Gemini моделей**:
  - Переход на стабильный проверенный стек моделей: `gemini-2.5-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite`, `gemini-2.5-pro`.
  - Задержка повтора (exponential backoff) при лимитах 429.
  - Удалены роботизированные шаблоны («Зацепилась за тему...», «Не смогла связаться с моделью...»); заменены на живые сталкерские реплики про радиопомехи Pip-Buck.

### Changed
- Калибровка характера: временами дерзкая, сочный уместный мат, легкий флирт (к Создателю @MrWhitePio и админам шанс флирта заметно выше), сочувствие и поддержка при хандре, агрессивный отпор на наглый прессинг.

## [1.2.5] - 2026-10-01

### Added
- Spoken Littlepip replies with radio chat integration
- YouTube music search functionality
- Button sounds and nuclear alert effects
- In-app public and private chat system

### Fixed
- Pip voice synthesis and chat announcements
- Profile sync typing issues
- Littlepip radio updates
- Telegram webhook handling (clear before polling)

### Changed
- Refined Littlepip behavior and interactions
- Updated render system with latest changes
- Grounded Pipka answers in bot features

### Recent Updates
1. Fix Pip voice, chat announcements, and profile sync (2026-10-01 23:24)
2. Update latest render and chat changes (2026-10-01 22:38)
3. Sync profile typing and finalize Littlepip radio update (2026-10-01 21:54)
4. Add spoken Littlepip replies (2026-10-01 20:44)
5. Ground Pipka answers in bot features (2026-10-01 20:12)
6. Add Littlepip radio chat and YouTube music search (2026-10-01 20:07)
7. Integrate radio player and refine Littlepip behavior (2026-10-01 19:26)
8. Add button sounds and nuclear alert effects (2026-09-30 15:31)
9. Clear webhook before Telegram polling (2026-09-30 15:24)
10. Add in-app public and private chat (2026-09-30 15:05)
