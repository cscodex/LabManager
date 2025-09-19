# 🧪 LabManager Testing Guide

## 🚀 Quick Start Testing

### 1. **Access Your Deployed App**
- **URL**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/api/health`

### 2. **Default Login Credentials**

#### 👨‍🏫 **Admin/Instructor Login**
```
Email: admin@labmanager.com
Password: admin123
```

#### 👨‍🎓 **Student Login** (after seeding)
```
Email: alice.anderson@student.edu
Password: student123
```

## 📋 Testing Scenarios

### Scenario 1: Admin Dashboard Test
1. **Login as admin** using credentials above
2. **Navigate to Labs** - Should see lab management
3. **Navigate to Classes** - Should see class management
4. **Navigate to Users** - Should see user management
5. **Check permissions** - Should have full access

### Scenario 2: Student Dashboard Test
1. **Login as student** (create account or use seeded data)
2. **View assignments** - Should see student-specific content
3. **Check restrictions** - Should not see admin features
4. **Test submissions** - Should be able to submit work

### Scenario 3: Data Creation Test
1. **Login as admin**
2. **Create a new lab** - Test lab creation
3. **Create a new class** - Test class creation
4. **Add computers** - Test equipment management
5. **Enroll students** - Test enrollment system

## 🔧 Setting Up Test Data

### Option 1: Full Seeding (Recommended)
```bash
# Creates comprehensive test data
POST /api/admin/seed
```

**What it creates:**
- 3 Labs with computers
- 3 Instructors
- 15 Students
- 4 Classes
- Timetables and enrollments

### Option 2: Basic Test Users Only
```bash
# Local development
npm run create-test-users

# Or via API (if endpoint is added)
POST /api/create-test-users
```

**What it creates:**
- 1 Admin user
- 1 Instructor user
- 3 Student users

### Option 3: Manual Registration
1. **Visit registration page**
2. **Create accounts manually**
3. **Set appropriate roles**

## 🎯 Key Features to Test

### Authentication & Authorization
- [ ] User registration works
- [ ] User login works
- [ ] Password validation works
- [ ] Role-based access control works
- [ ] Session management works
- [ ] Logout works

### Lab Management (Admin/Instructor)
- [ ] Create new labs
- [ ] Edit lab details
- [ ] Add computers to labs
- [ ] View lab capacity and usage
- [ ] Delete labs (if empty)

### Class Management (Admin/Instructor)
- [ ] Create new classes
- [ ] Set class schedules
- [ ] Assign labs to classes
- [ ] Manage class enrollment
- [ ] View class statistics

### Student Features
- [ ] View enrolled classes
- [ ] See class schedules
- [ ] Access assignments
- [ ] Submit work
- [ ] View grades

### System Features
- [ ] Database connectivity
- [ ] Session persistence
- [ ] Error handling
- [ ] Responsive design
- [ ] Navigation works

## 🔍 Testing Endpoints

### Health Check
```bash
GET /api/health
# Should return: {"status": "healthy", "database": "connected"}
```

### Authentication
```bash
POST /api/auth/login
Content-Type: application/json
{
  "email": "admin@labmanager.com",
  "password": "admin123"
}
```

### Data Seeding
```bash
POST /api/admin/seed
# Requires authentication
# Creates comprehensive test data
```

## 🐛 Common Issues & Solutions

### Login Not Working
- **Check credentials**: Verify email/password
- **Check database**: Ensure users table has data
- **Check session**: Verify SESSION_SECRET is set
- **Try registration**: Create new account manually

### No Data Visible
- **Run seeding**: POST to `/api/admin/seed`
- **Check database**: Verify tables have data
- **Check permissions**: Ensure user has correct role
- **Check authentication**: Verify user is logged in

### Permission Denied
- **Check user role**: Ensure correct permissions
- **Re-login**: Session may have expired
- **Check routes**: Verify middleware is working
- **Check database**: Verify user role in database

### Database Errors
- **Check connection**: Verify DATABASE_URL
- **Check Neon status**: Visit Neon dashboard
- **Check schema**: Ensure tables exist
- **Check migrations**: Run database initialization

## 📊 Test Data Overview

### After Full Seeding
- **Labs**: 3 (Computer Lab A, Computer Lab B, Programming Lab)
- **Computers**: 37 total across all labs
- **Instructors**: 3 (John Smith, Sarah Johnson, Mike Davis)
- **Students**: 15 (Alice Anderson, Bob Brown, etc.)
- **Classes**: 4 (Introduction to Programming, Web Development, etc.)
- **Enrollments**: Multiple students enrolled in classes

### User Roles & Permissions
- **Instructors**: Can manage labs, classes, students, assignments
- **Students**: Can view classes, assignments, submit work, see grades
- **Admin**: Same as instructor (role-based, not separate admin role)

## 🎉 Success Criteria

### ✅ **Deployment Successful If:**
- Health check returns "healthy"
- Admin login works
- Database operations work
- UI loads without errors
- Navigation functions properly

### ✅ **Full Functionality If:**
- All user roles work correctly
- CRUD operations work for all entities
- Authentication and authorization work
- Data persistence works
- Session management works

## 📞 Quick Test Commands

```bash
# Test health
curl https://your-app.onrender.com/api/health

# Test login (replace with your app URL)
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@labmanager.com","password":"admin123"}'

# Create test data
curl -X POST https://your-app.onrender.com/api/admin/seed \
  -H "Content-Type: application/json" \
  -b "session_cookie_if_needed"
```

## 🔐 Security Testing

### ⚠️ **Important Security Checks**
- [ ] Default passwords changed in production
- [ ] SQL injection protection works
- [ ] XSS protection works
- [ ] CSRF protection works
- [ ] Session security works
- [ ] Input validation works

**Remember: Change all default passwords in production!** 🛡️
