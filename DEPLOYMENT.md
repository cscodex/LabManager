# LabManager Deployment Guide

This guide covers deploying the LabManager application to Render with Neon PostgreSQL database.

## Prerequisites

1. **Neon Database Account**: Sign up at [console.neon.tech](https://console.neon.tech/)
2. **Render Account**: Sign up at [render.com](https://render.com/)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Step 1: Set Up Neon Database

### 1.1 Create Neon Project
1. Go to [Neon Console](https://console.neon.tech/)
2. Click "Create Project"
3. Choose a project name (e.g., "labmanager-prod")
4. Select your preferred region
5. Click "Create Project"

### 1.2 Get Database Connection String
1. In your Neon dashboard, navigate to "Connection Details"
2. Copy the **Pooled connection** string (recommended for production)
3. The format should be: `postgresql://username:password@hostname/database?sslmode=require`
4. Save this for later use in Render

### 1.3 Configure Database Settings (Optional)
- **Compute Settings**: Adjust based on your needs (default is usually fine for starter projects)
- **Storage**: Monitor usage and upgrade if needed
- **Branching**: Consider creating separate branches for staging/production

## Step 2: Deploy to Render

### 2.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `labmanager` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Start with "Starter" (can upgrade later)

### 2.2 Set Environment Variables
In your Render service settings, add these environment variables:

```bash
# Required Variables
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-neon-connection-string>
SESSION_SECRET=<generate-secure-random-string>

# Optional Variables
npm_package_version=1.0.0
```

#### Generating SESSION_SECRET
Use one of these methods to generate a secure session secret:
```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online generator (use a reputable source)
```

### 2.3 Configure Auto-Deploy
1. Enable "Auto-Deploy" in your service settings
2. Set the branch to deploy from (usually `main` or `master`)
3. Configure build filters if needed (optional)

## Step 3: Database Migration

### 3.1 Initial Database Setup
The database schema will be automatically created during the first deployment due to the `postbuild` script in package.json.

### 3.2 Manual Migration (if needed)
If you need to run migrations manually:
1. Go to your Render service dashboard
2. Open the "Shell" tab
3. Run: `npm run db:push`

### 3.3 Seed Database (Optional)
To populate with sample data:
1. Access your deployed application
2. Make a POST request to `/api/admin/seed` (requires instructor authentication)
3. Or use the shell: `npm run db:seed`

## Step 4: Verification

### 4.1 Health Check
Visit your deployed application URL + `/api/health` to verify:
- Application is running
- Database connection is working
- All services are healthy

### 4.2 Application Testing
1. Visit your application URL
2. Test user registration/login
3. Verify core functionality works
4. Check browser console for any errors

## Step 5: Production Considerations

### 5.1 Security
- [ ] Ensure SESSION_SECRET is strong and unique
- [ ] Verify HTTPS is enabled (Render provides this automatically)
- [ ] Review CORS settings if needed
- [ ] Consider rate limiting for API endpoints

### 5.2 Performance
- [ ] Monitor application performance in Render dashboard
- [ ] Consider upgrading to higher plans if needed
- [ ] Monitor Neon database performance and storage usage
- [ ] Set up database connection pooling (already configured)

### 5.3 Monitoring
- [ ] Set up Render alerts for service health
- [ ] Monitor application logs
- [ ] Set up uptime monitoring (external service)
- [ ] Monitor database metrics in Neon dashboard

### 5.4 Backup Strategy
- [ ] Neon provides automatic backups
- [ ] Consider additional backup strategies for critical data
- [ ] Test backup restoration procedures

## Troubleshooting

### Common Issues

#### Build Failures
- Check build logs in Render dashboard
- Verify all dependencies are in package.json
- Ensure TypeScript compilation succeeds

#### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon database status
- Ensure SSL is properly configured

#### Application Crashes
- Check application logs in Render
- Verify all environment variables are set
- Check for missing dependencies

#### Performance Issues
- Monitor resource usage in Render dashboard
- Check database query performance in Neon
- Consider upgrading service plans

### Getting Help
- **Render Support**: [render.com/docs](https://render.com/docs)
- **Neon Support**: [neon.tech/docs](https://neon.tech/docs)
- **Application Logs**: Available in Render dashboard

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Application environment | `production` |
| `PORT` | Yes | Application port | `10000` |
| `DATABASE_URL` | Yes | Neon database connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | Yes | Session encryption key | `base64-encoded-string` |
| `npm_package_version` | No | Application version | `1.0.0` |

## Scaling Considerations

As your application grows, consider:
- Upgrading Render service plan
- Upgrading Neon database plan
- Implementing caching strategies
- Adding CDN for static assets
- Setting up multiple environments (staging, production)
