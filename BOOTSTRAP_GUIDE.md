# 🚀 LabManager Bootstrap Guide

## 🎯 **Problem: No Users Exist Yet**

If your deployed LabManager has no users, you need to bootstrap the system with an initial admin user.

## 📋 **Step-by-Step Bootstrap Process**

### Step 1: Create Initial Admin User
```bash
curl -X POST https://your-app.onrender.com/api/bootstrap \
  -H "Content-Type: application/json"x
```

**Expected Response:**
```json
{
  "message": "Bootstrap completed successfully",
  "admin": {
    "email": "admin@labmanager.com",
    "id": "user-id-here"
  },
  "nextSteps": [
    "Login with admin@labmanager.com / admin123",
    "Change the default password immediately", 
    "Use POST /api/admin/seed to create sample data"
  ]
}
```

### Step 2: Login with Admin Credentials
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@labmanager.com","password":"admin123"}' \
  -c cookies.txt
```

### Step 3: Create Sample Data
```bash
curl -X POST https://your-app.onrender.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**This creates:**
- 2 Labs (Chemistry, Biology)
- 2 Instructors
- 8 Students  
- 2 Classes
- 11 Computers

## 🌐 **Using Browser (Easier Method)**

### Option A: Browser Bootstrap
1. **Visit**: `https://your-app.onrender.com/api/bootstrap`
2. **Make POST request** (use browser dev tools or Postman)
3. **Should see success message** with admin credentials

### Option B: Use Browser Dev Tools
1. **Open your app** in browser
2. **Open Developer Tools** (F12)
3. **Go to Console tab**
4. **Run this JavaScript:**

```javascript
// Bootstrap admin user
fetch('/api/bootstrap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => console.log('Bootstrap result:', data));
```

## 🔐 **Default Admin Credentials**

After bootstrap completes:
```
Email: admin@labmanager.com
Password: admin123
```

**⚠️ IMPORTANT: Change this password immediately after first login!**

## 🎯 **What Happens During Bootstrap**

### Bootstrap Endpoint (`/api/bootstrap`)
1. **Checks if any instructors exist**
2. **If none exist**: Creates admin user
3. **If instructors exist**: Returns error (use `/api/admin/seed` instead)
4. **Returns admin credentials** for immediate login

### Seeding Endpoint (`/api/admin/seed`)
1. **Requires authentication** (must be logged in as instructor)
2. **Creates comprehensive test data**
3. **Safe to run multiple times** (won't duplicate data)

## 🔧 **Troubleshooting Bootstrap**

### Bootstrap Returns "Bootstrap not needed"
**Cause**: Admin users already exist  
**Solution**: Skip bootstrap, try logging in with existing credentials

### Bootstrap Fails with Database Error
**Cause**: Database connection issues  
**Solution**: 
1. Check health endpoint: `/api/health`
2. Verify DATABASE_URL is set correctly
3. Check Neon database status

### Can't Login After Bootstrap
**Cause**: Session/cookie issues  
**Solution**:
1. Clear browser cookies
2. Try incognito/private browsing
3. Check SESSION_SECRET is set

## 📊 **Verification Steps**

### 1. Check Health
```bash
curl https://your-app.onrender.com/api/health
```
Should return: `{"status":"healthy","database":"connected"}`

### 2. Verify Bootstrap Worked
```bash
curl -X POST https://your-app.onrender.com/api/bootstrap
```
Should return: `{"error":"Bootstrap not needed","message":"Admin users already exist..."}`

### 3. Test Login
Visit your app and login with `admin@labmanager.com` / `admin123`

## 🎉 **After Successful Bootstrap**

1. **✅ Login to your app** with admin credentials
2. **✅ Change default password** immediately  
3. **✅ Create sample data** using the seeding endpoint
4. **✅ Test all functionality** with the created data
5. **✅ Create additional users** as needed

## 🚨 **Security Notes**

### ⚠️ **Critical Security Steps**
- **Change admin password** immediately after first login
- **Don't use default credentials** for real users
- **Bootstrap endpoint is public** - only works when no admins exist
- **Seeding endpoint requires auth** - safe from unauthorized access

### 🛡️ **Production Security**
- Bootstrap automatically disabled after first admin is created
- Default password is weak by design (forces immediate change)
- All subsequent operations require proper authentication

## 📞 **Quick Reference**

### If You Have NO USERS:
```bash
# 1. Bootstrap admin
POST /api/bootstrap

# 2. Login with admin@labmanager.com / admin123
# 3. Change password immediately
# 4. Create sample data with POST /api/admin/seed
```

### If You Have USERS:
```bash
# Skip bootstrap, go directly to:
POST /api/admin/seed  # (requires login)
```

**Your LabManager is now ready for testing!** 🎯
