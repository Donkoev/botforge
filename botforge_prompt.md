# BotForge — Полное техническое задание

## Описание проекта

BotForge — это веб-панель управления Telegram-ботами-зеркалами. Зеркала перенаправляют пользователей на основного бота через настраиваемое приветственное сообщение с инлайн-кнопками. Панель обеспечивает полный контроль над всеми ботами, статистику переходов и рассылку.

**Тематика:** продажа VPN-сервисов (легитимный бизнес, без спама и скама).

---

## Стек технологий

- **Backend:** Python 3.12, FastAPI, aiogram 3.x
- **Frontend:** React 18 + TypeScript, Vite, Ant Design (UI-кит), Recharts (графики)
- **База данных:** PostgreSQL 16
- **Кэш/очереди:** Redis
- **Контейнеризация:** Docker + Docker Compose
- **Веб-сервер:** Nginx (reverse proxy, HTTPS)
- **ОС сервера:** Debian 12

---

## Структура монорепозитория

```
botforge/
├── docker-compose.yml
├── docker-compose.dev.yml          # для локальной разработки на Windows
├── .env.example
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                    # миграции БД
│   │   └── versions/
│   ├── alembic.ini
│   └── app/
│       ├── main.py                 # точка входа FastAPI
│       ├── config.py               # настройки из .env
│       ├── database.py             # подключение к PostgreSQL
│       │
│       ├── models/                 # SQLAlchemy модели
│       │   ├── __init__.py
│       │   ├── user.py             # модель админа панели
│       │   ├── bot.py              # модель бота-зеркала
│       │   ├── bot_user.py         # модель юзера, пришедшего через зеркало
│       │   ├── message_template.py # шаблон приветственного сообщения
│       │   └── broadcast.py        # модель рассылки
│       │
│       ├── schemas/                # Pydantic схемы
│       │   ├── __init__.py
│       │   ├── auth.py
│       │   ├── bot.py
│       │   ├── bot_user.py
│       │   ├── message_template.py
│       │   ├── broadcast.py
│       │   └── stats.py
│       │
│       ├── api/                    # FastAPI роутеры
│       │   ├── __init__.py
│       │   ├── auth.py             # логин, JWT токены
│       │   ├── bots.py             # CRUD ботов
│       │   ├── bot_users.py        # список юзеров, фильтры
│       │   ├── messages.py         # управление шаблонами сообщений
│       │   ├── broadcast.py        # управление рассылками
│       │   └── stats.py            # эндпоинты статистики
│       │
│       ├── services/               # бизнес-логика
│       │   ├── __init__.py
│       │   ├── bot_manager.py      # запуск/остановка ботов
│       │   ├── broadcast_service.py# логика рассылки
│       │   └── stats_service.py    # агрегация статистики
│       │
│       └── bot/                    # логика Telegram-бота (aiogram)
│           ├── __init__.py
│           ├── factory.py          # фабрика создания ботов
│           ├── handlers.py         # обработчики /start и др.
│           └── middlewares.py      # middleware для трекинга
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/                    # API клиент (axios)
│       │   ├── client.ts
│       │   ├── auth.ts
│       │   ├── bots.ts
│       │   ├── users.ts
│       │   ├── broadcast.ts
│       │   └── stats.ts
│       │
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── DashboardPage.tsx   # главная с графиками
│       │   ├── BotsPage.tsx        # список ботов
│       │   ├── BotSettingsPage.tsx  # настройки конкретного бота
│       │   ├── UsersPage.tsx       # список юзеров
│       │   ├── BroadcastPage.tsx   # создание рассылки
│       │   └── StatsPage.tsx       # подробная статистика
│       │
│       ├── components/
│       │   ├── Layout.tsx          # общий layout с сайдбаром
│       │   ├── BotCard.tsx         # карточка бота в списке
│       │   ├── UserTable.tsx       # таблица юзеров
│       │   ├── StatsChart.tsx      # графики статистики
│       │   ├── MessageEditor.tsx   # редактор сообщения + кнопок
│       │   └── BroadcastForm.tsx   # форма рассылки
│       │
│       ├── hooks/
│       │   └── useAuth.ts
│       │
│       └── utils/
│           └── helpers.ts
│
└── nginx/
    ├── Dockerfile
    └── nginx.conf                  # проксирование API + раздача фронта
```

---

## Модели базы данных (SQLAlchemy)

### Admin (пользователь панели)
```
id: Integer, PK
username: String, unique
password_hash: String
created_at: DateTime
```

### Bot (бот-зеркало)
```
id: Integer, PK
token: String, unique             # токен Telegram бота
name: String                      # отображаемое имя в панели
bot_username: String              # @username бота (получить через getMe)
is_active: Boolean, default=False # запущен или нет
created_at: DateTime
updated_at: DateTime
```

### MessageTemplate (приветственное сообщение бота)
```
id: Integer, PK
bot_id: Integer, FK -> Bot.id
language_code: String, default="ru"  # код языка (ru, en, uk и т.д.)
text: Text                           # текст сообщения (поддержка HTML/Markdown)
buttons: JSON                        # массив инлайн-кнопок [{text, url}]
created_at: DateTime
updated_at: DateTime
```

### BotUser (юзер, взаимодействовавший с зеркалом)
```
id: Integer, PK
telegram_id: BigInteger, unique
username: String, nullable
first_name: String, nullable
last_name: String, nullable
language_code: String, nullable      # язык клиента Telegram
source_bot_id: Integer, FK -> Bot.id # через какое зеркало пришёл
is_blocked: Boolean, default=False   # заблокировал ли бота
first_seen_at: DateTime              # первое взаимодействие
last_seen_at: DateTime               # последнее взаимодействие
```

### Broadcast (рассылка)
```
id: Integer, PK
title: String                        # название рассылки (для панели)
text: Text, nullable                 # текст сообщения
media_type: String, nullable         # photo/video/document/animation
media_file_id: String, nullable      # file_id медиа в Telegram
buttons: JSON, nullable              # инлайн-кнопки
target_bots: JSON                    # список bot_id для рассылки ([] = все)
status: String                       # draft/sending/completed/cancelled
total_users: Integer, default=0
sent_count: Integer, default=0
failed_count: Integer, default=0
created_at: DateTime
started_at: DateTime, nullable
completed_at: DateTime, nullable
```

---

## API эндпоинты

### Авторизация
```
POST /api/auth/login          — вход (username + password → JWT)
POST /api/auth/refresh        — обновление токена
GET  /api/auth/me             — текущий пользователь
```

### Боты
```
GET    /api/bots              — список всех ботов
POST   /api/bots              — добавить бота (передать token)
GET    /api/bots/{id}         — детали бота
PATCH  /api/bots/{id}         — обновить настройки бота
DELETE /api/bots/{id}         — удалить бота
POST   /api/bots/{id}/start   — запустить бота
POST   /api/bots/{id}/stop    — остановить бота
```

### Шаблоны сообщений
```
GET    /api/bots/{id}/messages              — все шаблоны бота
POST   /api/bots/{id}/messages              — создать шаблон (для языка)
PATCH  /api/bots/{id}/messages/{msg_id}     — редактировать шаблон
DELETE /api/bots/{id}/messages/{msg_id}     — удалить шаблон
```

### Пользователи
```
GET    /api/users             — список юзеров (фильтры: bot_id, дата, поиск)
GET    /api/users/{id}        — детали юзера
GET    /api/users/export      — экспорт в CSV
```

### Рассылки
```
GET    /api/broadcasts        — список рассылок
POST   /api/broadcasts        — создать рассылку
POST   /api/broadcasts/{id}/start   — запустить рассылку
POST   /api/broadcasts/{id}/cancel  — отменить рассылку
GET    /api/broadcasts/{id}         — статус рассылки
```

### Статистика
```
GET    /api/stats/overview           — общая статистика (всего юзеров, за сегодня, за неделю)
GET    /api/stats/daily?days=30      — юзеры по дням
GET    /api/stats/by-bot             — юзеры в разрезе ботов
GET    /api/stats/by-language        — юзеры по языкам
```

---

## Логика работы ботов-зеркал

### Фабрика ботов (bot/factory.py)
- Принимает токен бота и настройки из БД
- Создаёт экземпляр aiogram Bot + Dispatcher
- Регистрирует обработчики
- Запускает polling в отдельной asyncio task
- BotManager хранит dict {bot_id: task} для управления

### Обработчик /start (bot/handlers.py)
1. Получает `message.from_user` — извлекает telegram_id, username, first_name, last_name, language_code
2. Записывает или обновляет BotUser в БД (upsert по telegram_id + source_bot_id)
3. Определяет language_code пользователя
4. Ищет MessageTemplate для этого бота с matching language_code
5. Если нет шаблона для языка пользователя — использует шаблон "ru" (fallback)
6. Отправляет сообщение с текстом и инлайн-кнопками

### Middleware для трекинга (bot/middlewares.py)
- Логирует каждое взаимодействие
- Обновляет last_seen_at юзера

---

## Логика рассылки

### Сервис рассылки (services/broadcast_service.py)
1. Получает список target_bots (или все боты, если пусто)
2. Собирает всех BotUser для этих ботов, где is_blocked=False
3. Запускает отправку в фоновой задаче (asyncio или Celery/Redis Queue)
4. Для каждого юзера отправляет сообщение через соответствующего бота
5. Обрабатывает ошибки: если Telegram вернул "bot was blocked" — ставит is_blocked=True
6. Обновляет счётчики sent_count и failed_count в реальном времени
7. Задержка между сообщениями: 0.05 сек (не более 20 сообщений в секунду по лимитам Telegram)

---

## Веб-панель (Frontend)

### Страница логина
- Поля: username, password
- JWT сохраняется в httpOnly cookie или в памяти (НЕ localStorage)
- Редирект на дашборд после успешного входа

### Дашборд (главная)
- Карточки сверху: всего юзеров, новых сегодня, новых за неделю, активных ботов
- График: новые юзеры по дням (за последние 30 дней), Recharts AreaChart
- Таблица: топ-5 ботов по количеству юзеров
- Последние 10 юзеров (мини-таблица)

### Страница ботов
- Список карточек ботов, каждая показывает: имя, @username, статус (вкл/выкл), кол-во юзеров
- Кнопка "Добавить бота" — модалка с полем для токена
- На каждой карточке: кнопка старт/стоп, кнопка "Настройки"

### Настройки бота
- Основная информация (имя, токен замаскирован)
- Редактор приветственного сообщения:
  - Выбор языка (табы: RU, EN, и т.д. + кнопка добавить язык)
  - Текстовое поле для сообщения (поддержка HTML-форматирования Telegram)
  - Конструктор инлайн-кнопок: добавить кнопку (текст + URL), перетаскивание для сортировки, удаление
  - Кнопка "Предпросмотр" — показывает как будет выглядеть сообщение
- Кнопка удаления бота (с подтверждением)

### Страница пользователей
- Таблица с колонками: Telegram ID, Username, Имя, Язык, Источник (бот), Первый визит, Последний визит
- Фильтры: по боту-источнику, по дате, поиск по username/имени
- Пагинация
- Кнопка "Экспорт CSV"

### Страница рассылки
- Форма создания: текст, медиа (загрузка), кнопки, выбор ботов (мультиселект или "все")
- Список прошлых рассылок с статусами и статистикой (отправлено/ошибок)
- У активной рассылки — прогресс-бар в реальном времени

### Страница статистики
- Фильтр по периоду (7 дней / 30 дней / всё время / кастомный)
- Графики: юзеры по дням, юзеры по ботам (pie chart), юзеры по языкам (pie chart)
- Таблица по ботам: имя, всего юзеров, за период, % от общего

---

## Docker Compose

### Сервисы:
1. **backend** — FastAPI + aiogram (Python 3.12-slim)
2. **frontend** — сборка React (multi-stage: node для билда → nginx для раздачи)
3. **postgres** — PostgreSQL 16
4. **redis** — Redis 7
5. **nginx** — reverse proxy (API → backend:8000, всё остальное → frontend static)

### Переменные окружения (.env):
```
# Database
POSTGRES_USER=botforge
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=botforge

# Backend
DATABASE_URL=postgresql+asyncpg://botforge:<password>@postgres:5432/botforge
REDIS_URL=redis://redis:6379/0
JWT_SECRET=<random_secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<admin_password>

# Frontend
VITE_API_URL=/api

# Nginx
DOMAIN=panel.example.com
```

---

## Docker Compose для локальной разработки (docker-compose.dev.yml)

- backend с volume mount (./backend:/app) и --reload
- frontend с `npm run dev` и volume mount
- postgres и redis как обычно
- Без nginx, прямой доступ к портам (backend:8000, frontend:5173)

---

## Деплой на сервер

### Инициализация:
```bash
git clone https://github.com/<user>/botforge.git
cd botforge
cp .env.example .env
# отредактировать .env
docker compose up -d
```

### Обновление:
```bash
cd botforge
git pull
docker compose up -d --build
```

### HTTPS:
Использовать Certbot (Let's Encrypt) для получения SSL-сертификата для домена. Nginx конфиг должен поддерживать HTTP → HTTPS редирект.

---

## Важные детали реализации

### Безопасность
- JWT токены для авторизации, access + refresh схема
- Пароли хешируются через bcrypt
- CORS настроен только для домена панели
- Все API эндпоинты (кроме /auth/login) требуют авторизации

### Мультиязычность ботов
- Telegram передаёт `language_code` в объекте User
- Для каждого бота можно задать несколько шаблонов сообщений (по языкам)
- Если шаблон для языка юзера не найден — используется русский (fallback)
- В панели: табы для переключения между языками при редактировании

### Управление ботами
- Боты запускаются через aiogram polling в отдельных asyncio tasks
- BotManager — синглтон, хранит {bot_id: asyncio.Task}
- При запуске backend — автоматически запускаются все боты с is_active=True
- При добавлении нового бота — валидация токена через Telegram API (getMe)

### Обработка ошибок
- Если бот заблокирован пользователем — ловим исключение, ставим is_blocked=True
- Если токен невалидный — показываем ошибку в панели
- Все ошибки логируются

---

## Язык интерфейса
Весь интерфейс панели на **русском языке**.

---

## Стиль кода
- Backend: Python с type hints, async/await везде, Pydantic для валидации
- Frontend: TypeScript strict mode, функциональные компоненты, кастомные хуки
- Линтеры: ruff (Python), ESLint + Prettier (TypeScript)

---

## Инструкции для AI-ассистента

Ты создаёшь проект BotForge поэтапно. Создавай файлы по одному, начиная с:

1. Конфигурация проекта (docker-compose, .env, Dockerfiles)
2. Backend: модели → схемы → API → сервисы → бот-логика
3. Frontend: настройка Vite → layout → страницы по одной
4. Nginx конфиг
5. README.md

**Правила:**
- Пиши полный код каждого файла, без пропусков и `...`
- Каждый файл должен быть рабочим
- Используй актуальные версии библиотек
- Комментарии в коде на русском языке
- После каждого файла жди подтверждения перед следующим
- Если нужно уточнение — спрашивай
