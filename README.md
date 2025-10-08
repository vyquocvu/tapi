# VStack - Todo List App

A full-stack todo list application built with React, Express.js, Vite, and Prisma.

## Features

- ✅ Create, read, update, and delete todos
- ✅ Mark todos as completed/incomplete
- ✅ Separate views for active and completed tasks
- ✅ Real-time task counter
- ✅ Responsive design
- ✅ Full-stack TypeScript
- ✅ SQLite database with Prisma ORM

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Express.js with TypeScript
- **Database**: SQLite with Prisma ORM
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

4. Start the development servers:
```bash
npm run dev
```

This will start both the Express API server (port 3001) and the Vite dev server (port 5173).

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start both frontend and backend development servers
- `npm run server` - Start only the Express API server
- `npm run client` - Start only the Vite dev server
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
vstack/
├── server/
│   ├── routes/
│   │   └── todos.ts            # Todo API routes
│   ├── prisma.ts               # Prisma client singleton
│   └── index.ts                # Express server entry point
├── src/
│   ├── components/
│   ├── types/
│   │   └── Todo.ts             # TypeScript types
│   ├── App.tsx                 # Main React component
│   ├── App.css                 # Application styles
│   └── main.tsx                # React entry point
├── prisma/
│   └── schema.prisma           # Prisma schema definition
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
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