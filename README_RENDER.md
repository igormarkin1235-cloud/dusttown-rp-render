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
   * `GEMINI_API_KEY` = ключ Google Gemini для ответов AI-агента Littlepip. Добавьте его напрямую в Environment Variables на Render, не храните в GitHub.
   * `NODE_ENV` = `production`
6. Нажмите **«Deploy Web Service»**.

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

### 3. Подключение к боту в Telegram
1. Дождитесь завершения сборки (1-2 минуты). Render выдаст вам постоянную публичную ссылку:
   `https://dusttown-rp-xxxx.onrender.com`
2. Откройте в Telegram бота **@BotFather**:
   * Напишите команду: `/mybots` → выберите вашего бота.
   * Нажмите **Bot Settings** → **Menu Button** → **Configure menu button**.
   * Вставьте ссылку от Render: `https://dusttown-rp-xxxx.onrender.com`.
3. Готово! Теперь бот и Mini App работают 24/7.
