# DevNexus: Advanced Incident Management Platform 🚀

DevNexus is a comprehensive, developer-centric incident management and monitoring system. It provides real-time error tracking, SLA management, and role-specific dashboards to help teams resolve issues faster.

## Project Structure

This monorepo contains the following components:

- **[incident-management-system](./incident-management-system)**: The core web application and dashboard built with Next.js, Prisma, and Tailwind CSS.
- **[sdk](./sdk)**: The official lightweight SDK for reporting errors and incidents from your applications to DevNexus.

## Getting Started

### Prerequisites

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

---

© 2026 DevNexus Team.
