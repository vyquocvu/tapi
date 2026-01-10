# Deployment Guide

tapi is a **serverless-first CMS platform** designed to run without server management. This guide covers serverless deployment (recommended) and traditional hosting options.

## Table of Contents

- [Quick Start](#quick-start)
- [Serverless Deployment (Recommended)](#serverless-deployment-recommended)
- [Traditional Hosting (Optional)](#traditional-hosting-optional)
- [Runtime Configuration](#runtime-configuration)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Serverless Deployment (Recommended)

Deploy to serverless platforms with zero infrastructure management:

```bash
# Vercel (one command)
npm run start:vercel

# Or use Vercel CLI
vercel --prod
```

### Traditional Hosting (When Needed)

For traditional server environments:

```bash
# Node.js server (EC2, App Service, VPS, etc.)
npm run start:node
```

## Runtime Configuration

tapi supports multiple runtime environments. Choose based on your needs:

| Runtime | Best For | Configuration |
|---------|----------|---------------|
| **Serverless (Vercel)** | Production deployments, auto-scaling | `RUNTIME=vercel` (automatic on Vercel) |
| **Serverless (AWS/Azure/GCP)** | Enterprise cloud platforms | Deploy with serverless framework |
| **Node.js Server** | Traditional hosting, custom infrastructure | `RUNTIME=node` |
| **Development** | Local development with hot reload | `RUNTIME=dev` |

### Why Serverless-First?

- ✅ **Zero Infrastructure**: No servers to provision or maintain
- ✅ **Auto-Scaling**: Handles traffic spikes automatically
- ✅ **Cost-Effective**: Pay only for actual usage
- ✅ **Global Distribution**: Edge network for fast response times
- ✅ **Zero Downtime**: Built-in redundancy and failover

## Serverless Deployment (Recommended)

### Vercel (Easiest)

Vercel provides the simplest serverless deployment experience for tapi.

### Prerequisites

1. **Vercel Account** - Free tier available at [vercel.com](https://vercel.com)
2. **PostgreSQL Database** - Required for production (SQLite not recommended for serverless):
   - **[Neon](https://neon.tech)** - Serverless PostgreSQL (recommended)
   - **[Supabase](https://supabase.com)** - PostgreSQL with additional features
   - **[Vercel Postgres](https://vercel.com/storage/postgres)** - Integrated PostgreSQL
   - **[Railway](https://railway.app)** - Simple PostgreSQL hosting

### Step 1: Prepare Your Database

**Switch from SQLite to PostgreSQL** for production.

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 2: Set Environment Variables

In your Vercel project dashboard, configure these environment variables:

#### Required Variables

**DATABASE_URL**
```
postgresql://username:password@host:5432/database?schema=public
```

**JWT_SECRET**
Generate a secure secret (at least 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**NODE_ENV**
```
production
```

**DATABASE_PROVIDER**
```
postgresql
```

#### Optional Variables

**Storage Configuration** (if using Media Manager):
```env
# For local storage (not recommended for Vercel)
STORAGE_PROVIDER=local

# For AWS S3
STORAGE_PROVIDER=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# For Google Cloud Storage
STORAGE_PROVIDER=gcs
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_KEY_FILE=/path/to/keyfile.json
```

### Step 3: Deploy

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Or deploy to production directly
vercel --prod
```

#### Option B: Deploy via Git Integration

1. Push your code to GitHub, GitLab, or Bitbucket
2. Import your repository in [Vercel dashboard](https://vercel.com/new)
3. Configure environment variables
4. Vercel will automatically detect configuration and deploy

### Step 4: Run Database Migrations

After deployment, apply migrations to your production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Seed the database (optional)
npx prisma db seed
```

**Or using Vercel CLI:**

```bash
# Pull environment variables
vercel env pull .env.production

# Run migrations
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
```

### How Serverless Works on Vercel

Vercel automatically converts your API routes into serverless functions:

```
/api directory → Serverless Functions
├── login.ts → /api/login endpoint
├── content.ts → /api/content endpoint
├── content-types.ts → /api/content-types endpoint
├── media.ts → /api/media endpoint
└── me.ts → /api/me endpoint
```

**Frontend**: Served as static files with client-side routing via Vercel's global CDN

**Backend**: Serverless functions that auto-scale based on traffic

**Benefits**:
- Zero cold start optimization built-in
- Automatic HTTPS and CDN
- Built-in DDoS protection
- Edge network for global performance

### Vercel Configuration

The `vercel.json` file configures the deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Troubleshooting Vercel Deployment

#### API endpoints return 404

- Ensure the `/api` directory exists in your repository
- Check that serverless functions have `.ts` extension
- Verify `vercel.json` configuration is present
- Check Vercel function logs in dashboard

#### Database connection errors

- Verify `DATABASE_URL` environment variable is correct
- Ensure your database allows connections from Vercel's IP addresses
- Check that `prisma generate` ran successfully during build
- Run `npx prisma migrate deploy` to apply migrations
- Verify `DATABASE_PROVIDER` is set to `postgresql`

#### JWT authentication fails

- Verify `JWT_SECRET` environment variable is set
- Ensure the secret is the same across all deployments
- Check that the Authorization header is being sent correctly
- Verify the token format: `Bearer <token>`

#### Build failures

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally: `npm run typecheck`
- Check for missing environment variables during build

#### View Logs

```bash
# Real-time logs
vercel logs <deployment-url>

# Or view in Vercel dashboard
# Project > Deployments > [Your Deployment] > Logs
```

### AWS Lambda / Serverless Framework

Deploy tapi to AWS Lambda using the Serverless Framework:

1. Install Serverless Framework: `npm install -g serverless`
2. Create `serverless.yml` configuration
3. Deploy: `serverless deploy`

See [AWS Lambda deployment guide](https://www.serverless.com/framework/docs/) for details.

### Azure Functions

Deploy to Azure Functions for Microsoft Azure serverless:

1. Install Azure Functions Core Tools
2. Configure `host.json` for Azure
3. Deploy using Azure CLI or VS Code

### Google Cloud Functions

Deploy to GCP Cloud Functions:

1. Install Google Cloud SDK
2. Configure `cloudbuild.yaml`
3. Deploy: `gcloud functions deploy`

All Vercel deployment details are covered above.

## Traditional Hosting (Optional)

Use traditional Node.js hosting when you need full server control or specific infrastructure requirements.

### When to Use Traditional Hosting

Consider Node.js hosting when:
- You need full control over server configuration
- You have existing infrastructure investments
- You require specific server-side customizations
- Your deployment platform doesn't support serverless

### Supported Platforms

**Cloud Platforms:**
- **AWS EC2, ECS, Elastic Beanstalk** - Amazon Web Services
- **Azure App Service, Container Instances** - Microsoft Azure
- **Google Compute Engine, App Engine, Cloud Run** - Google Cloud Platform
- **DigitalOcean Droplets, App Platform** - Developer-friendly hosting
- **Heroku** - Simple PaaS hosting
- **Railway** - Modern platform-as-a-service

**Self-Hosted:**
- **Any VPS** - Ubuntu, Debian, CentOS, etc.
- **Docker** - Container deployment anywhere
- **Kubernetes** - Orchestrated container deployment

### Prerequisites

- Node.js 18+ installed on server
- Database (PostgreSQL, MySQL, or SQLite)
- Process manager (PM2, systemd, or supervisord)

### Deployment Steps

#### 1. Build the Application

On your local machine or CI/CD pipeline:

```bash
npm install
npm run build
```

This creates the `dist/` directory with production files.

#### 2. Transfer Files to Server

```bash
# Via SCP
scp -r dist/ package.json package-lock.json user@your-server:/path/to/app/

# Or via Git
git push production main
```

#### 3. Install Dependencies on Server

```bash
cd /path/to/app
npm install --production
```

#### 4. Set Environment Variables

Create `.env` file on server:

```env
# Runtime
RUNTIME=node
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tapi"
DATABASE_PROVIDER=postgresql

# Security
JWT_SECRET="your-secure-secret-key-here"

# Storage (optional)
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=/var/app/uploads
LOCAL_BASE_URL=https://your-domain.com
```

#### 5. Run Database Migrations

```bash
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

#### 6. Start the Server

**Option A: Using PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start npm --name "tapi" -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

**Option B: Using systemd**

Create `/etc/systemd/system/tapi.service`:

```ini
[Unit]
Description=tapi CMS
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/app
Environment="NODE_ENV=production"
Environment="RUNTIME=node"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable tapi
sudo systemctl start tapi
sudo systemctl status tapi
```

**Option C: Direct Start**

```bash
# Foreground
npm start

# Background with nohup
nohup npm start > app.log 2>&1 &
```

#### 7. Configure Reverse Proxy (Recommended)

Use Nginx or Apache to proxy requests to your Node.js server.

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/tapi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV RUNTIME=node

# Start the server
CMD ["npm", "start"]
```

Build and run:

```bash
# Build image
docker build -t tapi .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e JWT_SECRET="your-secret" \
  --name tapi \
  tapi
```

### Environment-Specific Configuration

#### Using Runtime Variable (Recommended)

Set `RUNTIME=node` in your `.env`:

```env
RUNTIME=node
```

Then start:

```bash
npm start
```

#### Using Convenience Script

```bash
npm run start:node
```

This automatically sets `RUNTIME=node`.

#### Manual Start

```bash
NODE_ENV=production tsx server/index.ts

# Or with custom port
PORT=8080 NODE_ENV=production tsx server/index.ts
```

### Node.js Server Features

- **Full-stack server** - Handles API routes and frontend
- **Express.js** - Production-ready framework
- **Flexible database** - SQLite, PostgreSQL, MySQL support
- **Custom port** - Configure via PORT environment variable
- **Static file serving** - Serves built frontend
- **SPA routing** - Client-side routing support

## Environment Variables

### Required for All Deployments

```env
# Database
DATABASE_URL="your-database-connection-string"
DATABASE_PROVIDER="postgresql"  # or sqlite, mysql

# Authentication
JWT_SECRET="secure-random-secret-at-least-32-characters"

# Environment
NODE_ENV="production"
```

### Optional Configuration

```env
# Server
PORT=3000

# Runtime (for npm start)
RUNTIME=node

# Storage Provider
STORAGE_PROVIDER=local  # or s3, gcs

# For local storage
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=https://your-domain.com

# For AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# For Google Cloud Storage
GCS_PROJECT_ID=your-project-id
GCS_BUCKET=your-bucket-name
GCS_KEY_FILE=/path/to/keyfile.json
```

### Security Best Practices

1. **Generate strong secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Never commit secrets** to version control

3. **Use environment variables** for all sensitive data

4. **Rotate secrets regularly** in production

5. **Use HTTPS** in production (Let's Encrypt, Cloudflare, etc.)

## Database Setup

### PostgreSQL (Recommended for Production)

1. **Create database:**
   ```sql
   CREATE DATABASE tapi;
   ```

2. **Set connection string:**
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/tapi?schema=public"
   ```

3. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### MySQL

1. **Create database:**
   ```sql
   CREATE DATABASE tapi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Set connection string:**
   ```env
   DATABASE_URL="mysql://user:password@host:3306/tapi"
   DATABASE_PROVIDER="mysql"
   ```

3. **Update Prisma schema:**
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

### SQLite (Development Only)

```env
DATABASE_URL="file:./prod.db"
DATABASE_PROVIDER="sqlite"
```

**Note:** SQLite is not recommended for production deployments with multiple instances.

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=8080 npm start
```

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database server is running
3. Ensure firewall allows connections
4. Verify credentials are correct
5. Check database exists

### Permission Errors

```bash
# Fix file permissions
sudo chown -R www-data:www-data /path/to/app

# Fix directory permissions
sudo chmod -R 755 /path/to/app
```

### Out of Memory

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### SSL/TLS Errors

For self-signed certificates:

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm start
```

**Note:** Never use this in production. Get proper SSL certificates.

## Monitoring & Logs

### PM2 Monitoring

```bash
# View logs
pm2 logs tapi

# Monitor resources
pm2 monit

# View process info
pm2 info tapi
```

### systemd Logs

```bash
# View logs
sudo journalctl -u tapi -f

# View recent errors
sudo journalctl -u tapi -p err
```

### Docker Logs

```bash
# View logs
docker logs tapi

# Follow logs
docker logs -f tapi
```

## Performance Optimization

### Enable Compression

The Node.js server includes compression by default. Verify in `server/index.ts`.

### Use CDN

Serve static assets through a CDN:
- Cloudflare
- AWS CloudFront
- Vercel Edge Network
- Fastly

### Database Connection Pooling

Prisma handles connection pooling automatically. Configure if needed:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  relationMode = "prisma"
}
```

### Caching

Consider adding caching layers:
- Redis for session storage
- CDN for static assets
- Database query caching

## Scaling

### Horizontal Scaling

Run multiple instances behind a load balancer:

```bash
# Start multiple instances with PM2
pm2 start npm --name "tapi" -i 4 -- start
```

### Load Balancing

Use Nginx, HAProxy, or cloud load balancers to distribute traffic.

### Database Scaling

- Use read replicas for read-heavy workloads
- Implement connection pooling
- Consider database clustering

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - name: Deploy to server
        run: |
          # Your deployment script here
```

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [FEATURES.md](./FEATURES.md) - Feature documentation

## Getting Help

- **Issues:** Open an issue on GitHub
- **Documentation:** [docs/README.md](./docs/README.md)
- **Community:** Join discussions on GitHub

---

Ready to deploy? Choose your platform and follow the steps above!
