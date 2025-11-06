# shadcn/ui Implementation Guide

This document provides guidance on using shadcn/ui components in the tapi project.

## Overview

The project now uses shadcn/ui components built on Radix UI and styled with Tailwind CSS for a consistent, accessible, and maintainable UI.

## Quick Start

### Importing Components

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
```

### Using Path Aliases

All imports can use the `@/` prefix which maps to `./src/`:

```tsx
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
```

## Available Components

### Button

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input & Label

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
  />
</div>
```

### Alert

```tsx
<Alert variant="default">
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>
    This is an informational message.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertDescription>
    This is an error message.
  </AlertDescription>
</Alert>
```

### Separator

```tsx
<div>
  <p>Section 1</p>
  <Separator className="my-4" />
  <p>Section 2</p>
</div>
```

## Styling with Tailwind

### Common Patterns

**Spacing:**
```tsx
<div className="space-y-6">  {/* Vertical spacing */}
<div className="space-x-4">  {/* Horizontal spacing */}
<div className="p-6">        {/* Padding */}
<div className="m-4">        {/* Margin */}
```

**Typography:**
```tsx
<h1 className="text-4xl font-bold tracking-tight">
<p className="text-muted-foreground">
<span className="text-sm">
```

**Layout:**
```tsx
<div className="flex items-center gap-4">
<div className="grid grid-cols-2 gap-4">
<div className="max-w-md mx-auto">
```

## Theme Customization

The theme is configured in `tailwind.config.js` with CSS variables defined in `src/app.css`.

### Color Variables

- `--background` - Page background
- `--foreground` - Primary text color
- `--primary` - Primary brand color
- `--secondary` - Secondary brand color
- `--muted` - Muted text/backgrounds
- `--accent` - Accent color
- `--destructive` - Error/danger color
- `--border` - Border color
- `--input` - Input border color
- `--ring` - Focus ring color

### Using Theme Colors

```tsx
<div className="bg-primary text-primary-foreground">
<p className="text-muted-foreground">
<button className="border-border">
```

## Adding New shadcn Components

To add more shadcn/ui components:

1. Visit https://ui.shadcn.com/docs/components
2. Copy the component code
3. Save to `src/components/ui/[component-name].tsx`
4. Install any required dependencies
5. Import and use in your pages

Example components to consider adding:
- Dialog
- Dropdown Menu
- Select
- Textarea
- Checkbox
- Radio Group
- Switch
- Tabs
- Toast/Sonner
- Form (with react-hook-form)

## Best Practices

1. **Use semantic HTML**: Components are built on proper HTML elements
2. **Composition over configuration**: Combine small components
3. **Consistent spacing**: Use Tailwind's spacing scale
4. **Accessibility**: Components include ARIA attributes
5. **Type safety**: All components are fully typed
6. **Responsive design**: Use Tailwind's responsive modifiers

## Migration Tips

When updating existing code:

1. Replace `<div className="card">` with `<Card>`
2. Replace `<button>` with `<Button>`
3. Replace `<input>` with `<Input>` and `<Label>`
4. Replace custom error divs with `<Alert variant="destructive">`
5. Use `className` for additional styling
6. Combine with `cn()` utility for conditional classes

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Project Components](/src/components/ui)
