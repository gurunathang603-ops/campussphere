# CampusSphere — AI Powered College & Department Management Portal

A full-stack college/department management web app:

- **Frontend:** React 19 + Vite, Tailwind CSS, Framer Motion, Lucide React icons, React Router, Recharts
- **Backend:** Python, Django, Django REST Framework, Token authentication
- **Database:** SQLite for development (switchable to PostgreSQL/MySQL — see `backend/.env`)
- **AI Assistant:** Rule + database powered chatbot and natural-language search, with an optional pluggable LLM layer (Anthropic/OpenAI) for more natural phrasing once you add an API key

Everything is a real working application: authentication, role-based dashboards, file uploads, dynamic event pages, a chatbot backed by a live API, and demo data you can log in and explore immediately.

---

## 1. Project structure

```
campussphere/
├── frontend/            React + Vite app
│   └── src/
│       ├── components/  Navbar, Footer, AI widget, ManageResource (generic CRUD), ...
│       ├── pages/       Public pages + dashboard pages
│       ├── layouts/     MainLayout, DashboardLayout
│       ├── context/     AuthContext, SiteContext
│       └── services/    Axios API client
│
├── backend/              Django project
│   ├── manage.py
│   ├── config/           settings, urls, shared validators
│   ├── accounts/         custom User, Student, Staff, HOD, auth & role permissions
│   ├── departments/      CollegeSettings, Department, Achievement, Gallery, stats
│   ├── events/           Event, EventGallery (dynamic event-type theming data)
│   ├── academics/        Faculty, Timetable, Syllabus
│   ├── documents/        Document (categorised, visibility-controlled uploads)
│   ├── announcements/    Announcement, Notification (+ auto-notification signals)
│   ├── chatbot/          ChatHistory, rule+DB chatbot, natural-language search, optional LLM layer
│   └── media/            uploaded files (created at runtime)
│
└── README.md (this file)
```

---

## 2. Requirements

- **Python** 3.11+ (3.12 recommended)
- **Node.js** 18+ and npm
- **VS Code** (recommended extensions: Python, ESLint, Tailwind CSS IntelliSense)
- Windows PowerShell (commands below are PowerShell-ready)

---

## 3. Backend setup (Django)

Open a terminal in VS Code (**Terminal → New Terminal**) and run:

```powershell
cd campussphere\backend

# 1. Create a virtual environment
python -m venv venv

# 2. Activate it
.\venv\Scripts\Activate.ps1
# If PowerShell blocks the script, run this once first:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment variables
copy .env.example .env
# Open .env in VS Code and set a real SECRET_KEY. SQLite is the default DB — no changes needed.

# 5. Run database migrations
python manage.py migrate

# 6. Create demo data (college, department, HOD, 5 staff, 20 students, events, etc.)
python manage.py seed_demo

# 7. (Optional) create your own superuser instead of / in addition to the demo HOD
python manage.py createsuperuser

# Start the combined app after installing the frontend dependencies below.
```

The combined frontend and API will run at **http://127.0.0.1:8000/**. Django admin: **http://127.0.0.1:8000/admin/**. The `run.ps1` launcher starts the minute-based notification worker alongside Django; stop both by stopping the launcher.

### Event reminders and delivery channels

Event reminders are stored in the database and are not dependent on a user being logged in. Staff/HOD event forms can choose 7-day, 3-day, 1-day, and 1-hour reminders, delivery channels, and an audience. Editing an event reschedules its pending reminders; marking it cancelled sends a cancellation notice. Delivery rows are unique per notification, user, and channel. Users can manage email, push, and SMS preferences at **Notifications → Preferences**. SMS is off unless users separately enable it and give consent.

For deployments that do not use `run.ps1`, keep this worker running under a process supervisor (or schedule `python manage.py send_notifications` once per minute):

```powershell
cd backend
.\venv\Scripts\python.exe manage.py run_notification_scheduler
```

Configure delivery secrets only in `backend/.env`:

```dotenv
FRONTEND_ORIGIN=https://portal.example.edu
DEFAULT_FROM_EMAIL=CampusSphere <noreply@example.edu>
EMAIL_HOST=smtp.example.edu
EMAIL_PORT=587
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
EMAIL_USE_TLS=True
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
TWILIO_STATUS_CALLBACK_URL=https://portal.example.edu/api/notifications/providers/twilio/status/
WEBPUSH_PUBLIC_KEY=...
WEBPUSH_PRIVATE_KEY=...
WEBPUSH_CONTACT=mailto:admin@example.edu
```

Use a trusted SMTP relay and a VAPID key pair for Web Push (keep the private key secret). SMS is enabled by default for new event schedules, but is sent only to recipients who have a valid E.164 mobile number, enabled SMS notifications, and explicitly consented. Twilio's India guidance lists both international and domestic routes. Its live India pricing page currently lists **$0.0832 USD per outbound SMS** for international numbers; rates and carrier charges can change. The international route does not require DLT registration according to Twilio, while its domestic route requires company and sender-ID registration in the operator DLT portal and registration with Twilio. Confirm the current [India SMS guidelines](https://www.twilio.com/en-us/guidelines/in/sms) and [India pricing](https://www.twilio.com/en-us/sms/pricing/in) before purchase; review TRAI/DLT rules for your intended use. Numbers use E.164 format such as `+91...`. Set `TWILIO_STATUS_CALLBACK_URL` to the exact public HTTPS callback URL above to receive provider delivery receipts. An API-accepted SMS is shown as **Sent**, never **Delivered**; the status changes to **Delivered** only after a signed Twilio callback confirms delivery. Email status means accepted by the configured SMTP server; delivery confirmation requires a provider that offers and is configured for delivery webhooks. Failed channel deliveries are recorded and retried up to three times. Missing provider configuration is shown as a failed delivery rather than silently treated as sent.

Events already in the database retain their existing channel selections; edit an existing event and enable SMS if you want to add it to that event's reminders.

Staff and HODs can use **Notifications → Test email or SMS delivery** to send a test to their own registered contact. The SMS test requires the administrator to have opted in and enabled SMS. **Preview recipients** displays counts before an immediate announcement is queued.

The PWA manifest and service worker enable Web Push on supported browsers when served over HTTPS (localhost is allowed for development). Users must grant browser permission. Notification background delivery, installability, and vibration are controlled by the browser, device, operating system, and user settings; vibration is attempted on supported devices only when permitted.

### Switching the database later (PostgreSQL / MySQL)

Edit `backend/.env`:
```
DB_ENGINE=postgres   # or mysql
DB_NAME=campussphere
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=127.0.0.1
DB_PORT=5432
```
Install the matching driver (`pip install psycopg2-binary` for Postgres, `pip install mysqlclient` for MySQL), then re-run `python manage.py migrate`.

### Enabling the optional AI (LLM) layer

The chatbot and AI search already work fully from the database with **no API key**. To let an LLM rephrase answers more naturally, edit `backend/.env`:
```
AI_PROVIDER=anthropic      # or openai
AI_API_KEY=your-api-key
AI_MODEL=claude-haiku-4-5-20251001   # optional, sensible default is used if blank
```
Restart the backend. If the key is missing/invalid, the chatbot automatically falls back to the built-in rule + database engine — nothing breaks.

---

## 4. Combined frontend and backend

From the `backend/` directory used above, install frontend dependencies and start the single-server app:

```powershell
cd ..\frontend
npm install
cd ..
& (Join-Path $PWD "run.ps1")
```

The launcher builds the React frontend and starts Django, which serves the website and API from the same origin. Open **http://127.0.0.1:8000/**. If port 8000 is already in use, run `& (Join-Path $PWD "run.ps1") -Port 8001` instead.

To run Vite separately with hot reload during frontend development, use a second terminal:

```powershell
cd frontend

npm run dev
```

Open **http://localhost:5173/** for the Vite development server.

### Building for production

```powershell
cd frontend
npm run build
cd ..\backend
python manage.py collectstatic --noinput
```
The production web server can use WhiteNoise for collected assets; configure `DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS`, and the database in `backend/.env` before deployment.

### Deploying to Render

The repository-root `render.yaml` configures a single Render web service for the Django API and built React frontend, plus a PostgreSQL database. To deploy:

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint**, connect the GitHub repository, and select `render.yaml`.
3. Review the services and create them. Render builds the frontend, collects static files, applies database migrations at startup, and generates a Django `SECRET_KEY`.
4. Once deployed, open the service's **Shell** and run `cd backend && python manage.py createsuperuser` to create your production administrator.

Do not run `seed_demo` on a public production deployment: it creates accounts with shared demo passwords. The free Render web service and database are intended for testing; confirm current plan limits before using them for real data. Uploaded files are stored in `backend/media`, which is not persistent on the free web service. Configure persistent or external media storage before relying on user uploads.

---

## 5. Demo credentials

Created by `python manage.py seed_demo` as temporary first-login passwords:

| Role    | Username / ID              | Password        |
|---------|-----------------------------|-----------------|
| HOD     | `staff1`                     | `Staff@12345`   |
| Staff   | `staff2` … `staff4`          | `Staff@12345`   |
| Student | `BU241901` … `BU241950`        | `Student@12345` |

Passwords are hashed with Django's PBKDF2-SHA256 hasher — never stored in plain text. To rebuild demo data from scratch: `python manage.py seed_demo --reset`.

All accounts must replace the shared starter password on first sign-in. Each person chooses a private password that meets Django's password rules. Password changes rotate the API token, signing out other sessions for that account.

---

## 6. Testing the key features

**Login** — go to `/login`, pick a role tab (Student / Staff / HOD), sign in with the credentials above. You're redirected to the matching dashboard.

**Chatbot** — click the floating button (bottom-right) on any page and ask: *"Who is the HOD?"*, *"Show today's timetable"*, *"When is the next event?"*, *"Tell me about Sports Day"*. Answers are generated live from the database (see `backend/chatbot/services.py`).

**AI search** — click the search icon in the navbar and try *"3rd semester syllabus"* or *"latest conference"*.

**File uploads** — log in as `hod` or `staff1` → dashboard sidebar → *Events* / *Documents* / *Gallery* → *Add new* → attach an image or PDF → *Save*. The file appears immediately on the public site (served from `backend/media/`).

**Dynamic event themes** — open `/events`, then click a Pongal, Sports Day, Hackathon and Conference event in turn — each renders with its own colour palette, icon and layout, generated by the same `EventDetail` component (see `frontend/src/eventThemes.js`).

**Role restrictions** — students cannot open `/dashboard/staff` or `/dashboard/hod` (redirected home). Staff cannot edit college branding or manage students/staff (403 from the API) unless a HOD grants `hod_privileges` to that staff member from the HOD → Staff screen.

---

## 7. Security notes

- Passwords hashed via Django's PBKDF2 hasher (`accounts` app, default Django auth).
- Token authentication (DRF) — no session/CSRF friction for the SPA; CSRF protection remains active for the Django admin.
- Role-based permissions enforced **server-side** in `accounts/permissions.py` (`IsStaffLevel`, `IsHODLevel`, `ContentPermission`) — the frontend hiding a button is a convenience, not the security boundary.
- Restricted documents are streamed through a permission-checked `/api/documents/<id>/download/` endpoint rather than exposing raw media URLs.
- Uploads are validated for file type and size (`config/validators.py`).

---

## 8. Troubleshooting

- **PowerShell won't run `Activate.ps1`** → run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, then retry.
- **CORS errors in the browser console** → confirm the backend is running on port 8000 and `backend/.env` → `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173`.
- **"no such table" errors** → run `python manage.py migrate` again inside `backend/` with the venv active.
- **Port already in use** → `python manage.py runserver 8001` (and update `VITE_API_URL` in `frontend/.env.development` to match).
