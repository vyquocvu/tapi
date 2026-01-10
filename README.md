# tapi

A production-ready, serverless CMS platform built with the TanStack ecosystem, Prisma, and PostgreSQL. Delivers full-featured CMS capabilities like Strapi, but with a serverless-first architecture - no server infrastructure to manage.

**✨ True Serverless CMS!** Deploy to Vercel (serverless), AWS Lambda, or run on Node.js - your choice. No dedicated servers required.

## Quick Start

```bash
# Clone and install
git clone https://github.com/vyquocvu/tapi.git
cd tapi
npm install

# Set up environment
cp .env.example .env

# Set up database
npm run db:setup

# Start development server
npm run dev
```

Visit **http://localhost:5173** and log in with `demo@user.com` / `password`

📖 **[Complete Setup Guide](./GETTING_STARTED.md)**

## Features

### Core CMS Features
- 🔐 **JWT Authentication** - Secure, stateless token-based authentication
- 📝 **Content Type Builder** - Define database models with JSON (Strapi-inspired)
- 🔄 **Content Manager** - Dynamic CRUD API for all content types
- 📁 **Media Manager** - Multi-provider storage (Local, S3, GCS, Vercel Blob)
- 🚀 **REST API** - Production-grade API with validation and error handling
- 🔌 **Plugin System** - Extensible architecture with lifecycle hooks
- ☁️ **Serverless-First** - Deploy without managing servers

### Enterprise CMS Features
- **Content Metadata** - SEO and Open Graph metadata support
- **Content Revisions** - Full version history and audit trail
- **Content Tags** - Flexible tagging system for categorization
- **Content Relations** - Generic relationships between any content types
- **API Dashboard** - Management interface with analytics and documentation
- **Multi-Provider Storage** - Seamlessly switch between storage providers

### Tech Stack Highlights
- ⚡ **TanStack Router** - Type-safe, file-based routing
- 🔍 **TanStack Query** - Advanced data fetching and caching
- 🗄️ **Prisma + PostgreSQL** - Type-safe, production-grade database
- 🎨 **React 18 + TypeScript** - Modern UI with complete type safety
- ⚙️ **Vite** - Lightning-fast development and builds
- ☁️ **Multi-Runtime** - Serverless (Vercel) or Node.js, your choice

📖 **[Explore All Features](./FEATURES.md)**

## Documentation

### Getting Started
- **[Getting Started Guide](./GETTING_STARTED.md)** - Installation, setup, and basic usage
- **[Features Guide](./FEATURES.md)** - Detailed feature documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Deploy to Vercel, AWS, Azure, GCP, or VPS

### Core Documentation
- **[Architecture](./ARCHITECTURE.md)** - System architecture and design patterns
- **[API Reference](./API_REFERENCE.md)** - Complete REST API documentation
- **[Content Type Builder](./CONTENT_TYPE_BUILDER.md)** - Define and generate database schemas
- **[Content Manager](./CONTENT_MANAGER.md)** - Dynamic CRUD API documentation
- **[Media Manager](./MEDIA_MANAGER.md)** - Multi-provider file storage

### Advanced Topics
- **[Plugin System](./docs/PLUGIN_SYSTEM_ARCHITECTURE.md)** - Extensibility and plugins

📖 **[Complete Documentation Index](./docs/README.md)**


## Project Structure

```
/tapi
├── src/
│   ├── routes/              # File-based routing
│   ├── contexts/            # React contexts (Auth, etc.)
│   ├── services/            # Business logic layer
│   ├── server/              # Server utilities (JWT, context)
│   ├── middleware/          # API middleware (validation, auth)
│   ├── storage/             # Multi-provider storage system
│   ├── lib/                 # Shared utilities and types
│   └── plugins/             # Plugin system and examples
├── api/                     # Serverless API endpoints (Vercel)
├── prisma/                  # Database schema and migrations
├── docs/                    # Detailed documentation
├── content-types/           # Content type definitions
└── tests/                   # Test suites
```

See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed structure.

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start (uses RUNTIME from .env)
```

### Database
```bash
npm run db:setup         # Complete database setup
npm run prisma:studio    # Open database GUI
npm run prisma:migrate   # Run migrations
```

### Testing
```bash
npm test             # Run tests
npm run test:e2e     # Run E2E tests
```

📖 **[Complete Command Reference](./GETTING_STARTED.md#available-scripts)**

## Development

### Content Type Builder

Define database models with JSON - schemas auto-generate in dev mode:

```bash
# Copy example
cp content-types/examples/blog-example.json content-types/definitions.json

# Schema auto-generates! Apply to database:
npm run prisma:migrate
```

📖 **[Content Type Builder Guide](./CONTENT_TYPE_BUILDER.md)**

### API Usage

```bash
# Login
curl -X POST http://localhost:5173/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'

# Get content
curl http://localhost:5173/api/content?contentType=api::article.article \
  -H "Authorization: Bearer YOUR_TOKEN"
```

📖 **[API Reference](./API_REFERENCE.md)**

## Deployment

### Serverless Deployment (Recommended)

Deploy to serverless platforms with zero server management:

```bash
# Vercel (one-click deployment)
npm run start:vercel

# AWS Lambda, Azure Functions, GCP Cloud Functions
# See deployment guide for setup
```

### Traditional Hosting (Optional)

Run on Node.js when you need traditional hosting:

```bash
# Node.js server (AWS EC2, Azure, GCP, VPS, etc.)
npm run start:node
```

### Supported Platforms
- ☁️ **Vercel** - Serverless with edge functions (recommended)
- 🚀 **AWS Lambda** - Serverless compute
- 🌐 **Azure Functions** - Serverless on Azure
- 🔷 **Google Cloud Functions** - Serverless on GCP
- 📦 **Node.js Hosting** - EC2, App Service, Compute Engine, DigitalOcean, any VPS
- 🐳 **Docker** - Container deployment anywhere

📖 **[Complete Deployment Guide](./DEPLOYMENT.md)**

## Tech Stack

### Frontend
- **React 18** - Modern UI library with latest features
- **TypeScript** - Full type safety across the stack
- **TanStack Router** - Type-safe, file-based routing
- **TanStack Query** - Advanced data fetching, caching, and state management
- **Vite** - Lightning-fast builds and HMR

### Backend & CMS
- **Prisma ORM** - Type-safe database operations
- **PostgreSQL** - Production database (MySQL/SQLite also supported)
- **JWT Authentication** - Secure, stateless authentication
- **Multi-Runtime** - Serverless functions or Node.js Express
- **Multi-Provider Storage** - S3, GCS, Local, Vercel Blob

### Development & Testing
- **TypeScript** - Complete type safety and IntelliSense
- **Vitest** - Fast unit and integration testing
- **Playwright** - Reliable E2E testing
- **ESLint + Prettier** - Code quality and formatting

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- 📖 **[Documentation](./docs/README.md)** - Complete guides and references
- 🐛 **[Issues](https://github.com/vyquocvu/tapi/issues)** - Report bugs or request features
- 💬 **[Discussions](https://github.com/vyquocvu/tapi/discussions)** - Ask questions and share ideas

---

Built with ❤️ using the TanStack ecosystem
