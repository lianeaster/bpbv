# Налаштування Facebook-інтеграції

Цей документ описує, як налаштувати автоматичне отримання постів з Facebook-групи кафедри.

## Крок 1: Створити Facebook App

1. Перейдіть на [developers.facebook.com](https://developers.facebook.com/)
2. Увійдіть під обліковим записом адміністратора групи
3. Натисніть **My Apps** → **Create App**
4. Оберіть тип **Business** → **Next**
5. Введіть назву (наприклад, `BPBV Website News`) → **Create App**
6. На сторінці додатку перейдіть **Settings** → **Basic**
7. Скопіюйте **App ID** та **App Secret**

## Крок 2: Отримати User Access Token

1. Перейдіть на [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. У полі **Facebook App** оберіть ваш створений додаток
3. Натисніть **Generate Access Token**
4. Дайте дозволи: `groups_access_member_info`, `publish_to_groups` (або просто `groups_access`)
5. Скопіюйте отриманий **Access Token**

## Крок 3: Перетворити на Long-Lived Token

Короткий токен живе ~1 годину. Для автоматизації потрібен довгий (~60 днів):

```bash
curl -s "https://graph.facebook.com/v21.0/oauth/access_token?\
grant_type=fb_exchange_token&\
client_id=YOUR_APP_ID&\
client_secret=YOUR_APP_SECRET&\
fb_exchange_token=YOUR_SHORT_TOKEN"
```

Збережіть отриманий `access_token` з відповіді.

## Крок 4: Налаштувати змінні середовища

Скопіюйте `.env.example` → `.env` і заповніть:

```bash
cp .env.example .env
```

Відредагуйте `.env`:
```
FB_APP_ID=123456789
FB_APP_SECRET=abc123...
FB_ACCESS_TOKEN=EAAxxxxxxx...
FB_GROUP_ID=918669628322290
```

## Крок 5: Запустити скрипт

```bash
node fetch-news.js
```

Скрипт завантажить останні пости з групи і оновить `news.json`.

## Крок 6 (опційно): Налаштувати автоматизацію через GitHub Actions

Workflow `.github/workflows/fetch-news.yml` щодня о 11:00 за Києвом отримує нові пости і робить автокоміт.

Для цього додайте секрети у GitHub:

1. Перейдіть у **Settings** → **Secrets and variables** → **Actions**
2. Натисніть **New repository secret** і додайте:
   - `FB_ACCESS_TOKEN` — ваш long-lived token
   - `FB_GROUP_ID` — `918669628322290`
3. Також можна запустити workflow вручну: **Actions** → **Fetch Facebook News** → **Run workflow**

## Важливо

- **Токен** потребує оновлення кожні ~60 днів
- **Не комітьте** файл `.env` у репозиторій (він вже в `.gitignore`)
- Якщо App Review від Facebook ще не пройдений, скрипт працює в **Development mode** (бачить пости тільки від адмінів/розробників додатку)
- Для повного доступу до всіх постів групи потрібно пройти **App Review** (подати заявку на `groups_access`)
