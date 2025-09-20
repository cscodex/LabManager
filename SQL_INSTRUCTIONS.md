# 🗄️ Direct SQL Setup Instructions

## 🎯 **Quick Solution: Run SQL Directly**

Since you need test data immediately, here's the SQL to run directly in your Neon database.

## 📋 **Step-by-Step Instructions**

### Step 1: Access Your Neon Database
1. **Go to**: [Neon Console](https://console.neon.tech)
2. **Select your project**: LabManager database
3. **Click "SQL Editor"** or "Query" tab
4. **You should see**: SQL query interface

### Step 2: Copy and Run the SQL
1. **Open**: `QUICK_SQL_SETUP.sql` (in this repository)
2. **Copy all the SQL** from that file
3. **Paste into Neon SQL Editor**
4. **Click "Run"** or press Ctrl+Enter

### Step 3: Verify Results
After running the SQL, you should see:
```
Users created: 5
Labs created: 2
```

## 🔐 **Login Credentials Created**

### Admin Login:
```
Email: admin@labmanager.com
Password: admin123
```

### Instructor Login:
```
Email: john.smith@school.edu
Password: instructor123
```

### Student Logins:
```
Email: alice.anderson@student.edu
Password: student123

Email: bob.brown@student.edu
Password: student123

Email: carol.clark@student.edu
Password: student123
```

## 🚀 **Test Your Setup**

### 1. Test Admin Login
1. **Go to your app**: `https://your-app.onrender.com`
2. **Login with**: `admin@labmanager.com` / `admin123`
3. **Should see**: Admin dashboard with full access

### 2. Test Student Login
1. **Logout from admin**
2. **Login with**: `alice.anderson@student.edu` / `student123`
3. **Should see**: Student dashboard with limited access

### 3. Verify Database
1. **Check users**: Should see 5 users (1 admin, 1 instructor, 3 students)
2. **Check labs**: Should see 2 labs created
3. **Test functionality**: Create classes, assignments, etc.

## 📊 **What You Get**

### Users:
- ✅ **1 Admin** (full system access)
- ✅ **1 Instructor** (can manage classes/labs)
- ✅ **3 Students** (can view assignments/submit work)

### Labs:
- ✅ **Computer Lab A** (30 capacity)
- ✅ **Computer Lab B** (20 capacity)

### Ready for:
- ✅ **Creating classes**
- ✅ **Adding computers to labs**
- ✅ **Enrolling students**
- ✅ **Creating assignments**
- ✅ **Full system testing**

## ⚠️ **Important Security Notes**

### 🔒 **Change Default Passwords**
- **Admin password** is `admin123` - change immediately!
- **Test passwords** are weak - only for testing
- **Don't use in production** with real users

### 🛡️ **Production Security**
- Change all default passwords
- Use strong passwords for real users
- Consider enabling 2FA if available
- Regular security audits

## 🔧 **If SQL Fails**

### Common Issues:
1. **Table doesn't exist**: Run database migrations first
2. **Permission denied**: Check database user permissions
3. **Duplicate key error**: Users already exist (check with SELECT)

### Troubleshooting:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check existing users
SELECT email, role FROM users;

-- Clear users if needed (CAREFUL!)
-- DELETE FROM users; -- Only if you want to start over
```

## 🎉 **Success Indicators**

### ✅ **SQL Ran Successfully If:**
- No error messages in Neon console
- Verification query shows correct counts
- Can login to app with admin credentials

### ✅ **System Working If:**
- Admin dashboard loads
- Can create/view labs
- Can create/view classes
- Student login works with different permissions

## 📞 **Next Steps After SQL Setup**

1. **✅ Login and test** all user roles
2. **✅ Change admin password** immediately
3. **✅ Create additional test data** as needed
4. **✅ Test all major features**
5. **✅ Deploy to production** when ready

**Your LabManager now has working test data!** 🎯
