# Full Code Snippets

This document contains the complete code for all key files in the project.

## Configuration Files

### `package.json`

```json
{
  "name": "vstack",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "@tanstack/react-query-devtools": "^5.59.0",
    "@tanstack/react-router": "^1.132.0",
    "@tanstack/router-devtools": "^1.132.0",
    "@vitejs/plugin-react": "^4.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tanstack/router-plugin": "^1.132.1",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*", "app.config.ts"],
  "exclude": ["node_modules"]
}
```

### `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [TanStackRouterVite(), react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

### `.gitignore`

```
node_modules
dist
.vinxi
.output
.env
.DS_Store
*.log
*.timestamp_*.js
package-lock.json
```

## HTML Entry Point

### `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VStack - TanStack Router Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Application Entry

### `src/main.tsx`

```typescript
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
```

## Route Files

### `src/routes/__root.tsx`

```typescript
import { createRootRoute, Outlet, Link } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import '../app.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav>
        <Link to="/" activeProps={{ className: 'active' }}>
          Home
        </Link>
        <Link to="/about" activeProps={{ className: 'active' }}>
          About
        </Link>
      </nav>
      <div className="container">
        <Outlet />
      </div>
      <ReactQueryDevtools buttonPosition="bottom-left" />
      <TanStackRouterDevtools position="bottom-right" />
    </QueryClientProvider>
  )
}
```

### `src/routes/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

interface Post {
  id: number
  title: string
  body: string
  userId: number
}

// Mock API endpoint - simulates a server-side API
async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
  if (!response.ok) {
    throw new Error('Failed to fetch posts')
  }
  return response.json()
}

// Mock server API endpoint
async function fetchApiHello() {
  // In a real app, this would be a backend API
  // For demo purposes, we're simulating it
  return {
    message: 'Hello from the server API!',
    timestamp: new Date().toISOString(),
    status: 'success',
  }
}

function HomeComponent() {
  const queryClient = useQueryClient()

  // Pre-fetch posts data (simulating loader behavior)
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: fetchPosts,
    })
  }, [queryClient])

  // Client-side caching with TanStack Query
  const { data: posts, isLoading, error, refetch } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  })

  // Fetch from our mock server API
  const { data: apiData } = useQuery({
    queryKey: ['api-hello'],
    queryFn: fetchApiHello,
  })

  return (
    <div>
      <h1>Home Page</h1>
      <p>
        Welcome to the TanStack Start demo! This page demonstrates client-side
        data fetching with TanStack Query for efficient caching and state management.
      </p>

      {apiData && (
        <div className="info-box">
          <h3>Mock Server API Response</h3>
          <p>{apiData.message}</p>
          <p>Timestamp: {new Date(apiData.timestamp).toLocaleString()}</p>
          <p><small>(In production, this would be from /api/hello endpoint)</small></p>
        </div>
      )}

      <h2>Posts (Cached with TanStack Query)</h2>
      
      <button onClick={() => refetch()} style={{ marginBottom: '1rem' }}>
        Refetch Data
      </button>
      
      {isLoading && <div className="loading">Loading posts...</div>}
      
      {error && (
        <div className="error">
          Error loading posts: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {posts && (
        <div>
          {posts.map((post) => (
            <div key={post.id} className="card">
              <h3>{post.title}</h3>
              <p>{post.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <h3>💡 TanStack Query Benefits</h3>
        <ul>
          <li>Automatic caching and background refetching</li>
          <li>Stale data is shown while fresh data is fetched</li>
          <li>Deduplication of requests</li>
          <li>Built-in loading and error states</li>
          <li>Easy data refetching with cache invalidation</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>
          <strong>Try it:</strong> Navigate to the About page and back. Notice how the data 
          loads instantly from cache (within the 5-minute stale time).
        </p>
      </div>
    </div>
  )
}
```

### `src/routes/about.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return (
    <div>
      <h1>About Page</h1>
      <div className="card">
        <h3>About This Project</h3>
        <p>
          This is a demonstration of a full-stack application built with{' '}
          <strong>TanStack Start</strong>, featuring:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '1rem' }}>
          <li>TanStack Router for type-safe routing</li>
          <li>TanStack Query for data fetching and caching</li>
          <li>Server-side rendering (SSR) support</li>
          <li>API routes for backend functionality</li>
          <li>TypeScript for type safety</li>
          <li>Vite for fast development</li>
        </ul>
      </div>

      <div className="info-box">
        <h3>🚀 TanStack Start vs Next.js</h3>
        <p><strong>TanStack Start:</strong></p>
        <ul>
          <li>
            <strong>Router-centric:</strong> Built on TanStack Router with 
            type-safe routing and loaders
          </li>
          <li>
            <strong>Framework agnostic:</strong> Works with any React setup, 
            not tied to specific conventions
          </li>
          <li>
            <strong>SSR/SSG:</strong> Supports both through loaders with explicit 
            data fetching at route level
          </li>
          <li>
            <strong>Flexibility:</strong> More control over data fetching strategy 
            (loader vs client-side)
          </li>
          <li>
            <strong>Query integration:</strong> Seamless TanStack Query integration 
            for caching
          </li>
        </ul>

        <p style={{ marginTop: '1rem' }}><strong>Next.js:</strong></p>
        <ul>
          <li>
            <strong>Page-centric:</strong> File-system based routing with pages/app directory
          </li>
          <li>
            <strong>Opinionated:</strong> Strong conventions (App Router, Server Components)
          </li>
          <li>
            <strong>SSR/SSG:</strong> Built-in with getServerSideProps, getStaticProps, 
            or Server Components
          </li>
          <li>
            <strong>Ecosystem:</strong> Larger ecosystem with more built-in features 
            (Image, Font optimization)
          </li>
          <li>
            <strong>Deployment:</strong> Optimized for Vercel but works anywhere
          </li>
        </ul>

        <p style={{ marginTop: '1rem' }}>
          <strong>Key Difference:</strong> TanStack Start provides more granular control 
          and is less opinionated, while Next.js offers more built-in features and conventions 
          for rapid development.
        </p>
      </div>
    </div>
  )
}
```

## Styles

### `src/app.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  background: #f5f5f5;
  color: #333;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

h2 {
  color: #34495e;
  margin-top: 2rem;
  margin-bottom: 1rem;
}

nav {
  background: #2c3e50;
  padding: 1rem 2rem;
  margin-bottom: 2rem;
}

nav a {
  color: white;
  text-decoration: none;
  margin-right: 1.5rem;
  font-weight: 500;
  transition: color 0.2s;
}

nav a:hover {
  color: #3498db;
}

nav a.active {
  color: #3498db;
  border-bottom: 2px solid #3498db;
}

.card {
  background: white;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.card p {
  color: #7f8c8d;
  line-height: 1.5;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

button:hover {
  background: #2980b9;
}

.info-box {
  background: #ecf0f1;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
  border-left: 4px solid #3498db;
}

.info-box h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.info-box p {
  color: #34495e;
  margin-bottom: 0.5rem;
}

.info-box ul {
  margin-left: 1.5rem;
  color: #34495e;
}

.info-box li {
  margin-bottom: 0.5rem;
}
```

## Server Example (Optional)

### `server/api-example.js`

```javascript
/**
 * Example Server API
 * 
 * This is an example of how you could add a backend API.
 * For a production app, you would run this as a separate server
 * and proxy requests from Vite (see vite.config.ts).
 * 
 * To run this server:
 * 1. Install express: npm install express
 * 2. Run: node server/api.js
 * 3. The API will be available at http://localhost:3001/api/hello
 */

// Uncomment to use:
/*
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Example API endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from the server API!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

// Example endpoint with data
app.get('/api/posts', async (req, res) => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    const posts = await response.json();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.listen(PORT, () => {
  console.log(`Server API running at http://localhost:${PORT}`);
});
*/

console.log('Example API server file - see comments for usage instructions');
```

## How to Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Visit http://localhost:5173

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Type check:**
   ```bash
   npm run typecheck
   ```

## Key Features

- ✅ Type-safe file-based routing
- ✅ Automatic route generation
- ✅ TanStack Query for data fetching and caching
- ✅ Router and Query DevTools
- ✅ TypeScript throughout
- ✅ Production-ready build with Vite

## Next Steps

To extend this application:

1. Add more routes in `src/routes/`
2. Add a backend API server (see `server/api-example.js`)
3. Add authentication
4. Add database integration
5. Deploy to Vercel, Netlify, or similar platform
