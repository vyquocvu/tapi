# Run Environment Selector

This document describes how to use the run environment selector script to choose between different deployment environments for vStack.

## Overview

The vStack application supports three different runtime environments:

1. **Development (Vite)** - For local development with hot reload
2. **Node.js (Express)** - For traditional server hosting (VPS, Docker, etc.)
3. **Vercel (Serverless)** - For serverless deployment with auto-scaling

## Usage

### Quick Start

```bash
# Show usage information
npm run choose

# Run on Node.js server
npm run choose nodejs

# Deploy to Vercel
npm run choose vercel

# Start development server
npm run choose dev
```

## Environment Details

### 1. Node.js Environment

**Best for:** Traditional hosting, VPS, Docker containers, self-hosted deployments

```bash
npm run choose nodejs
```

**What it does:**
- Automatically builds the application if not already built
- Starts an Express.js server on port 3000 (or PORT environment variable)
- Serves the built frontend from the `dist/` directory
- Handles API requests through Express routes
- Uses the database configured in your `.env` file

**Requirements:**
- Built application (`npm run build` - automatically handled)
- Environment variables set in `.env` file
- Port 3000 available (or specify custom PORT)

**Advantages:**
- Full control over the server
- Works with any database (SQLite, PostgreSQL, MySQL, etc.)
- Can run on any Node.js hosting provider
- Easy to containerize with Docker
- No vendor lock-in

**Alternative Direct Command:**
```bash
npm run start:node
```

### 2. Vercel Environment

**Best for:** Serverless deployment, automatic scaling, zero-configuration hosting

```bash
npm run choose vercel
```

**What it does:**
- Deploys your application to Vercel's serverless platform
- Creates serverless functions from the `/api` directory
- Serves frontend as static files
- Auto-scales based on traffic
- Provides deployment URL

**Requirements:**
- Vercel CLI installed: `npm install -g vercel`
- Vercel account (free tier available)
- PostgreSQL database (not SQLite - Vercel doesn't support file databases)
- Environment variables configured in Vercel dashboard

**Setup Steps:**

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Configure environment variables in Vercel dashboard:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random secret (32+ characters)
   - `NODE_ENV` - `production`

3. Deploy:
   ```bash
   npm run choose vercel
   ```

4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

**Advantages:**
- Zero-configuration deployment
- Automatic scaling
- Built-in CDN
- Free tier available
- Automatic HTTPS

**Alternative Direct Command:**
```bash
npm run start:vercel
```

### 3. Development Environment

**Best for:** Local development, testing, debugging

```bash
npm run choose dev
```

**What it does:**
- Starts Vite development server with hot module reload
- Uses API middleware for backend routes
- Runs on http://localhost:5173
- SQLite database for local development

**Advantages:**
- Instant hot reload
- Fast development feedback
- Built-in debugging tools
- No build step required

**Alternative Direct Command:**
```bash
npm run dev
```

## Environment Comparison

| Feature | Development | Node.js | Vercel |
|---------|-------------|---------|--------|
| **Server Type** | Vite Dev Server | Express.js | Serverless Functions |
| **Database** | SQLite | Any (SQLite, PostgreSQL, etc.) | PostgreSQL (recommended) |
| **Hot Reload** | ✅ Yes | ❌ No | ❌ No |
| **Auto-scaling** | ❌ No | ❌ No | ✅ Yes |
| **Build Required** | ❌ No | ✅ Yes | ✅ Yes |
| **Port** | 5173 | 3000 (configurable) | N/A (provided by Vercel) |
| **Best For** | Development | Self-hosted, VPS | Serverless, auto-scaling |

## Advanced Usage

### Custom Port for Node.js

```bash
PORT=8080 npm run choose nodejs
```

### Deploy to Vercel Production

```bash
npm run choose vercel -- --prod
```

### Deploy to Vercel Preview

```bash
npm run choose vercel
```

## Troubleshooting

### Node.js Environment

**Problem:** Port 3000 is already in use

**Solution:** Use a different port
```bash
PORT=8080 npm run choose nodejs
```

**Problem:** Database not configured

**Solution:** Set `DATABASE_URL` in `.env` file
```bash
DATABASE_URL="file:./dev.db"
```

### Vercel Environment

**Problem:** Deployment fails

**Solution:** Make sure Vercel CLI is installed
```bash
npm install -g vercel
```

**Problem:** Database errors after deployment

**Solution:** Run migrations on production database
```bash
npx prisma migrate deploy
```

**Problem:** API routes return 404

**Solution:** Ensure `/api` directory exists and contains `.ts` files

### Development Environment

**Problem:** API endpoints not working

**Solution:** Check if Vite server is running on port 5173

## Migration Between Environments

### From Development to Node.js

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables in `.env`

3. Start Node.js server:
   ```bash
   npm run choose nodejs
   ```

### From Development to Vercel

1. Switch database to PostgreSQL in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Set environment variables in Vercel dashboard

3. Deploy:
   ```bash
   npm run choose vercel -- --prod
   ```

4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### From Node.js to Vercel

1. Update database to PostgreSQL (Vercel requirement)

2. Set environment variables in Vercel dashboard

3. Deploy:
   ```bash
   npm run choose vercel
   ```

## Additional Resources

- **Vercel Deployment Guide**: See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Vercel Quick Start**: See [VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)
- **Architecture Overview**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Main README**: See [README.md](./README.md)
