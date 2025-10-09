# Vercel Deployment Quick Reference

## 🚀 Quick Deploy (3 Steps)

1. **Update Database** (in `prisma/schema.prisma`)
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from sqlite
     url      = env("DATABASE_URL")
   }
   ```

2. **Set Environment Variables** (in Vercel Dashboard)
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random 32+ character string
   - `NODE_ENV` - `production`

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

---

## 📋 Environment Variable Examples

```bash
# PostgreSQL (Neon, Supabase, Vercel Postgres)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# Generate secure JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Set environment
NODE_ENV="production"
```

---

## 🔍 Testing Deployment

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Login
curl -X POST https://your-app.vercel.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@user.com","password":"password"}'

# Get posts
curl https://your-app.vercel.app/api/posts

# Protected endpoint (add your token)
curl https://your-app.vercel.app/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| 404 on API routes | Ensure `/api` directory exists with `.ts` files |
| Database errors | Verify `DATABASE_URL` is set correctly |
| JWT errors | Check `JWT_SECRET` is set in all environments |
| Build fails | Run `npm run build` locally first |
| Prisma errors | Run `npx prisma generate && npx prisma migrate deploy` |

---

## 📊 Monitoring

```bash
# View logs
vercel logs <url> --follow

# View specific function logs
vercel logs <url> --filter=/api/login

# List deployments
vercel ls

# Rollback
vercel promote <previous-deployment-url>
```

---

## 📁 Project Structure

```
/vstack
├── api/              # ⭐ Vercel serverless functions
│   ├── login.ts
│   ├── posts.ts
│   ├── me.ts
│   └── health.ts
├── src/
│   ├── routes/       # React pages
│   ├── services/     # Business logic (shared with API)
│   └── server/       # Server utilities (JWT, context)
├── vercel.json       # ⭐ Vercel configuration
└── prisma/
    └── schema.prisma # Database schema
```

---

## 🔄 Development vs Production

| Feature | Development | Production (Vercel) |
|---------|-------------|---------------------|
| API | Vite middleware | Serverless functions in `/api` |
| Database | SQLite | PostgreSQL |
| Server | `npm run dev` | Static + Serverless |
| Hot Reload | ✅ Yes | ❌ No (redeploy) |

---

## 📚 Related Documentation

- Full Guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Main README: [README.md](./README.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Prisma Docs: [prisma.io/docs](https://www.prisma.io/docs)

---

## ⚡ Tips

- Use connection pooling for PostgreSQL (better performance)
- Set environment variables for **all** environments (Production, Preview, Development)
- Test locally with `npm run build && npm run preview` before deploying
- Enable Vercel Analytics for monitoring
- Use `vercel --prod` for production, omit `--prod` for preview deployments
- Cold starts are normal (~2-5 seconds for first request)
- Keep JWT_SECRET consistent across all deployments

---

**Need more help?** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed instructions.
