# vstack

A full-stack application built with **TanStack Router** and **TanStack Query**, demonstrating modern React development with type-safe routing and efficient data fetching.

## 🚀 Features

- **TanStack Router** - Type-safe file-based routing
- **TanStack Query** - Powerful data fetching and caching
- **Authentication** - Login system with real API endpoint
- **Express API Server** - Backend API with authentication
- **TypeScript** - Full type safety
- **Vite** - Lightning-fast development
- **React Router DevTools** - Debug routing in development
- **React Query DevTools** - Inspect queries and cache

## 📁 Folder Structure

```
/src
 ├── routes/
 │   ├── __root.tsx          # Root layout with navigation and QueryClient
 │   ├── index.tsx            # Home page with TanStack Query data fetching
 │   ├── about.tsx            # About page with comparison info
 │   └── login.tsx            # Login page with authentication
 ├── contexts/
 │   └── AuthContext.tsx      # Authentication context and state management
 ├── main.tsx                 # Client entry point
 └── app.css                  # Global styles
/server
 ├── api.js                   # Express API server with authentication
 ├── api-example.js           # Example API implementation
 └── README.md                # API documentation
```

### Key Files Explained

- **`__root.tsx`**: Root component with navigation, QueryClient provider, and devtools. Wraps all routes.
- **`index.tsx`**: Home page demonstrating:
  - Client-side data fetching with TanStack Query
  - Mock API integration
  - Automatic caching with configurable stale time
  - Error and loading states
- **`about.tsx`**: Static about page with comparison of TanStack Start vs Next.js
- **`main.tsx`**: Application entry point with router setup
- **`app.css`**: Global styles for the application

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Start both frontend and API server:**

```bash
npm run dev:all
```

This will start:
- Frontend dev server at `http://localhost:5173`
- API server at `http://localhost:3001`

**Start only the API server:**

```bash
npm run dev:server
```

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run typecheck
```

## 🎯 What It Demonstrates

### 1. Authentication System

Real login system with backend API:
- Express API server with `/api/login` endpoint
- AuthContext for managing authentication state
- Protected routes and conditional navigation
- Session token storage
- Error handling for invalid credentials

**Demo credentials:**
- Email: `demo@user.com`
- Password: `password`

### 2. Type-Safe File-Based Routing

Routes are automatically generated from the file structure in `src/routes/`:

```typescript
// Routes are type-safe
<Link to="/">Home</Link>
<Link to="/about">About</Link>
```

### 3. Client-Side Data Fetching with TanStack Query

Data is fetched and cached efficiently on the client:

```typescript
const { data: posts, isLoading, error } = useQuery<Post[]>({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})
```

### 4. Automatic Route Generation

The TanStack Router plugin automatically generates the route tree from your file structure:

- `src/routes/index.tsx` → `/`
- `src/routes/about.tsx` → `/about`
- `src/routes/login.tsx` → `/login`
- `src/routes/__root.tsx` → Root layout for all routes

### 5. Built-in DevTools

Both TanStack Router and Query DevTools are included for debugging:
- **Router DevTools**: See route tree, active routes, and params
- **Query DevTools**: Inspect queries, mutations, and cache state

## 📊 TanStack Router vs Next.js Routing

### TanStack Router (This Project)

**Pros:**
- Type-safe file-based routing
- Framework agnostic - works with any React setup
- Seamless TanStack Query integration
- Built-in search param handling
- Loader functions for data fetching
- Excellent TypeScript support

**Approach:**
- Client-side routing with optional SSR
- Routes generated from file structure
- Data fetching via loaders or hooks
- Full control over rendering strategy

### Next.js

**Pros:**
- Larger ecosystem with more built-in features
- Image and Font optimization out of the box
- Mature with extensive documentation
- Strong conventions (App Router, Server Components)
- Optimized for Vercel deployment

**Approach:**
- Server Components (App Router) or getServerSideProps/getStaticProps (Pages Router)
- Automatic code splitting
- Built-in caching strategies
- File-system based routing

### Key Difference

**TanStack Router** provides granular control and is less opinionated, making it ideal for teams that want flexibility and already use TanStack libraries. It's perfect for SPAs and can be extended with SSR.

**Next.js** offers more built-in features and conventions for rapid development, making it great for teams that want a complete solution with less configuration. It's opinionated about SSR/SSG from the start.

### 5. Built-in DevTools

## 📝 Note on TanStack Start

This project was originally planned to use **TanStack Start** (the SSR framework), but due to version compatibility issues in the current TanStack Start packages, we've built a client-side application using **TanStack Router** instead. This still demonstrates all the key concepts:

- Type-safe routing
- TanStack Query for data fetching
- File-based route generation
- TypeScript throughout

TanStack Start is in active development and once stable, would provide SSR/SSG capabilities similar to Next.js but with the TanStack ecosystem.

## 📚 Learn More

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)
- [Vite Docs](https://vitejs.dev)

## 📝 License

MIT
