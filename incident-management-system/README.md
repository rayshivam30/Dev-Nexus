# DevNexus Management System 🚨

This is the core incident management platform and dashboard for DevNexus. It's built with Next.js (App Router), Prisma, and TypeScript.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js
- A PostgreSQL database instance

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up Environment
Create a `.env` file with the following variables:
```bash
DATABASE_URL="postgres://..."
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
Initialize the Prisma client and run migrations:
```bash
bun x prisma generate
bun x prisma migrate dev
```

### 4. Run Development Server
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Key Screens
- **/dashboard**: Main incident management board.
- **/projects**: Project and plan management.
- **/profile**: Performance metrics and activity hub.
- **/settings**: Team and API key configuration.

---

© 2026 DevNexus Team.
