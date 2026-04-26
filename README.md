<<<<<<< HEAD
# DevNexus: Advanced Incident Management Platform 🚀

DevNexus is a comprehensive, developer-centric incident management and monitoring system. It provides real-time error tracking, SLA management, and role-specific dashboards to help teams resolve issues faster.

## Project Structure

This monorepo contains the following components:

- **[incident-management-system](./incident-management-system)**: The core web application and dashboard built with Next.js, Prisma, and Tailwind CSS.
- **[sdk](./sdk)**: The official lightweight SDK for reporting errors and incidents from your applications to DevNexus.
=======
# DevNexus Management System 🚨

This is the core incident management platform and dashboard for DevNexus. It's built with Next.js (App Router), Prisma, and TypeScript.
>>>>>>> 6c995ff (Initial project upload)

## Getting Started

### Prerequisites

<<<<<<< HEAD
- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- PostgreSQL database (for the management system)

### Running the Management System

1. Navigate to the `incident-management-system` directory:
   ```bash
   cd incident-management-system
   ```
2. Install dependencies:
   ```bash
   bun install # or npm install
   ```
3. Set up your environment variables in a `.env` file (see `.env.example`).
4. Run the development server:
   ```bash
   bun dev
   ```

### Using the SDK

To integrate DevNexus into your own projects, please refer to the [SDK Documentation](./sdk/README.md).

## Key Features

- **Multi-Role Dashboards**: Specific views and metrics for Admins, Managers, and Developers.
- **SLA Tracking**: Automated time-to-resolve tracking based on project plans and issue severity.
- **Smart Error Grouping**: Automatically groups similar stack traces for cleaner incident logs.
- **Custom SDK**: Easy-to-use client for global error capture and manual reporting.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Bun / Node.js
=======
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
>>>>>>> 6c995ff (Initial project upload)

---

© 2026 DevNexus Team.
