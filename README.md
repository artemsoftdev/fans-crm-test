# Fans CRM Test - Full-Stack Application

Монорепо для тестового завдання з повним стеком технологій.

## Структура проекту

- `backend/` - NestJS REST API з MongoDB/Mongoose
- `frontend/` - Electron додаток з React фронтендом (Tailwind CSS + Framer Motion)

## Вимоги

- Node.js v22+
- Docker та Docker Compose (для MongoDB) або локальна MongoDB

## Встановлення

```bash
# Встановити залежності для всього проекту
npm install

# Або окремо для кожного workspace
cd backend && npm install
cd ../frontend && npm install
```

## Налаштування

### MongoDB

**Варіант 1: Запуск через Docker (рекомендовано)**

```bash
# Запустити MongoDB в Docker
docker-compose up -d

# Перевірити, що MongoDB запущена
docker ps
```

**Варіант 2: Локальна MongoDB**

Переконайтеся, що MongoDB встановлена та запущена локально на порту 27017.

### Backend

1. Створіть файл `backend/.env` (або скопіюйте `backend/.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/fans-crm
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
```

2. Якщо MongoDB запущена в Docker, URI залишається `mongodb://localhost:27017/fans-crm`

### Frontend

Для автооновлення Electron, оновіть `frontend/electron-builder.yml` та `frontend/electron/main.ts` з вашими GitHub credentials.

## Запуск

### 1. Запустити MongoDB (якщо ще не запущена)

```bash
docker-compose up -d
```

### 2. Backend
```bash
npm run dev:backend
# або
cd backend && npm run dev
```

Backend запускається на `http://localhost:3000`

**Примітка:** Якщо бачите помилку підключення до MongoDB, переконайтеся, що:
- MongoDB запущена (`docker-compose up -d` або локальна MongoDB)
- Порт 27017 не зайнятий іншим процесом
- Файл `backend/.env` існує та містить правильний `MONGODB_URI`

### Frontend (Electron + React)
```bash
npm run dev:frontend
# або
cd frontend && npm run dev
```

### Заповнення бази даних

Якщо база даних порожня, запустіть seed скрипт для генерації 2 мільйонів користувачів:

```bash
cd backend && npm run seed
```

**Примітка:** Генерація 2 мільйонів записів може зайняти кілька хвилин.

## API Endpoints

### Авторизація

Спочатку отримайте JWT токен:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "password": "test"
  }'
```

Відповідь:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Збережіть токен у змінну для подальшого використання:**
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

Всі інші запити потребують JWT токен в заголовку:
```
Authorization: Bearer <token>
```

### Endpoints

- `POST /api/v1/add-user` - Додати користувача
  ```bash
  # Спочатку отримайте токен (див. вище)
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  
  # Потім використовуйте токен для додавання користувача
  curl -X POST http://localhost:3000/api/v1/add-user \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "name": "Іван Іваненко",
      "email": "ivan@example.com",
      "phone": "+380501234567",
      "birthdate": "1990-01-01"
    }'
  ```
  
  Або з токеном напряму:
  ```bash
  curl -X POST http://localhost:3000/api/v1/add-user \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
    -d '{
      "name": "Іван Іваненко",
      "email": "ivan@example.com",
      "phone": "+380501234567",
      "birthdate": "1990-01-01"
    }'
  ```
  
  Приклад відповіді:
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Іван Іваненко",
    "email": "ivan@example.com",
    "phone": "+380501234567",
    "birthdate": "1990-01-01T00:00:00.000Z",
    "createdAt": "2026-02-05T14:00:00.000Z",
    "updatedAt": "2026-02-05T14:00:00.000Z"
  }
  ```

- `GET /api/v1/get-users` - Отримати список користувачів з пагінацією та фільтрами
  ```bash
  # Спочатку отримайте токен
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  
  # Базовий запит
  curl -X GET "http://localhost:3000/api/v1/get-users?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN"
  
  # З фільтрами
  curl -X GET "http://localhost:3000/api/v1/get-users?page=1&limit=10&name=Іван&email=example" \
    -H "Authorization: Bearer $TOKEN"
  ```
  
  Параметри:
  - `page` - номер сторінки (за замовчуванням: 1)
  - `limit` - кількість записів на сторінку (за замовчуванням: 10)
  - `name` - фільтр за ім'ям (опціонально)
  - `email` - фільтр за email (опціонально)
  - `phone` - фільтр за телефоном (опціонально)
  
  Приклад відповіді:
  ```json
  {
    "data": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Іван Іваненко",
        "email": "ivan@example.com",
        "phone": "+380501234567",
        "birthdate": "1990-01-01T00:00:00.000Z"
      }
    ],
    "total": 2000000,
    "page": 1,
    "limit": 10,
    "totalPages": 200000
  }
  ```

- `GET /api/v1/get-user/:id` - Отримати користувача за ID
  ```bash
  # Спочатку отримайте токен
  TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  
  # Отримати користувача за ID
  curl -X GET http://localhost:3000/api/v1/get-user/507f1f77bcf86cd799439011 \
    -H "Authorization: Bearer $TOKEN"
  ```
  
  Приклад відповіді:
  ```json
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Іван Іваненко",
    "email": "ivan@example.com",
    "phone": "+380501234567",
    "birthdate": "1990-01-01T00:00:00.000Z",
    "createdAt": "2026-02-05T14:00:00.000Z",
    "updatedAt": "2026-02-05T14:00:00.000Z"
  }
  ```

## Особливості

### Backend
- ✅ NestJS з TypeScript
- ✅ MongoDB з Mongoose ORM
- ✅ JWT авторизація для всіх запитів
- ✅ Валідація даних з class-validator
- ✅ Пагінація та фільтрація для списку користувачів
- ✅ Seed скрипт для генерації 2 мільйонів випадкових користувачів
- ✅ Автоматична перевірка порожньої БД при старті

### Frontend
- ✅ Electron додаток з TypeScript
- ✅ React з React Router для навігації
- ✅ Tailwind CSS для стилізації
- ✅ Framer Motion для анімацій
- ✅ Дві сторінки: Головна та Користувачі
- ✅ Інтеграція з backend API
- ✅ Форма додавання користувачів
- ✅ Фільтрація та пагінація
- ✅ Auto-updater для Electron (потребує налаштування GitHub)

## Збірка для продакшну

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
npm run build:app  # Створить Electron додаток
```

## Технології

- **Backend:** NestJS, MongoDB, Mongoose, JWT, Passport
- **Frontend:** Electron, React, TypeScript, Tailwind CSS, Framer Motion, Axios
- **Tools:** Vite, ESLint, Prettier, TypeScript

## Ліцензія

MIT
