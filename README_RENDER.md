# 🚀 Инструкция по запуску DustTown RP на Render.com

Этот архив содержит готовый проект **DustTown RP — Telegram Bot & Mini App** для развертывания на бесплатном хостинге Render.com.

---

### 1. Подготовка репозитория (1 минута)
1. Распакуйте скачанный ZIP-архив в отдельную папку.
2. Загрузите файлы в ваш новый репозиторий на [GitHub](https://github.com/new).

---

### 2. Развертывание на Render.com (2 минуты)
1. Перейдите на сайт **[Render.com](https://render.com)** и войдите через ваш GitHub-аккаунт.
2. Нажмите синюю кнопку **«New +»** → выберите **«Web Service»**.
3. Выберите ваш репозиторий с проектом DustTown RP.
4. Заполните настройки:
   * **Name:** `dusttown-rp` (или любое имя)
   * **Language / Environment:** `Node`
   * **Build Command:** `npm run build`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free` (бесплатно)
5. В разделе **Environment Variables** (переменные окружения) добавьте:
   * `TELEGRAM_BOT_TOKEN` = токен бота из BotFather (задайте как приватную переменную окружения)
   * `NODE_ENV` = `production`
6. Нажмите **«Deploy Web Service»**.

---

### 3. Подключение к боту в Telegram
1. Дождитесь завершения сборки (1-2 минуты). Render выдаст вам постоянную публичную ссылку:
   `https://dusttown-rp-xxxx.onrender.com`
2. Откройте в Telegram бота **@BotFather**:
   * Напишите команду: `/mybots` → выберите вашего бота.
   * Нажмите **Bot Settings** → **Menu Button** → **Configure menu button**.
   * Вставьте ссылку от Render: `https://dusttown-rp-xxxx.onrender.com`.
3. Готово! На бесплатном тарифе Render сервис может засыпать после периода бездействия, поэтому первый запуск после паузы иногда занимает время.

### Обновление уже созданного сервиса
Повторно создавать или подключать Render Web Service не нужно. Убедитесь, что он связан с нужным GitHub-репозиторием и веткой `main`, а Auto-Deploy включён. После отправки изменений в `main` Render сам соберёт и перезапустит приложение. Если Auto-Deploy выключен, выберите **Manual Deploy** → **Deploy latest commit**.

Храните `TELEGRAM_BOT_TOKEN` только в Environment Variables Render. Если токен ранее попадал в ZIP или исходный код, отзовите его через BotFather и задайте новый в настройках сервиса.

### Хранение данных
Приложение сохраняет данные в `.dusttown_data.json` на диске сервера. Файловая система бесплатного Render не постоянная: данные могут пропасть после перезапуска или нового деплоя. Для постоянного хранения подключите поддерживаемый тарифом Persistent Disk или внешнюю базу данных.
