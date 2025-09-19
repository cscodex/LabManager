# 🔐 LabManager Login Credentials

## Default Login Credentials

### 👨‍🏫 **Instructor/Admin Accounts**

#### Primary Admin (Auto-created)
- **Email**: `admin@labmanager.com`
- **Password**: `admin123`
- **Role**: Instructor (Admin)
- **Access**: Full system access
- **Created by**: Database initialization script

#### Test Instructors (From Seeding)
1. **Dr. John Smith**
   - **Email**: `john.smith@school.edu`
   - **Password**: `password123`
   - **Role**: Instructor

2. **Sarah Johnson**
   - **Email**: `sarah.johnson@school.edu`
   - **Password**: `password123`
   - **Role**: Instructor

3. **Mike Davis**
   - **Email**: `mike.davis@school.edu`
   - **Password**: `password123`
   - **Role**: Instructor

### 👨‍🎓 **Student Test Accounts** (From Seeding)

All students use password: `student123`

#### Sample Students
1. **Alice Anderson** - `alice.anderson@student.edu`
2. **Bob Brown** - `bob.brown@student.edu`
3. **Carol Clark** - `carol.clark@student.edu`
4. **David Davis** - `david.davis@student.edu`
5. **Eva Evans** - `eva.evans@student.edu`
6. **Frank Foster** - `frank.foster@student.edu`
7. **Grace Green** - `grace.green@student.edu`
8. **Henry Harris** - `henry.harris@student.edu`
9. **Ivy Irving** - `ivy.irving@student.edu`
10. **Jack Jackson** - `jack.jackson@student.edu`

*And 5 more students... (15 total)*

## 🚀 How to Create These Accounts

### Option 1: Automatic Seeding (Recommended)
1. **Access your deployed app**
2. **Login as admin** (if admin account exists)
3. **Make POST request** to `/api/admin/seed`
4. **This creates sample data** including users, labs, classes

### Option 2: Manual Account Creation
1. **Visit your app** registration page
2. **Create accounts manually** using the credentials above
3. **Set roles appropriately** (instructor vs student)

### Option 3: Database Initialization Script
The `npm run db:init` script creates a default admin user:
- **Email**: `admin@labmanager.com`
- **Password**: `admin123`

## 🔧 Setting Up Login Credentials

### For Development (Local)
```bash
# Run database initialization (creates admin user)
npm run db:init

# Or run seeding script (creates sample users)
npm run db:seed
```

### For Production (Render)
1. **Access your deployed app**
2. **Use the health check** to verify it's running
3. **Create admin account** via registration
4. **Or use the auto-created admin** from initialization

## 📋 Testing Login Flow

### Test Instructor Login
1. Go to your app login page
2. Use: `admin@labmanager.com` / `admin123`
3. Should access instructor dashboard
4. Can manage labs, classes, students

### Test Student Login
1. Register a new student account
2. Or use seeded student credentials
3. Should access student dashboard
4. Can view assignments, submit work

## 🔐 Security Notes

### ⚠️ **IMPORTANT: Change Default Passwords**
- **Change admin password** immediately after first login
- **Use strong passwords** in production
- **Don't use default credentials** for real users

### 🛡️ **Production Security**
- Default admin is created with weak password
- Change it immediately: `admin123` → strong password
- Consider disabling default admin after creating real admin users

## 🎯 Quick Login Test

### After Deployment
1. **Visit your app**: `https://your-app.onrender.com`
2. **Try admin login**: `admin@labmanager.com` / `admin123`
3. **If login fails**: Admin user may not be created yet
4. **Create manually** or run seeding endpoint

### Seeding Endpoint
```bash
# POST request to create sample data
curl -X POST https://your-app.onrender.com/api/admin/seed \
  -H "Content-Type: application/json"
```

## 📞 Troubleshooting Login

### Admin User Not Found
- **Run database initialization**: May not have been created
- **Check database**: Verify users table has data
- **Create manually**: Use registration form

### Login Not Working
- **Check database connection**: Verify health endpoint
- **Check session configuration**: Verify SESSION_SECRET is set
- **Check password hashing**: Verify bcrypt is working

### Access Denied
- **Check user role**: Ensure correct permissions
- **Check authentication**: Verify session is working
- **Check routes**: Ensure proper middleware

## 🎉 Ready to Test!

Once your deployment is successful, you can immediately test with:
- **Admin**: `admin@labmanager.com` / `admin123`
- **Or create your own** accounts via registration

**Remember to change default passwords in production!** 🔐
