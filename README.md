# EntryPass — QR-система керування квитками та контролю доступу

EntryPass — вебзастосунок для створення та керування подіями, квитками та відвідувачами з використанням QR-кодів.

Система дозволяє організаторам керувати подіями й квитками, надавати контролерам доступ до перевірки квитків і фіксувати вхід відвідувачів. Backend — Node.js + Express (TypeScript), PostgreSQL і Prisma ORM; frontend — React + Vite.

## Основні можливості

- **Керування подіями:** створення та керування подіями.
- **Керування квитками:** створення квитків і генерація QR-кодів.
- **Контроль доступу:** перевірка квитків та підтвердження входу.
- **Ролі користувачів:** окремі сценарії роботи організаторів і контролерів.
- **Авторизація:** захист приватних API-маршрутів.
- **Валідація даних:** перевірка вхідних даних за допомогою Zod.
- **Зберігання даних:** робота з PostgreSQL через Prisma ORM.
- **Автоматизоване тестування:** перевірка API та бізнес-логіки.

## Технологічний стек

| Категорія | Технології |
|---|---|
| Мова програмування | TypeScript |
| Backend | Node.js, Express 5 |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Axios |
| База даних | PostgreSQL |
| ORM | Prisma 7 |
| Авторизація та безпека | JWT (access + refresh), Argon2 |
| Валідація | Zod |
| Тестування | Vitest, Supertest |
| Контейнеризація | Docker, Docker Compose |

## Frontend

SPA на **React + TypeScript** (збірка Vite), стилізація Tailwind CSS. Access-токен зберігається лише в пам'яті, refresh-токен — в `HttpOnly`-куці; при `401` Axios-інтерцептор автоматично оновлює сесію.

| Маршрут | Сторінка |
|---|---|
| `/` | Лендінг: опис системи та вибір входу (організатор / працівник) |
| `/auth` | Вхід і реєстрація організатора (авторизованого одразу переносить на `/dashboard`) |
| `/dashboard` | Панель організатора: події, генерація й видача QR-квитків, керування контролерами |
| `/auth/staff` | Вхід контролера за логіном і паролем від організатора |
| `/auth/staff/success` | Підтвердження входу контролера |
| `/:ticketId` | Сторінка квитка (за QR): ПІБ замасковано, повні дані бачить лише контролер цієї події; тут контролер підтверджує вхід |

## Як це працює

1. Організатор реєструється, створює подію та генерує потрібну кількість QR-квитків.
2. Квиток із статусом `created` видається відвідувачу (вказується ПІБ) і стає `issued`.
3. Організатор створює для події облікові записи контролерів.
4. Контролер входить, сканує QR на вході й підтверджує вхід: квиток стає `activated` і повторно не приймається (`409`).
5. Контролер може працювати лише з квитками **своєї** події, організатор — лише зі своїми подіями.

Статуси квитка: `created` → `issued` → `activated`.

## Структура проєкту

```text
qrcode_pass_system/
├── client/              # Frontend (React + Vite + Tailwind)
├── prisma/              # Prisma schema та міграції
├── src/
│   ├── lib/             # Prisma-клієнт, auth-middleware
│   ├── routers/         # auth, event, change_status
│   └── server.ts        # Точка входу Express
├── tests/               # Vitest + Supertest
├── prisma.config.ts     # Конфігурація Prisma CLI
├── Dockerfile           # Образ backend
├── docker-compose.yml   # PostgreSQL
├── .env.example         # Шаблон змінних середовища
└── package.json
```

## Вимоги

- [Node.js](https://nodejs.org/) 22+
- npm
- [Docker](https://www.docker.com/) із Docker Compose (для PostgreSQL)

## Локальний запуск

### 1. Клонування та встановлення залежностей

```bash
git clone https://github.com/ORKOFIL/qrcode_pass_system.git
cd qrcode_pass_system
npm install
cd client && npm install && cd ..
```

### 2. Змінні середовища

```bash
cp .env.example .env
```

Відкрий `.env` і заміни секрети `JWT_ACCESS_SECRET` та `JWT_REFRESH_SECRET` на випадкові значення:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`DATABASE_URL` у шаблоні вже збігається з `docker-compose.yml`.

### 3. База даних

```bash
docker compose up -d        # запустити PostgreSQL (порт 5433)
npm run db:generate         # згенерувати Prisma Client у ./generated/prisma
npm run db:deploy           # застосувати міграції (створити таблиці)
```

Під час розробки зміни схеми створюють міграції командою `npm run db:migrate`.

### 4. Запуск

```bash
npm run dev                 # backend на http://localhost:3000
```

В іншому терміналі:

```bash
cd client
npm run dev                 # frontend на http://localhost:5173
```

## Docker-образ backend

```bash
docker build -t entrypass-api .
docker run --rm -p 3000:3000 --env-file .env entrypass-api
```

Усередині Docker-мережі `DATABASE_URL` має вказувати на хост бази (не `127.0.0.1`). Папку `qrcodes` варто змонтувати як volume, інакше згенеровані зображення зникнуть разом із контейнером.

## API

Базовий URL: `http://localhost:3000`. Усі тіла запитів і відповідей — JSON. Захищені маршрути потребують заголовка `Authorization: Bearer <accessToken>`; refresh-токен передається в `HttpOnly`-куці `refreshToken`.

### Автентифікація (`/auth`)

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| POST | `/auth/register` | публічний | Реєстрація організатора (`email`, `password`, `name`). `201` + `accessToken` |
| POST | `/auth/login` | публічний | Вхід організатора (`email`, `password`). `200` + `accessToken` |
| POST | `/auth/staff` | публічний | Вхід контролера (`login`, `password`) |
| POST | `/auth/refresh` | кука `refreshToken` | Оновлення пари токенів (ротація refresh-токена) |
| POST | `/auth/logout` | кука `refreshToken` | Відкликання сесії та очищення куки |

### Публічні

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/ticket/:ticketId` | Дані квитка. Для всіх, крім контролера цієї події, ПІБ замасковано (`І*** П*******`) |

### Події (`/event`) — організатор

| Метод | Шлях | Опис |
|---|---|---|
| POST | `/event/create` | Створити подію (`newEventTitle`, `newEventDate`, `newEventLocation`, `initialCount`) |
| POST | `/event/create/qrcodes` | Згенерувати квитки та QR-зображення (`id`, `capacity`, `addon`) |
| POST | `/event/delete/:id` | Видалити подію разом із QR-зображеннями |
| POST | `/event/:eventId/scanners/create` | Створити контролерів (`count`); паролі повертаються один раз |
| POST | `/event/scanner/delete/:scannerId` | Видалити контролера |
| GET | `/load/events` | Події організатора з квитками та контролерами |

### Статуси квитків (`/change/status`) — організатор

| Метод | Шлях | Опис |
|---|---|---|
| POST | `/change/status/issued/:id` | Видати квиток (`fullname`): `created` → `issued` |
| POST | `/change/status/:status/:id` | Встановити `activated` або `created`; інший статус → `400` |

### Контролер

| Метод | Шлях | Опис |
|---|---|---|
| POST | `/ticket/:ticketId/activate` | Підтвердити вхід. `200` — успіх, `409` — вже використаний, `403` — квиток іншої події |

### Коди відповідей

`400` — невалідні дані · `401` — немає або недійсний токен · `403` — немає прав на ресурс · `409` — квиток уже використано · `500` — внутрішня помилка.

## Тестування

```bash
npm test          # watch-режим
npm run test:run  # одноразовий запуск
```

Тести покривають автентифікацію, події, видачу квитків, контролерів і підтвердження входу (зокрема одночасні запити на один квиток та розмежування доступу між організаторами). База даних у тестах замокана.

## Безпека

Під час розробки проєкту увагу приділено:

- хешуванню паролів;
- автентифікації користувачів;
- валідації вхідних даних;
- розмежуванню доступу;
- перевірці стану квитків перед підтвердженням входу.

## Автор

GitHub: [ORKOFIL](https://github.com/ORKOFIL)

Репозиторій: [qrcode_pass_system](https://github.com/ORKOFIL/qrcode_pass_system)
