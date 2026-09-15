# BizzProfile

Full-stack business discovery and profile management platform with three portals — Admin, Customer, and End User.

## Features

- **Public Landing Page** — Hero carousel, business categories, featured businesses, blogs, contact form
- **Admin Dashboard** — User management, profile verification, categories, featured businesses, stats
- **Customer Dashboard** — Create/edit business profiles, document upload, search, nearby businesses
- **End User Portal** — Browse businesses, favorites, share profiles, category discovery
- **Authentication** — JWT-based auth with role-based access (Admin, Customer, End User)
- **Profile Verification** — Admin review and approval workflow for business profiles
- **Search & Discovery** — Full-text search, category filtering, nearby businesses
- **Responsive Design** — Mobile-first UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.x, Pydantic |
| Database | PostgreSQL 15+ |
| Migrations | Alembic |
| Auth | JWT (PyJWT), bcrypt |

## Project Structure

```
BizzProfile/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings (env vars)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/              # ORM models (User, Profile, Category, Document)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic
│   │   ├── repositories/        # Database queries
│   │   ├── dependencies/        # Auth deps (get_current_user, require_role)
│   │   └── utils/               # Helpers (JWT, password hashing)
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # API tests
│   ├── uploads/                 # Uploaded files (local storage)
│   ├── requirements.txt
│   ├── alembic.ini
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── PublicView.jsx   # Public landing page
│   │   │   ├── EndUserView.jsx  # End user portal
│   │   │   ├── CustomerDashboard.jsx  # Customer dashboard
│   │   │   ├── AdminDashboard.jsx     # Admin dashboard
│   │   │   ├── Header.jsx             # Public site header
│   │   │   ├── sharedSections.jsx     # Shared page sections
│   │   │   └── sharedViewData.js      # Shared data constants
│   │   ├── api.js               # API client functions
│   │   ├── App.jsx              # Router + layout
│   │   └── main.jsx             # React entry point
│   ├── package.json
│   └── vite.config.js
├── start.bat                    # Start both servers (Windows)
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # configure DATABASE_URL, SECRET_KEY
alembic upgrade head           # run migrations
python seed_admin.py           # create admin user
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

### Quick Start (Windows)

Double-click `start.bat` to launch both servers simultaneously.

## Environment Variables

Backend `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/bizzprofile
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=http://localhost:5173
```

## Default Admin

- **Email:** admin@bizzprofiles.com
- **Password:** Admin1234!

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/me` | Update profile |
| POST | `/api/auth/me/profile-pic` | Upload profile picture |
| DELETE | `/api/auth/me/profile-pic` | Remove profile picture |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/search` | Search profiles |
| GET | `/api/categories` | List categories |
| GET | `/api/profiles/{slug}` | Public profile by slug |
| GET | `/api/admin/users` | List all users (admin) |
| GET | `/api/admin/profiles` | List all profiles (admin) |
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| POST | `/api/customer/profiles` | Create business profile |
| PUT | `/api/customer/profiles/{id}` | Update business profile |

## License

Private
