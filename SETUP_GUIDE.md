# LabManager Setup Guide: Neon + Render Deployment

Follow this step-by-step guide to set up your LabManager application with Neon database and deploy to Render.

## 🗄️ Step 1: Set Up Neon Database

### 1.1 Create Neon Account and Project
1. **Visit Neon Console**: https://console.neon.tech/ (should be open in your browser)
2. **Sign Up/Login**: Use GitHub, Google, or email
3. **Create New Project**:
   - Click "Create Project" or "New Project"
   - **Project Name**: `labmanager-production`
   - **Database Name**: `labmanager` (or keep default)
   - **Region**: Choose closest to your users (e.g., US East for North America)
   - **PostgreSQL Version**: Keep default (latest)
   - Click "Create Project"

### 1.2 Get Database Connection String
1. **Navigate to Dashboard**: After project creation, you'll see the dashboard
2. **Find Connection Details**:
   - Look for "Connection Details" section
   - You'll see multiple connection strings
3. **Copy the POOLED Connection String**:
   - Click on "Pooled connection" tab
   - Copy the connection string that looks like:
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/labmanager?sslmode=require&pgbouncer=true
   ```
   - **Important**: Use the POOLED connection for better performance

### 1.3 Save Connection Details
Keep these details safe - you'll need them for both local development and production:
- **Database URL**: The pooled connection string
- **Host**: The hostname from the connection string
- **Database Name**: Usually `labmanager` or `neondb`
- **Username**: From the connection string
- **Password**: From the connection string

---

## 💻 Step 2: Configure Local Environment

### 2.1 Create Local Environment File
```bash
# In your project directory
cp .env.example .env
```

### 2.2 Edit .env File
Open `.env` and add your Neon connection details:
```bash
# Replace with your actual Neon connection string
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/labmanager?sslmode=require&pgbouncer=true

# Generate a secure session secret
SESSION_SECRET=your-super-secure-session-secret-here

# Development settings
NODE_ENV=development
PORT=5000
```

### 2.3 Generate Session Secret
Use one of these methods to generate a secure session secret:

**Option A - OpenSSL (Mac/Linux):**
```bash
openssl rand -base64 32
```

**Option B - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C - Online Generator:**
Visit https://generate-secret.vercel.app/32 (or similar secure generator)

### 2.4 Test Local Setup
```bash
# Install dependencies (if not already done)
npm install

# Initialize database
npm run db:init

# Start development server
npm run dev
```

If successful, you should see:
- Database connection established
- Schema created
- Server running on http://localhost:5000

---

## 🚀 Step 3: Deploy to Render

### 3.1 Prepare for Deployment
1. **Commit your changes** (but NOT the .env file):
```bash
git add .
git commit -m "Add Neon database configuration and Render deployment setup"
git push origin main
```

### 3.2 Create Render Account and Service
1. **Visit Render**: https://render.com/
2. **Sign Up/Login**: Connect with GitHub (recommended)
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - **Connect Repository**: Select your LabManager repository
   - **Branch**: `main` (or your default branch)

### 3.3 Configure Render Service
**Basic Settings:**
- **Name**: `labmanager` (or your preferred name)
- **Runtime**: `Node`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start`
- **Plan**: Start with "Starter" ($7/month) - can upgrade later

**Advanced Settings:**
- **Auto-Deploy**: Enable (deploys automatically on git push)
- **Health Check Path**: `/api/health`

### 3.4 Set Environment Variables
In the Render dashboard, go to "Environment" tab and add:

```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-neon-pooled-connection-string>
SESSION_SECRET=<your-generated-session-secret>
```

**Important Notes:**
- Use the SAME `DATABASE_URL` from your Neon dashboard
- Use the SAME `SESSION_SECRET` you generated earlier
- `PORT=10000` is Render's default port

### 3.5 Deploy
1. **Click "Create Web Service"**
2. **Monitor Build Process**: Watch the build logs in real-time
3. **Wait for Deployment**: First deployment takes 5-10 minutes

---

## ✅ Step 4: Verify Deployment

### 4.1 Check Application Health
1. **Get Your App URL**: From Render dashboard (e.g., `https://labmanager.onrender.com`)
2. **Test Health Endpoint**: Visit `https://your-app-url.onrender.com/api/health`
3. **Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "database": "connected",
  "version": "1.0.0"
}
```

### 4.2 Test Application Features
1. **Visit Main App**: Go to your app URL
2. **Test Registration**: Create a new user account
3. **Test Login**: Login with your credentials
4. **Check Database**: Verify data is being saved

### 4.3 Create Initial Admin User (Production)
If you need an admin user in production:
1. **Option A**: Use the auto-created admin:
   - Email: `admin@labmanager.com`
   - Password: `admin123`
   - **CHANGE THIS IMMEDIATELY** after first login

2. **Option B**: Create via API (if you have access):
   - Make a POST request to `/api/admin/seed`
   - This creates sample data including admin users

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Build Failures
**Problem**: Build fails in Render
**Solutions**:
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation: `npm run check`

#### Database Connection Issues
**Problem**: "Database connection failed"
**Solutions**:
- Verify `DATABASE_URL` is correct in Render environment
- Check Neon database status in console
- Ensure you're using the POOLED connection string

#### Application Won't Start
**Problem**: App crashes on startup
**Solutions**:
- Check Render logs for error messages
- Verify all environment variables are set
- Ensure `SESSION_SECRET` is set

#### Health Check Fails
**Problem**: `/api/health` returns 503
**Solutions**:
- Check database connection
- Verify schema was created properly
- Check application logs for errors

---

## 📋 Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] Health check returns "healthy"
- [ ] User registration works
- [ ] User login works
- [ ] Database operations work
- [ ] Admin user can access admin features
- [ ] Change default admin password
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)

---

## 🔄 Next Steps

1. **Security**: Change default admin password
2. **Monitoring**: Set up uptime monitoring
3. **Backup**: Verify Neon backup settings
4. **Scaling**: Monitor usage and upgrade plans as needed
5. **Custom Domain**: Configure your own domain (optional)

---

## 📞 Support Resources

- **Neon Documentation**: https://neon.tech/docs
- **Render Documentation**: https://render.com/docs
- **Application Health Check**: `https://your-app.onrender.com/api/health`
- **Neon Dashboard**: https://console.neon.tech/
- **Render Dashboard**: https://dashboard.render.com/
