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
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a0cd6849-feab-4769-a40a-a837c8f9e14c" />

| Маршрут | Сторінка |
|---|---|
| `/auth` | Вхід і реєстрація організатора (авторизованого одразу переносить на `/dashboard`) |
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/726a8b38-aa84-41a1-8ec1-7158c64e9531" />

| Маршрут | Сторінка |
|---|---|
| `/dashboard` | Панель організатора: події, генерація й видача QR-квитків, керування контролерами |
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b9b608c8-4626-4989-95f2-dc50217621a4" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/bf74244f-c133-4795-8094-55be2defa3c8" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/6f9adfa0-0c62-44fb-bd4f-543a997af2cf" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8c63758e-4ace-44f8-97b8-aef9cda82239" />

| Маршрут | Сторінка |
|---|---|
| `/auth/staff` | Вхід контролера за логіном і паролем від організатора |
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f3c6e8d8-fd0f-4a10-bcb7-de9e81dfde89" />

| Маршрут | Сторінка |
|---|---|
| `/auth/staff/success` | Підтвердження входу контролера |
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/53619a36-b572-4755-a059-c66ba4adac4d" />

| Маршрут | Сторінка |
|---|---|
| `/:ticketId` | Сторінка квитка (за QR): ПІБ замасковано, повні дані бачить лише контролер цієї події; тут контролер підтверджує вхід |
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/3c1704c1-c71b-47a3-a159-870ccf1cc630" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/043f0003-2758-43d7-a1fe-8125308c5aa8" />

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
