# Database Setup & Vercel Deployment

This application uses PostgreSQL for data persistence.

## Local Development

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database connection
DB_CREDS=postgresql://user:password@host:port/database

# OpenAI API key
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm run dev:server
   ```

3. **Start the frontend (in a separate terminal):**
   ```bash
   npm run dev
   ```

4. **Or run both together:**
   ```bash
   npm run dev:all
   ```

---

## Vercel Deployment

### Step 1: Set Up Vercel Postgres (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or import from GitHub)
3. Go to **Storage** → **Create Database** → **Postgres**
4. Follow the prompts to create a database
5. Vercel will automatically set `POSTGRES_URL` environment variable

### Step 2: Add Environment Variables

In your Vercel project settings, add these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | Auto-set if using Vercel Postgres | Yes (or DB_CREDS) |
| `DB_CREDS` | PostgreSQL connection string (alternative) | Yes (or POSTGRES_URL) |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `INIT_SECRET` | Secret key to protect DB init endpoint | Optional |

### Step 3: Deploy

```bash
# Install Vercel CLI (if not already)
npm i -g vercel

# Deploy
vercel

# Or deploy to production
vercel --prod
```

### Step 4: Initialize the Database

After deployment, call the init endpoint to create tables:

```bash
# Replace YOUR_VERCEL_URL with your actual Vercel deployment URL
curl -X POST https://YOUR_VERCEL_URL/api/init-db

# If you set INIT_SECRET, include it:
curl -X POST https://YOUR_VERCEL_URL/api/init-db \
  -H "X-Init-Secret: your_secret_here"
```

This creates all necessary tables and a default admin:
- **Username:** `admin`
- **PIN:** `0000`

⚠️ **Change the default admin PIN immediately after deployment!**

---

## Database Schema

The application automatically creates these tables:

| Table | Description |
|-------|-------------|
| `admin_users` | Admin user accounts |
| `users` | Regular user accounts |
| `user_daily_calls` | Daily AI call tracking |
| `admin_sessions` | Admin session tokens |
| `user_sessions` | User session tokens |

---

## API Endpoints

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/verify` | Verify admin session |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/admins` | Get all admins |
| POST | `/api/admin/admins` | Create admin |
| PUT | `/api/admin/admins/:id` | Update admin |
| DELETE | `/api/admin/admins/:id` | Delete admin |

### User Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | User registration |
| POST | `/api/users/login` | User login |
| GET | `/api/users/verify` | Verify user session |
| POST | `/api/users/logout` | User logout |
| GET | `/api/users` | Get all users (admin only) |
| POST | `/api/users` | Create user (admin only) |
| PUT | `/api/users/:id` | Update user (admin only) |
| DELETE | `/api/users/:id` | Delete user (admin only) |
| GET | `/api/users/daily-calls` | Get daily AI call count |
| POST | `/api/users/record-call` | Record AI call |

### Utility Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/init-db` | Initialize database tables |

---

## Troubleshooting

### Database Connection Issues

1. Verify your connection string is correct
2. Check if SSL is required (`?sslmode=require`)
3. Ensure your IP is whitelisted (if using external DB)

### CORS Issues

The API includes CORS headers for all endpoints. If you still have issues:
- Check browser console for specific error messages
- Verify the API URL is correct

### Session Issues

Sessions expire after:
- Admin: 24 hours
- Users: 7 days

If users are being logged out unexpectedly, check:
- Database connection stability
- Session table exists
