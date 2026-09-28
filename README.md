# MAX Doctor Wait

Проект для ожидания свободного времени записи к врачу в MAX.

Пользователь открывает Mini App из MAX, задаёт параметры подходящей записи к врачу, а система сохраняет ожидание и проверяет доступные слоты. Когда появляется подходящее время, backend передаёт информацию MAX-боту, а бот отправляет пользователю уведомление.

## Архитектура

Проект состоит из трёх основных частей:

### Mini App

Mini App реализован на React + Vite и находится в директории `miniapp`.

Пользователь может:

- выбрать специальность врача;
- указать период поиска;
- выбрать дни недели;
- указать подходящее время;
- создать ожидание;
- посмотреть активные ожидания;
- отменить ожидание.

Production-версия Mini App размещена на Vercel:

`https://max-doctor-wait.vercel.app`

Mini App обращается к backend через публичный HTTPS-адрес Cloudflare Tunnel.

### Backend

Backend реализован на Node.js + Express и находится в директории `backend`.

Backend:

- принимает ожидания пользователей;
- хранит активные ожидания;
- работает с тестовым расписанием врачей;
- проверяет соответствие свободных слотов условиям пользователя;
- формирует данные о найденной записи;
- передаёт уведомление MAX-боту.

Backend работает на порту `3000`.

Основные API:

- `GET /` — проверка работы backend;
- `GET /api/waiting-requests` — список ожиданий;
- `POST /api/waiting-requests` — создание ожидания;
- `GET /api/waiting-requests/:id` — получение ожидания;
- `PATCH /api/waiting-requests/:id/cancel` — отмена ожидания;
- `GET /api/schedule` — расписание;
- `POST /api/schedule` — добавление нового свободного слота и проверка совпадений;
- `GET /api/matches` — получение найденных совпадений;
- `POST /api/check-matches` — запуск проверки совпадений и отправки уведомлений;
- `GET /api/users/:userId/waiting` — ожидания конкретного пользователя;
- `GET /api/users/:userId/matches` — найденные записи пользователя;
- `GET /api/waiting-requests/:id/status` — статус ожидания.

### MAX Bot

MAX-бот реализован на Node.js с использованием `@maxhub/max-bot-api`.

Бот:

- обрабатывает `/start`;
- сохраняет данные пользователя, необходимые для отправки уведомлений;
- получает найденную запись от backend;
- отправляет пользователю уведомление в MAX.

Внутри Docker Compose бот также поднимает HTTP-сервис на порту `3001`.

Backend передаёт найденную запись:

`POST /notify`

с данными:

```json
{
  "userId": "<MAX_USER_ID>",
  "appointment": {
    "specialty": "...",
    "date": "...",
    "time": "..."
  }
}
```

После этого бот вызывает функцию отправки уведомления пользователю через MAX Bot API.

## Схема работы

```text
MAX
 ↓
Mini App (Vercel)
 ↓
Cloudflare Tunnel
 ↓
Backend :3000
 ↓
Matching Engine
 ↓
POST http://bot:3001/notify
 ↓
MAX Bot
 ↓
Уведомление пользователю в MAX
```

## Структура проекта

```text
max-doctor-wait/
├── backend/
│   ├── data/
│   │   ├── doctorSchedule.js
│   │   └── waitingRequests.js
│   ├── services/
│   │   ├── matchingEngine.js
│   │   └── notificationService.js
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── miniapp/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ActiveWaits.jsx
│   │   │   └── CreateWait.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── bot.js
├── notifications.js
├── users.js
├── docker-compose.yml
├── Dockerfile.bot
├── .env.example
└── package.json
```

## Переменные окружения

Для работы MAX-бота необходим токен.

В репозитории находится файл `.env.example`:

```env
MAX_BOT_TOKEN=
```

Создайте на его основе `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

После этого укажите токен вашего MAX-бота:

```env
MAX_BOT_TOKEN=YOUR_MAX_BOT_TOKEN
```

Не добавляйте настоящий токен в README или Git.

## Запуск через Docker Compose

Для запуска backend и MAX-бота необходимы Docker и Docker Compose.

Из корня проекта выполните:

```bash
docker compose up --build
```

Docker Compose запускает два сервиса:

- `backend` — Express API на порту `3000`;
- `bot` — MAX-бот и внутренний сервис уведомлений на порту `3001`.

Backend доступен локально по адресу:

`http://localhost:3000`

В Docker-сети backend обращается к сервису уведомлений бота по адресу:

`http://bot:3001/notify`

Этот адрес задаётся переменной окружения:

```env
BOT_NOTIFICATION_URL=http://bot:3001/notify
```

Остановить сервисы можно командой:

```bash
docker compose down
```

## Cloudflare Tunnel

Backend запускается локально в Docker, поэтому для доступа к нему из размещённого в интернете Mini App используется Cloudflare Tunnel.

После запуска Docker Compose необходимо предоставить публичный HTTPS-доступ к локальному backend на порту `3000`.

Для Quick Tunnel используется команда:

```bash
cloudflared tunnel --url http://localhost:3000
```

Cloudflare выдаст адрес вида:

```text
https://example.trycloudflare.com
```

Этот HTTPS-адрес используется Mini App для запросов к backend.

### Ограничение Quick Tunnel

Quick Tunnel создаёт временный адрес.

После остановки и повторного запуска `cloudflared` может быть выдан новый адрес `trycloudflare.com`.

В этом случае необходимо:

1. получить новый URL Cloudflare Tunnel;
2. изменить адрес backend в Mini App;
3. заново выполнить deployment Mini App на Vercel.

Поэтому Quick Tunnel подходит для демонстрации и тестирования проекта, но не является постоянным production-адресом backend.

## Внешние сервисы

Некоторые части системы работают вне Docker Compose.

**MAX** используется для запуска Mini App и взаимодействия пользователя с ботом. Для работы бота необходим токен MAX Bot API.

**Vercel** используется для размещения Mini App. Текущая production-версия Mini App размещена по адресу:

`https://max-doctor-wait.vercel.app`

**Cloudflare Tunnel** предоставляет публичный HTTPS-доступ к backend, который запускается локально в Docker.

Vercel, MAX и Cloudflare Tunnel не запускаются командой `docker compose up`.

## Полный сценарий работы

1. Пользователь открывает Mini App из MAX.
2. Mini App получает данные пользователя MAX.
3. Пользователь задаёт параметры желаемой записи к врачу.
4. Mini App отправляет ожидание в backend.
5. Backend сохраняет ожидание.
6. Matching Engine сравнивает ожидание со свободными слотами.
7. При появлении подходящего слота backend формирует уведомление.
8. Backend отправляет его в сервис бота через `POST /notify`.
9. MAX-бот получает `userId` и данные записи.
10. Бот отправляет пользователю уведомление в MAX.

## Безопасность

В репозиторий нельзя добавлять:

- настоящий `MAX_BOT_TOKEN`;
- реальные идентификаторы пользователей MAX;
- другие секреты и приватные данные.

Для описания переменных окружения используется `.env.example`.

## Проверенный сценарий

Проект проверен в следующей конфигурации:

```text
MAX
→ Mini App на Vercel
→ Cloudflare Tunnel
→ backend в Docker
→ matching
→ bot в Docker
→ уведомление пользователю в MAX
```

Полный сценарий был протестирован с реальной доставкой уведомления пользователю MAX.