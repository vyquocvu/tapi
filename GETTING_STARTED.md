# Getting Started with tapi

This guide will help you set up and run the tapi CMS on your local machine.

## Prerequisites

- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - For cloning the repository

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/vyquocvu/tapi.git
cd tapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"
DATABASE_PROVIDER=sqlite

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Configuration
PORT=5173
NODE_ENV=development
RUNTIME=dev

# Storage Configuration (for Media Manager)
STORAGE_PROVIDER=local
LOCAL_UPLOAD_DIR=./uploads
LOCAL_BASE_URL=http://localhost:5173

# Optional: AWS S3 Configuration
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_S3_BUCKET=your-bucket-name

# Optional: Google Cloud Storage Configuration
# GCS_PROJECT_ID=your-project-id
# GCS_BUCKET=your-bucket-name
# GCS_KEY_FILE=/path/to/keyfile.json
```

### 4. Set Up the Database

Run the complete database setup (generates Prisma client, runs migrations, and seeds data):

```bash
npm run db:setup
```

Or run each step individually:

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run prisma:seed
```

## Running the Application

### Development Mode

Start the development server with hot module replacement:

```bash
npm run dev
```

The application will be available at **http://localhost:5173**

### Demo Credentials

Use these credentials to test authentication:

- **Email:** `demo@user.com`
- **Password:** `password`

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The `RUNTIME` environment variable in your `.env` file determines how the application runs:
- `dev` - Vite development server (default)
- `node` - Node.js Express server
- `vercel` - Vercel serverless functions

## Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm start` - Start application (uses RUNTIME from .env)
- `npm run typecheck` - Run TypeScript type checking

### Database Management
- `npm run db:setup` - Complete database setup (generate + migrate + seed)
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI at http://localhost:5555
- `npm run prisma:seed` - Seed the database with demo data

### Content Type Builder
- `npm run content-type:generate` - Generate Prisma schema from content type definitions
- `npm run content-type:watch` - Watch content types and auto-generate schemas
- `npm run content-type:test` - Test content type builder functionality

### Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Open Vitest UI
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI

### Deployment Scripts
- `npm run start:node` - Run on Node.js server (production)
- `npm run start:vercel` - Deploy to Vercel

## Testing the Application

### 1. Test Authentication Flow

1. Navigate to http://localhost:5173/login
2. Enter demo credentials: `demo@user.com` / `password`
3. Click "Login"
4. You should be redirected to the dashboard

### 2. Test Protected Routes

1. Open a new incognito/private browser window
2. Try to access http://localhost:5173/dashboard directly
3. You should be redirected to the login page
4. After logging in, you'll be redirected back to the dashboard

### 3. Test API Endpoints

Use curl or any HTTP client to test the API:

```bash
# Health check
curl http://localhost:5173/api/health

# Login and get JWT token
curl -X POST http://localhost:5173/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'

# Get posts (requires token from login response)
curl http://localhost:5173/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get current user info (protected)
curl http://localhost:5173/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Test Content Manager API

```bash
# Get all articles
curl http://localhost:5173/api/content?contentType=api::article.article \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create a new category
curl -X POST http://localhost:5173/api/content?contentType=api::category.category \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tech","slug":"tech","description":"Technology articles"}'
```

## Database Management

### Using Prisma Studio

Open a GUI to view and edit your database:

```bash
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555

### Creating Migrations

After modifying `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

### Resetting the Database

To completely reset your database:

```bash
npx prisma migrate reset
```

This will:
1. Drop the database
2. Recreate it
3. Run all migrations
4. Run the seed script

## Content Type Builder

The Content Type Builder allows you to define database models using JSON or TypeScript, similar to Strapi.

### Quick Start Example

1. Start the development server (includes auto-generation watcher):
   ```bash
   npm run dev
   ```

2. In another terminal, copy the blog example:
   ```bash
   cp content-types/examples/blog-example.json content-types/definitions.json
   ```

3. The Prisma schema is automatically generated! Apply it to your database:
   ```bash
   npm run prisma:migrate
   ```

### Manual Generation

If you're not running the dev server, generate schemas manually:

```bash
npm run content-type:generate
```

See [CONTENT_TYPE_BUILDER.md](./CONTENT_TYPE_BUILDER.md) for detailed documentation.

## Runtime Environments

The application supports multiple runtime environments:

- **Development** (`RUNTIME=dev`) - Vite dev server with hot reload and API middleware
- **Node.js Server** (`RUNTIME=node`) - Express server for traditional hosting
- **Vercel Serverless** (`RUNTIME=vercel`) - Serverless functions on Vercel

Configure your environment in `.env`:

```env
RUNTIME=dev
```

Then run:

```bash
npm start
```

For detailed information about runtime environments, see [RUN_ENVIRONMENTS.md](./RUN_ENVIRONMENTS.md).

## Next Steps

Now that you have the application running:

1. **Explore the Dashboard** - Log in and explore the demo content
2. **Try the Content Type Builder** - Create custom content types
3. **Read the API Documentation** - [API_REFERENCE.md](./API_REFERENCE.md)
4. **Learn about CMS Features** - [FEATURES.md](./FEATURES.md)
5. **Deploy to Production** - [DEPLOYMENT.md](./DEPLOYMENT.md)

## Troubleshooting

### Database Connection Errors

If you see database connection errors:

1. Ensure your `DATABASE_URL` is correct in `.env`
2. Run `npm run prisma:generate` to regenerate the Prisma client
3. Run `npm run prisma:migrate` to apply migrations

### Port Already in Use

If port 5173 is already in use:

1. Change the `PORT` in your `.env` file
2. Restart the development server

### Build Errors

If you encounter build errors:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run typecheck` to check for TypeScript errors

## Getting Help

- **Documentation:** [docs/README.md](./docs/README.md)
- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues:** Open an issue on GitHub

---

Ready to learn more? Check out the [FEATURES.md](./FEATURES.md) guide to explore what tapi can do!
