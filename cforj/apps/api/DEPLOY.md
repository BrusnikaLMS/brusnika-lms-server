# API Deploy Guide

## Requirements
- Python 3.12+
- PostgreSQL 15+

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create .env (copy from .env.example)
cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, DEEPSEEK_API_KEY

# 3. Create DB
psql -U postgres -c "CREATE DATABASE course_studio;"

# 4. Run migrations
alembic upgrade head

# 5. Start
uvicorn app.main:app --host 0.0.0.0 --port 8000
# or: bash start.sh
```

## .env variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/course_studio` |
| `SECRET_KEY` | Random 32+ char string for JWT signing |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `DEEPSEEK_MODEL` | `deepseek-chat` |
| `CORS_ORIGINS` | JSON array of allowed origins |

## API Docs

After starting: `http://localhost:8000/api/docs`

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/courses | JWT | List courses |
| POST | /api/courses | JWT | Create course |
| GET | /api/courses/{id} | JWT | Get course |
| PATCH | /api/courses/{id} | JWT | Update course |
| DELETE | /api/courses/{id} | JWT | Delete course |
| GET | /api/courses/public/{id} | — | Public embed |
| POST | /api/analytics/completions | — | Record completion |
| GET | /api/analytics/courses/{id} | JWT | Course analytics |
| POST | /api/ai/generate-course | — | Generate full course (streaming) |
| POST | /api/ai/generate-quiz | — | Generate quiz questions |
| POST | /api/ai/generate-scenario | — | Generate branching scenario |
| POST | /api/ai/generate-flashcards | — | Generate flashcard deck |
| GET | /api/health | — | Health check |
