import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">About Page</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About This Project</CardTitle>
          <CardDescription>
            This is a demonstration of a full-stack application built with{' '}
            <strong>TanStack Start</strong>, featuring:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground ml-6 list-disc">
            <li>TanStack Router for type-safe routing</li>
            <li>TanStack Query for data fetching and caching</li>
            <li>Server-side rendering (SSR) support</li>
            <li>API routes for backend functionality</li>
            <li>TypeScript for type safety</li>
            <li>Vite for fast development</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 TanStack Start vs Next.js
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg mb-3">TanStack Start:</h4>
            <ul className="space-y-2 text-muted-foreground ml-6 list-disc">
              <li>
                <strong className="text-foreground">Router-centric:</strong> Built on TanStack Router with 
                type-safe routing and loaders
              </li>
              <li>
                <strong className="text-foreground">Framework agnostic:</strong> Works with any React setup, 
                not tied to specific conventions
              </li>
              <li>
                <strong className="text-foreground">SSR/SSG:</strong> Supports both through loaders with explicit 
                data fetching at route level
              </li>
              <li>
                <strong className="text-foreground">Flexibility:</strong> More control over data fetching strategy 
                (loader vs client-side)
              </li>
              <li>
                <strong className="text-foreground">Query integration:</strong> Seamless TanStack Query integration 
                for caching
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-lg mb-3">Next.js:</h4>
            <ul className="space-y-2 text-muted-foreground ml-6 list-disc">
              <li>
                <strong className="text-foreground">Page-centric:</strong> File-system based routing with pages/app directory
              </li>
              <li>
                <strong className="text-foreground">Opinionated:</strong> Strong conventions (App Router, Server Components)
              </li>
              <li>
                <strong className="text-foreground">SSR/SSG:</strong> Built-in with getServerSideProps, getStaticProps, 
                or Server Components
              </li>
              <li>
                <strong className="text-foreground">Ecosystem:</strong> Larger ecosystem with more built-in features 
                (Image, Font optimization)
              </li>
              <li>
                <strong className="text-foreground">Deployment:</strong> Optimized for Vercel but works anywhere
              </li>
            </ul>
          </div>

          <Separator />

          <p className="text-muted-foreground">
            <strong className="text-foreground">Key Difference:</strong> TanStack Start provides more granular control 
            and is less opinionated, while Next.js offers more built-in features and conventions 
            for rapid development.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
