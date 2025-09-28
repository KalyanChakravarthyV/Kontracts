# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (client + server)
- `npm run build` - Build for production using Vite + ESBuild
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes using Drizzle Kit

## Project Architecture

### Tech Stack
- **Frontend**: React + TypeScript SPA with Vite build system
- **Backend**: Express.js + TypeScript with session-based authentication
- **Database**: PostgreSQL with Neon serverless hosting, Drizzle ORM
- **UI**: Radix UI components with shadcn/ui, Tailwind CSS, dark mode support
- **State Management**: TanStack Query for server state, React Hook Form + Zod validation
- **Routing**: Wouter for lightweight client-side routing
- **AI Integration**: OpenAI GPT models for document processing and recommendations

### File Structure
- `client/src/` - React frontend application
  - `pages/` - Application pages (dashboard, contracts, compliance, etc.)
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and configurations
- `server/` - Express.js backend
  - `routes.ts` - API route definitions
  - `services/` - Business logic (compliance calculations, document processing, OpenAI)
  - `storage.ts` - Database queries and data access layer
  - `db.ts` - Database connection setup
- `shared/` - Shared code between client and server
  - `schema.ts` - Database schema and Zod validation schemas
- `uploads/` - File storage for uploaded documents

### Database Schema
Core entities defined in `shared/schema.ts`:
- `users` - User authentication and profiles
- `contracts` - Contract management with vendor, payment terms, amounts
- `documents` - File uploads with AI extraction data
- `complianceSchedules` - ASC842/IFRS16 lease accounting schedules
- `journalEntries` - Automated accounting entries
- `journalEntrySetups` - Templates for journal entry automation
- `payments` - Payment tracking and scheduling
- `aiRecommendations` - AI-generated suggestions and alerts

### Path Aliases
- `@/*` maps to `client/src/*`
- `@shared/*` maps to `shared/*`
- `@assets/*` maps to `attached_assets/*`

## Key Features

**Contract Management**: Create, track, and manage contracts with vendors including payment terms, amounts, and status tracking.

**AI Document Processing**: Upload PDF, Word, and Excel documents for automatic data extraction using OpenAI models. Extracted data populates contract fields.

**Compliance Calculations**: Automated ASC842 and IFRS16 lease accounting schedule generation with present value calculations and discount rate applications.

**Journal Entry Automation**: Configure journal entry templates that automatically generate accounting entries based on contract events and compliance schedules.

**AI Recommendations**: Contextual suggestions for contract management, payment scheduling, and compliance optimization.

## Development Notes

- Database changes require running `npm run db:push` to sync schema
- Authentication uses Express sessions with PostgreSQL session store
- File uploads handled by Multer middleware with validation
- All database operations use Drizzle ORM with type safety
- TypeScript strict mode enabled - ensure type compliance
- Uses ESM modules throughout (type: "module" in package.json)