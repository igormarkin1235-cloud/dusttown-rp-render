# 🚀 Инструкция по запуску и обновлению DustTown RP на Render.com

Этот архив содержит готовый проект **DustTown RP — Telegram Bot & Mini App** для развертывания на бесплатном хостинге Render.com со всеми свежими исходниками и скомпилированной production-сборкой в папке `dist/`.

---

### 1. Подготовка репозитория (1 минута)
1. Распакуйте скачанный ZIP-архив в отдельную папку.
2. Загрузите файлы в ваш репозиторий на [GitHub](https://github.com). Если репозиторий уже есть — просто скопируйте файлы поверх с заменой и сделайте коммит:
   ```bash
   git add .
   git commit -m "Update DustTown RP to latest version"
   git push
   ```

---

### 2. Настройки на Render.com
Если вы создаете новый сервис:
1. Перейдите на сайт **[Render.com](https://render.com)** и войдите через ваш GitHub-аккаунт.
2. Нажмите синюю кнопку **«New +»** → выберите **«Web Service»**.
3. Выберите ваш репозиторий с проектом DustTown RP.
4. Заполните настройки:
   * **Name:** `dusttown-rp` (или любое имя)
   * **Language / Environment:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free` (бесплатно)
5. В разделе **Environment Variables** (переменные окружения) добавьте:
   * `TELEGRAM_BOT_TOKEN` = значение, выданное BotFather. Добавьте его напрямую в Environment Variables на Render, не храните в GitHub.
   * `GEMINI_API_KEY` = ключ Google Gemini для ответов AI-агента и озвучки Littlepip. Для голоса используется `gemini-3.8-flash-lite-tts` с бесплатной квотой Google AI Studio; при превышении квоты Mini App использует системный голос браузера.
   * `YOUTUBE_API_KEY` = server-side ключ Google Cloud с включённым YouTube Data API v3; нужен для поиска песен и не должен попадать в браузер или GitHub.
   * `NODE_ENV` = `production`
6. Нажмите **«Deploy Web Service»**.

Бот автоматически запускает Telegram polling в production. Используйте один активный экземпляр сервиса; чтобы отключить polling, задайте `DISABLE_TELEGRAM_POLLING=true`. Для контекста Литлпип по последним сообщениям группы откройте `@BotFather` → `/setprivacy` → выберите бота → `Disable`, затем удалите бота из группы и добавьте снова. При включённой Group Privacy Telegram не передаёт боту обычные сообщения; личные чаты и команды продолжают работать.

Аватар для радио-чата размещается в `public/avatars/littlepip.gif`.

### 3. Облачная база Firebase
1. В Firebase Console создайте проект, включите Cloud Firestore (Native mode) и Firebase Storage. Скопируйте точное имя bucket из раздела Storage.
2. Создайте сервисный аккаунт с правами Firestore read/write и Storage object read/write. Включите Firestore API и Cloud Storage API. Скачайте JSON-ключ и не добавляйте его в GitHub.
3. Перед переносом действующих production-данных откройте Mini App как создатель, нажмите **Экспорт данных** в панели бота и сохраните JSON-архив. Сначала импортируйте его в Firebase локально, проверьте итог импорта и только затем переключайте Render. Не перезапускайте старую службу до проверки импорта.
4. В Render Environment Variables задайте:
   * `FIREBASE_SERVICE_ACCOUNT_JSON` = всё содержимое JSON сервисного аккаунта
   * `FIREBASE_STORAGE_BUCKET` = имя bucket из Firebase Storage
5. Для імпорта положите credentials и путь к архиву в игнорируемый `.env`: `FIREBASE_SERVICE_ACCOUNT_JSON={...}`, `FIREBASE_STORAGE_BUCKET=имя-bucket`, `FIREBASE_IMPORT_STATE_FILE=путь-к-архиву.json`. Выполните `npm run import-firebase-state` и проверьте итог. Сервисный ключ используется только сервером; браузер напрямую к Firebase не подключается, Firebase App Check для этого потока не требуется.
6. После запуска проверьте `/api/version`: в поле `persistence` ожидаются `provider: "firebase"` и `healthy: true`. `provider: "local-json"` означает, что credentials не настроены или Firebase недоступен; проверьте server logs и права service account. Если snapshot в Firestore отсутствует, первый запуск автоматически загрузит локальный JSON/seed в Firebase, но для переноса реальных production-данных сначала обязательно выполните импорт из архива.
7. Firestore хранит профили, события, анкеты, награды, кейсы, каталог дропа, магазин, аукцион, фракции, галерею, логи, уведомления, версии и чаты отдельными документами. Data URL изображений сервер переносит в Firebase Storage, а в состоянии остаются download URL. Каждое сохранение сначала фиксируется локально, а затем последовательно синхронизируется с Firebase; ошибка облака не отменяет локальную запись.

Миграции данных версионированы (`schemaVersion`). Удалённая из актуального каталога фоновая косметика автоматически очищается и возвращает владельцу по 150 ℰQ за уникальный фон; повторный запуск возврат не дублирует. События, не соответствующие текущему контракту (тип, ID, дата, участники и награда), удаляются.

---

### ⚠️ ПОЧЕМУ НА RENDER МОЖЕТ НЕ ОБНОВЛЯТЬСЯ И КАК ЭТО РЕШИТЬ:

1. **Кеш сборки на Render (Самая частая причина):**
   Render по умолчанию сохраняет старые `node_modules` и результаты прошлой сборки. Чтобы принудительно обновить:
   * Откройте ваш Web Service на Render.com.
   * Вверху справа нажмите кнопку **«Manual Deploy»**.
   * Выберите пункт **«Clear build cache & deploy»** (Очистить кеш и развернуть).

2. **Как проверить, какая версия сейчас активна на Render:**
   Откройте в браузере ссылку:
   `https://ВАШ-СЕРВИС.onrender.com/api/version`
   Там вы увидите точное время сборки (`builtAt`), номер версии (`version: "1.2.5"`) и список всех активных модулей (`WeeklyArtShowcase`, `ArtGalleryView`, `LotteryScratchModal` и др.).

3. **Кеш Telegram Mini App (На телефоне или в приложении):**
   Telegram внутри своего WebView очень настойчиво кеширует страницы.
   * Сервер теперь отсылает строгие заголовки `Cache-Control: no-store, no-cache, must-revalidate` для HTML.
   * Если у вас всё ещё старый вид: нажмите три точки в углу Mini App в Telegram → «Перезагрузить страницу» (Reload Page) или перезапустите Telegram.

---

### 4. Подключение к боту в Telegram
1. Дождитесь завершения сборки (1-2 минуты). Render выдаст вам постоянную публичную ссылку:
   `https://dusttown-rp-xxxx.onrender.com`
2. Откройте в Telegram бота **@BotFather**:
   * Напишите команду: `/mybots` → выберите вашего бота.
   * Нажмите **Bot Settings** → **Menu Button** → **Configure menu button**.
   * Вставьте ссылку от Render: `https://dusttown-rp-xxxx.onrender.com`.
3. Готово! Теперь бот и Mini App работают 24/7.
