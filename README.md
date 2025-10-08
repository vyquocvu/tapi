# VStack - Todo List App

A full-stack todo list application built with TanStack Start, React, and Prisma.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as completed/incomplete
- ✅ Separate views for active and completed tasks
- ✅ Real-time task counter
- ✅ Responsive design
- ✅ Full-stack TypeScript
- ✅ SQLite database with Prisma ORM

## Tech Stack

- **Frontend**: React 18, TanStack Router
- **Backend**: TanStack Start (file-based API routes)
- **Database**: SQLite with Prisma ORM
- **Build Tool**: Vinxi
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vyquocvu/vstack.git
cd vstack
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Copy the example environment file
cp .env.example .env

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
vstack/
├── app/
│   ├── routes/
│   │   ├── api/
│   │   │   └── todos/
│   │   │       ├── $id.ts      # API route for individual todo operations
│   │   │       └── todos.ts     # API route for todo list operations
│   │   ├── __root.tsx           # Root route component
│   │   └── index.tsx            # Home page with todo list
│   ├── styles/
│   │   └── app.css              # Application styles
│   ├── utils/
│   │   └── prisma.ts            # Prisma client singleton
│   ├── client.tsx               # Client-side entry point
│   ├── router.tsx               # Router configuration
│   └── ssr.tsx                  # Server-side entry point
├── prisma/
│   └── schema.prisma            # Prisma schema definition
├── app.config.ts                # TanStack Start configuration
├── package.json
└── tsconfig.json
```

## API Routes

### GET /api/todos
Get all todos, ordered by creation date (newest first)

### POST /api/todos
Create a new todo
- Request body: `{ title: string }`

### PATCH /api/todos/:id
Update a todo's completion status
- Request body: `{ completed: boolean }`

### DELETE /api/todos/:id
Delete a todo

## Database Schema

```prisma
model Todo {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## License

MIT