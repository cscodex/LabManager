# Database Setup and Migration Guide

This document covers database setup, migrations, and management for the LabManager application.

## Overview

LabManager uses:
- **Database**: Neon PostgreSQL (serverless)
- **ORM**: Drizzle ORM with TypeScript
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling for production

## Quick Start

### Development Setup
1. Copy environment file: `cp .env.example .env`
2. Set your Neon DATABASE_URL in `.env`
3. Initialize database: `npm run db:init`
4. Start development: `npm run dev`

### Production Deployment
1. Set environment variables in Render dashboard
2. Deploy application (database will auto-initialize)
3. Verify with health check: `GET /api/health`

## Database Scripts

### Core Scripts
```bash
# Initialize database (creates schema + admin user)
npm run db:init

# Force reinitialize (overwrites existing)
npm run db:init:force

# Push schema changes (development)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed with sample data
npm run db:seed
```

### Advanced Scripts
```bash
# Initialize without admin user
tsx scripts/init-db.ts --skip-seed

# Verbose initialization
tsx scripts/init-db.ts --verbose

# Dry run migration
tsx scripts/migrate.ts --dry-run

# Force migration
tsx scripts/migrate.ts --force
```

## Schema Management

### Development Workflow
1. Modify schema in `shared/schema.ts`
2. Push changes: `npm run db:push`
3. Test your changes
4. Generate migration: `npm run db:generate` (for production)

### Production Workflow
1. Generate migration files: `npm run db:generate`
2. Review generated SQL in `migrations/` folder
3. Test migration on staging environment
4. Deploy to production (migrations run automatically)

## Database Schema

### Core Tables
- **users**: Authentication and user management
- **labs**: Physical laboratory spaces
- **classes**: Academic classes/courses
- **computers**: Lab equipment tracking
- **groups**: Student group management
- **enrollments**: Student-class relationships
- **sessions**: Lab session scheduling
- **assignments**: Assignment management
- **submissions**: Student submissions
- **grades**: Grade tracking
- **timetables**: Class scheduling

### Key Relationships
- Users can be instructors or students
- Students enroll in classes
- Classes are scheduled in labs
- Labs contain computers
- Sessions link classes to specific time slots
- Assignments belong to classes
- Students submit assignments and receive grades

## Environment Variables

### Required
```bash
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your-secure-session-secret
```

### Optional
```bash
NODE_ENV=development|production
PORT=5000
```

## Neon Database Setup

### 1. Create Neon Project
1. Visit [console.neon.tech](https://console.neon.tech/)
2. Create new project
3. Choose region closest to your users
4. Note the connection details

### 2. Get Connection String
1. Go to "Connection Details" in Neon dashboard
2. Copy the **Pooled connection** string
3. Use this for production (better performance)
4. Format: `postgresql://user:pass@host/db?sslmode=require`

### 3. Configure Application
1. Set `DATABASE_URL` in your environment
2. Run `npm run db:init` to set up schema
3. Verify connection with `npm run health-check`

## Migration Strategy

### Development
- Use `db:push` for rapid iteration
- Schema changes are applied directly
- No migration files generated

### Production
- Use `db:generate` to create migration files
- Review SQL before applying
- Use `db:migrate` to apply migrations
- Keep migration files in version control

### Migration Files
```
migrations/
├── 0001_initial_schema.sql
├── 0002_add_user_roles.sql
└── meta/
    ├── _journal.json
    └── 0001_snapshot.json
```

## Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
npm run health-check

# Verify Neon database status
# Check Neon dashboard for outages
```

#### Schema Issues
```bash
# Reset development database
npm run db:init:force

# Check schema differences
npm run db:studio

# Generate new migration
npm run db:generate
```

#### Migration Failures
```bash
# Check migration status
npm run db:studio

# Manual migration rollback (if needed)
# Connect to database and check __drizzle_migrations__ table

# Force migration (use with caution)
tsx scripts/migrate.ts --force
```

### Performance Issues
- Monitor connection pool usage
- Check query performance in Neon dashboard
- Consider upgrading Neon plan for more compute
- Review slow queries and add indexes

### Data Loss Prevention
- Always backup before major migrations
- Test migrations on staging first
- Use transactions for complex migrations
- Keep migration files in version control

## Backup and Recovery

### Neon Backups
- Automatic daily backups (retained based on plan)
- Point-in-time recovery available
- Branch-based development/staging

### Manual Backups
```bash
# Export schema
pg_dump $DATABASE_URL --schema-only > schema.sql

# Export data
pg_dump $DATABASE_URL --data-only > data.sql

# Full backup
pg_dump $DATABASE_URL > full_backup.sql
```

### Recovery
```bash
# Restore from backup
psql $DATABASE_URL < full_backup.sql

# Or use Neon dashboard for point-in-time recovery
```

## Monitoring

### Health Checks
- Application: `GET /api/health`
- Database: Monitor in Neon dashboard
- Connection pool: Check application logs

### Key Metrics
- Connection count
- Query performance
- Database size
- Active sessions

### Alerts
- Set up Neon alerts for high usage
- Monitor application error logs
- Set up uptime monitoring

## Security

### Best Practices
- Use connection pooling
- Enable SSL (required by Neon)
- Rotate DATABASE_URL periodically
- Use environment variables for secrets
- Limit database user permissions

### Access Control
- Separate users for different environments
- Use read-only users for reporting
- Audit database access logs
- Regular security reviews

## Performance Optimization

### Connection Management
- Use connection pooling (already configured)
- Monitor connection count
- Adjust pool size based on usage

### Query Optimization
- Use Drizzle Studio to analyze queries
- Add indexes for frequently queried columns
- Use prepared statements (Drizzle handles this)
- Monitor slow query logs

### Scaling
- Upgrade Neon compute for more performance
- Consider read replicas for read-heavy workloads
- Implement caching for frequently accessed data
- Optimize database schema design
