# MAX Doctor Wait

Проект для ожидания свободного времени записи к врачу в MAX.

Пользователь открывает Mini App из MAX, задаёт параметры подходящей записи к врачу, а система сохраняет ожидание и проверяет доступные слоты. Когда при проверке находится подходящее время, backend передаёт информацию MAX-боту, а бот отправляет пользователю уведомление.

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
- `GET /api/schedule` — получение тестового расписания;
- `POST /api/schedule` — добавление нового свободного слота и проверка совпадений;
- `GET /api/matches` — получение найденных совпадений;
- `POST /api/check-matches` — запуск проверки существующих ожиданий и отправки уведомлений;
- `GET /api/users/:userId/waiting` — ожидания конкретного пользователя;
- `GET /api/users/:userId/matches` — найденные записи пользователя;
- `GET /api/waiting-requests/:id/status` — статус ожидания.

### Matching

Matching Engine сравнивает параметры активного ожидания пользователя со свободными слотами тестового расписания.

В текущей демонстрационной версии постоянный фоновый мониторинг расписания не реализован.

Проверку существующих ожиданий можно запустить вручную запросом:

```http
POST /api/check-matches
```

Кроме того, добавление нового слота запросом:

```http
POST /api/schedule
```

сразу запускает проверку нового слота на соответствие активным ожиданиям.

Если найдено совпадение, backend формирует уведомление и передаёт его сервису MAX-бота.

### MAX Bot

MAX-бот реализован на Node.js с использованием `@maxhub/max-bot-api`.

Бот:

- обрабатывает `/start`;
- сохраняет данные пользователя, необходимые для отправки уведомлений;
- получает найденную запись от backend;
- отправляет пользователю уведомление в MAX.

Внутри Docker Compose бот поднимает HTTP-сервис уведомлений на порту `3001`.

Порт `3001` используется только внутри Docker-сети. Он не публикуется наружу на хост.

Backend передаёт найденную запись:

```http
POST /notify
```

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
├── russian-trusted-root-ca.crt
├── .env.example
└── package.json
```

### TLS-сертификат для MAX API

Файл `russian-trusted-root-ca.crt` содержит публичный корневой сертификат, который используется ботом для TLS-соединения с MAX API внутри Docker.

Файл не содержит токен MAX-бота или другие приватные данные.

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

Настоящий токен нельзя добавлять в README или Git.

## Запуск через Docker Compose

Для запуска backend и MAX-бота необходимы Docker и Docker Compose.

Перед запуском убедитесь, что создан файл `.env` и в нём указан `MAX_BOT_TOKEN`.

Из корня проекта выполните:

```bash
docker compose up --build
```

Docker Compose запускает два сервиса:

- `backend` — Express API, опубликованный на хосте на порту `3000`;
- `bot` — MAX-бот и внутренний сервис уведомлений на порту `3001`.

Backend доступен локально по адресу:

`http://localhost:3000`

Порт бота `3001` используется только для взаимодействия контейнеров внутри Docker-сети и наружу на хост не публикуется.

В Docker-сети backend обращается к сервису уведомлений бота по адресу:

`http://bot:3001/notify`

Этот адрес задаётся для backend переменной окружения:

```env
BOT_NOTIFICATION_URL=http://bot:3001/notify
```

### Проверка backend

После запуска:

```bash
docker compose up --build
```

откройте второй терминал PowerShell и выполните:

```powershell
Invoke-RestMethod http://localhost:3000/
```

Ожидаемый ответ:

```text
status message
------ -------
ok     MAX backend is running
```

Это означает, что backend успешно запущен и доступен на локальном порту `3000`.

Остановить контейнеры можно командой:

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

### Где изменить URL backend

После запуска нового Cloudflare Quick Tunnel полученный публичный URL необходимо указать в Mini App.

В текущей версии проекта адрес backend используется в двух файлах:

```text
miniapp/src/App.jsx
miniapp/src/components/CreateWait.jsx
```

В этих файлах необходимо заменить предыдущий адрес `trycloudflare.com` на новый URL, выданный Cloudflare Tunnel.

После изменения адреса необходимо заново задеплоить Mini App на Vercel, чтобы опубликованная версия использовала новый backend URL.

### Ограничение Quick Tunnel

Cloudflare Quick Tunnel создаёт временный публичный адрес.

После остановки и повторного запуска `cloudflared` выдаётся новый URL вида:

```text
https://example.trycloudflare.com
```

Поэтому после перезапуска Quick Tunnel необходимо:

1. получить новый URL Cloudflare Tunnel;
2. заменить URL backend в `miniapp/src/App.jsx`;
3. заменить URL backend в `miniapp/src/components/CreateWait.jsx`;
4. заново задеплоить Mini App на Vercel.

Quick Tunnel подходит для демонстрации и тестирования проекта, но не является постоянным production-адресом backend.

## Внешние сервисы

Некоторые части системы работают вне Docker Compose.

**MAX** используется для запуска Mini App и взаимодействия пользователя с ботом. Для работы бота необходим токен MAX Bot API.

**Vercel** используется для размещения Mini App. Текущая production-версия Mini App размещена по адресу:

`https://max-doctor-wait.vercel.app`

**Cloudflare Tunnel** предоставляет публичный HTTPS-доступ к backend, который запускается локально в Docker.

MAX, Vercel и Cloudflare Tunnel не запускаются командой:

```bash
docker compose up
```

## Полный сценарий работы

1. Пользователь открывает Mini App из MAX.
2. Mini App получает данные пользователя MAX.
3. Пользователь задаёт параметры желаемой записи к врачу.
4. Mini App отправляет ожидание в backend через публичный адрес Cloudflare Tunnel.
5. Backend сохраняет ожидание в памяти.
6. Проверка совпадений запускается через `POST /api/check-matches` либо при добавлении нового слота через `POST /api/schedule`.
7. Matching Engine сравнивает активные ожидания со свободными слотами.
8. При обнаружении подходящего слота backend формирует уведомление.
9. Backend отправляет его внутреннему сервису бота через `POST http://bot:3001/notify`.
10. MAX-бот получает `userId` и данные записи.
11. Бот отправляет пользователю уведомление в MAX.

## Ограничения прототипа

Проект является демонстрационным прототипом.

Ожидания пользователей и тестовое расписание врачей хранятся в памяти backend.

Это означает, что после остановки или перезапуска контейнера backend эти данные сбрасываются.

Постоянное хранилище или база данных в текущей версии не используются.

Также в текущей демонстрационной версии нет постоянного фонового мониторинга расписания. Проверка существующих ожиданий запускается через:

```http
POST /api/check-matches
```

При добавлении нового слота через:

```http
POST /api/schedule
```

backend также сразу проверяет этот слот на совпадение с активными ожиданиями.

Cloudflare Quick Tunnel предоставляет временный публичный URL, поэтому после его перезапуска необходимо обновить URL backend в Mini App и повторно выполнить deployment на Vercel.

## Безопасность

В репозиторий нельзя добавлять:

- настоящий `MAX_BOT_TOKEN`;
- реальные идентификаторы пользователей MAX;
- другие секреты и приватные данные.

Для примеров идентификаторов пользователей следует использовать значения вида:

```text
<MAX_USER_ID>
```

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