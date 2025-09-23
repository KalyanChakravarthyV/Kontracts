# Overview

YuKa Contracts is a comprehensive contract management platform with AI-powered document processing and accounting compliance features. The application combines document upload and processing capabilities with automated compliance calculations for ASC842 and IFRS16 lease accounting standards. It provides users with a dashboard for tracking active contracts, pending payments, and compliance scores, while leveraging AI to extract contract data and generate recommendations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript in a single-page application (SPA) architecture. Key design decisions:
- **Component Library**: Radix UI components with shadcn/ui for consistent, accessible UI components
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
The server follows a RESTful API pattern built with Express.js:
- **Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM with PostgreSQL for type-safe database operations
- **File Upload**: Multer middleware for handling document uploads with file type validation
- **Session Management**: Express sessions with PostgreSQL session store
- **Error Handling**: Centralized error handling middleware

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle for type-safe database queries and schema management
- **Schema Design**: Normalized tables for users, contracts, documents, compliance schedules, and journal entries
- **File Storage**: Local filesystem storage for uploaded documents with organized directory structure

## Authentication and Authorization
- **Session-based**: Express sessions with PostgreSQL session store
- **User Management**: Simple user model with username/password authentication
- **Authorization**: User-based data isolation through userId foreign keys

## AI and Document Processing
- **OpenAI Integration**: GPT-5 model for contract data extraction and AI recommendations
- **Document Processing**: Multer-based file upload with support for PDF, Word, and Excel files
- **Text Extraction**: Automated contract data extraction from uploaded documents
- **AI Recommendations**: Contextual suggestions for contracts, payments, and compliance

## Compliance and Calculations
- **ASC842 Compliance**: Automated lease accounting schedule generation
- **IFRS16 Compliance**: International lease accounting standard calculations
- **Present Value Calculations**: Financial calculations for lease liability valuation
- **Journal Entry Generation**: Automated accounting entry creation

# External Dependencies

## Database and Storage
- **Neon Database**: Serverless PostgreSQL hosting (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit (drizzle-orm, drizzle-kit)
- **PostgreSQL Session Store**: Session persistence (connect-pg-simple)

## AI and ML Services
- **OpenAI API**: GPT-5 model for document processing and AI recommendations
- **Document Processing**: File upload and text extraction capabilities

## Frontend UI Framework
- **Radix UI**: Comprehensive component library for accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide Icons**: Icon library for consistent iconography

## Development and Build Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast bundling for production builds
- **TanStack Query**: Server state management and caching

## File Processing
- **Multer**: File upload middleware with validation
- **Date-fns**: Date manipulation and formatting library

## Development Platform Integration
- **Replit**: Platform-specific plugins for development environment integration
- **Runtime Error Overlay**: Development error handling and debugging