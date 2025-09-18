# LabManager - Laboratory Management System

## Overview

LabManager is a comprehensive laboratory management system designed for educational institutions to streamline the management of lab sessions, student enrollments, and grading workflows. The system serves instructors who need to organize lab activities, track student submissions, manage group assignments, and analyze performance data across multiple laboratory environments.

The application follows a class-trade-section organizational structure typical of educational institutions, supporting grade levels (11-12), trade types (Non-Medical, Medical, Commerce), and sections (A, B, C, etc.). It provides tools for scheduling lab sessions, managing computer assignments, tracking submissions, and generating analytics insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component system for accessible, customizable components
- **Styling**: Tailwind CSS with custom design system implementing Material Design principles
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Authentication**: Passport.js with local strategy and express-session for session management
- **API Design**: RESTful endpoints with role-based access control (instructor/student roles)
- **Validation**: Zod schemas for runtime type validation and form validation

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema Design**: Relational model supporting multi-lab, multi-class structure with enrollment management
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

### Authentication & Authorization
- **Strategy**: Session-based authentication with bcrypt password hashing
- **Access Control**: Role-based permissions (instructor vs student) with ownership validation
- **Security**: CSRF protection through session management and secure cookie configuration

### Key Domain Models
- **Educational Structure**: Labs → Classes → Groups → Students hierarchy
- **Session Management**: Timetable-based scheduling with computer assignments
- **Assessment Workflow**: Assignments → Submissions → Grading with rubric support
- **Analytics**: Performance tracking and grade distribution analysis

### Design System
- **Theme**: Dual light/dark mode support with CSS custom properties
- **Typography**: Roboto for UI elements, Open Sans for body text
- **Color Palette**: Academic blue primary (#1976D2) with semantic color system
- **Layout**: 12-column responsive grid with persistent sidebar navigation
- **Components**: Card-based layout optimized for data display and form interactions

## External Dependencies

### Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting with automatic scaling
- **Connection Pooling**: Node.js pg Pool for database connection management

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility and keyboard navigation
- **Recharts**: Data visualization library for analytics charts and graphs
- **Lucide React**: Icon library with consistent design language

### Development Tools
- **Drizzle Kit**: Database schema migration and management tools
- **ESBuild**: Fast JavaScript bundler for server-side code compilation
- **TypeScript**: Static type checking across client and server codebases

### Authentication
- **bcrypt**: Secure password hashing with configurable salt rounds
- **express-session**: Session middleware with PostgreSQL session store
- **Passport.js**: Authentication middleware with local strategy support

### Form Management
- **React Hook Form**: Performant form library with minimal re-renders
- **Hookform Resolvers**: Integration layer for Zod schema validation
- **Date-fns**: Date manipulation and formatting utilities

### Development Infrastructure
- **Replit Integration**: Development environment support with runtime error overlay
- **Vite Plugins**: Hot module replacement and development tooling
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer