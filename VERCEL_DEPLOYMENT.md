# Vercel Deployment Guide

This guide provides detailed instructions for deploying the vstack application to Vercel.

## Overview

The vstack application is a full-stack React application with:
- **Frontend**: React + TanStack Router (static site)
- **Backend**: Serverless API functions in `/api` directory
- **Database**: Prisma ORM with PostgreSQL (production)

## Architecture on Vercel

### Development vs Production

| Aspect | Development | Production (Vercel) |
|--------|-------------|---------------------|
| API | Vite middleware | Serverless functions in `/api` |
| Database | SQLite (file-based) | PostgreSQL (hosted) |
| Server | Single Vite dev server | Static frontend + serverless backend |

### Serverless Functions

Vercel automatically deploys files in the `/api` directory as serverless functions:

- **`/api/login.ts`** → `https://your-app.vercel.app/api/login`
- **`/api/posts.ts`** → `https://your-app.vercel.app/api/posts`
- **`/api/me.ts`** → `https://your-app.vercel.app/api/me`
- **`/api/health.ts`** → `https://your-app.vercel.app/api/health`

Each function is an isolated, auto-scaling serverless endpoint.

## Step-by-Step Deployment

### 1. Database Setup

You'll need a PostgreSQL database for production. Choose one of these providers:

#### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Copy the `DATABASE_URL` connection string

#### Option B: Neon (Free tier available)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string

#### Option C: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use "Connection pooling" for better performance)

### 2. Update Prisma Schema

Edit `prisma/schema.prisma` to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

### 3. Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

| Variable | Value | Example |
|----------|-------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Random 32+ character string | Generate with command below |
| `NODE_ENV` | `production` | `production` |

**Generate a secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Add these variables to all environments (Production, Preview, Development)

### 4. Deploy to Vercel

#### Via Git Integration (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects the configuration
5. Click "Deploy"

#### Via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Or deploy to production directly
vercel --prod
```

### 5. Run Database Migrations

After the first deployment, you need to set up the database schema:

**Option A: Using Vercel CLI**

```bash
# Pull environment variables from Vercel
vercel env pull .env.production

# Run migrations
npx prisma migrate deploy

# Seed the database (optional, for demo data)
npx prisma db seed
```

**Option B: Manually**

```bash
# Set the production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed (optional)
npx tsx prisma/seed.ts
```

### 6. Verify Deployment

Test your deployed application:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Login
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'

# Get posts (use token from login response)
curl https://your-app.vercel.app/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Issues and Solutions

### Issue 1: "404 Not Found" on API Routes

**Symptoms:**
- API calls return 404
- Frontend loads but cannot fetch data

**Solutions:**
1. Ensure the `/api` directory exists in your repository
2. Check that all API files have `.ts` extension (not `.js`)
3. Verify `vercel.json` is present and correctly configured
4. Redeploy after adding/modifying API files

### Issue 2: Database Connection Errors

**Symptoms:**
- Error: "Can't reach database server"
- Timeout errors on API calls

**Solutions:**
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check database allows connections from `0.0.0.0/0` (all IPs)
3. Ensure connection string format is correct:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
   ```
4. For Neon/Supabase, use connection pooling URL for better performance
5. Check if database service is running and accessible

### Issue 3: Prisma Client Not Generated

**Symptoms:**
- Error: "Cannot find module '@prisma/client'"
- Build succeeds but runtime fails

**Solutions:**
1. Ensure `prisma generate` runs during build (Vercel does this automatically)
2. Check build logs in Vercel dashboard
3. Verify `@prisma/client` is in `dependencies` (not `devDependencies`)
4. Add a `postinstall` script if needed:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```

### Issue 4: Environment Variables Not Working

**Symptoms:**
- JWT errors
- Database URL not found
- Features work locally but not in production

**Solutions:**
1. Ensure variables are set for **all environments** in Vercel
2. Redeploy after adding/changing environment variables
3. Check variable names match exactly (case-sensitive)
4. Use `vercel env pull` to download and verify variables locally

### Issue 5: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail with "CORS policy" message

**Solutions:**
- The API functions already include CORS headers
- If using a custom domain, update the `Access-Control-Allow-Origin` header in API functions
- For specific origins, modify the CORS headers in `/api/*.ts` files

### Issue 6: Cold Start Latency

**Symptoms:**
- First API request takes 2-5 seconds
- Subsequent requests are fast

**Solutions:**
- This is normal for serverless functions (cold start)
- Consider upgrading to Vercel Pro for better cold start performance
- Implement loading states in your UI
- Use React Query's caching to minimize API calls

### Issue 7: JWT Authentication Issues

**Symptoms:**
- Login succeeds but protected routes fail
- "Unauthorized" errors on valid requests

**Solutions:**
1. Ensure `JWT_SECRET` is the same across all environments
2. Check token is being sent in Authorization header: `Bearer <token>`
3. Verify token hasn't expired (default: 7 days)
4. Check browser's sessionStorage contains the token
5. Review API logs for JWT verification errors

## Monitoring and Debugging

### View Logs

**Real-time logs:**
```bash
vercel logs <deployment-url> --follow
```

**Function-specific logs:**
```bash
vercel logs <deployment-url> --filter=/api/login
```

### Build Logs

1. Go to Vercel dashboard
2. Select your deployment
3. Click "View Build Logs"

### Runtime Logs

Each API function includes detailed logging:

```typescript
console.log('[API /endpoint] Action description')  // Info
console.warn('[API /endpoint] Warning message')    // Warning
console.error('[API /endpoint] Error details')     // Error
```

View these in Vercel dashboard under "Functions" tab.

### Debug Mode

For local debugging of production build:

```bash
# Build production bundle
npm run build

# Preview locally
npm run preview

# This simulates production environment
```

## Performance Optimization

### 1. Database Connection Pooling

Use connection pooling for PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool configuration
  connectionLimit = 5
}
```

### 2. Prisma Client Optimization

Already configured in `src/db/prisma.ts` with singleton pattern to reuse connections.

### 3. API Response Caching

Consider adding caching headers for static data:

```typescript
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
```

### 4. Database Indexes

Ensure your Prisma schema has appropriate indexes:

```prisma
model Post {
  // ... fields ...
  
  @@index([createdAt])
  @@index([authorId])
}
```

## Security Best Practices

### 1. Strong JWT Secret

Never use the default secret in production:

```bash
# Generate a cryptographically secure secret
openssl rand -hex 32
```

### 2. Database Security

- Use strong passwords
- Enable SSL for database connections
- Limit database access to specific IP ranges if possible

### 3. Environment Variables

- Never commit `.env` files to git
- Use Vercel's environment variable encryption
- Rotate secrets regularly

### 4. Rate Limiting

Consider adding rate limiting to API endpoints for production use.

## Rollback and Recovery

### Rollback to Previous Deployment

```bash
# List deployments
vercel ls

# Promote a previous deployment
vercel promote <deployment-url>
```

Or use Vercel dashboard → Deployments → Click "Promote to Production"

### Database Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Support and Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Prisma Documentation**: [prisma.io/docs](https://www.prisma.io/docs)
- **TanStack Router**: [tanstack.com/router](https://tanstack.com/router)
- **Project Issues**: [GitHub Issues](https://github.com/vyquocvu/vstack/issues)

## Continuous Deployment

Once set up with Git integration:

1. Push changes to your repository
2. Vercel automatically builds and deploys
3. Preview deployments for pull requests
4. Automatic production deployment on main branch

**Branch Strategy:**

- `main` → Production deployment
- `develop` → Preview deployment  
- Pull requests → Temporary preview URLs

## Cost Considerations

### Vercel Free Tier Includes:

- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution
- Automatic HTTPS

### When to Upgrade:

- High traffic (>100GB/month)
- Need custom domains
- Require team collaboration
- Want faster cold starts
- Need increased function execution time

## Next Steps

After successful deployment:

1. Set up monitoring (Vercel Analytics, Sentry)
2. Configure custom domain
3. Enable preview deployments for PRs
4. Set up database backups
5. Implement rate limiting
6. Add E2E tests
7. Set up CI/CD pipeline

---

**Need help?** Open an issue on GitHub or check Vercel's support documentation.
