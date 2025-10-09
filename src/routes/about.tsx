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
