# 🔐 Quick Login Reference

## 🚀 **Immediate Testing Credentials**

### 👨‍🏫 **Admin Login** (Auto-created)
```
Email: admin@labmanager.com
Password: admin123
```
**Access**: Full system administration

### 🎯 **Quick Test Steps**
1. **Visit your app**: `https://your-app.onrender.com`
2. **Login with admin credentials** above
3. **Test core functionality**
4. **Create sample data** (see below)

## 📊 **Creating Test Data**

### Option 1: Full Sample Data (Recommended)
1. **Login as admin**
2. **Make POST request** to `/api/admin/seed`
3. **Creates**: 3 labs, 15 students, 3 instructors, 4 classes

### Option 2: Basic Test Users
1. **Run locally**: `npm run create-test-users`
2. **Creates**: 1 admin, 1 instructor, 3 students

## 👥 **Additional Test Accounts** (After Seeding)

### Instructors
- `john.smith@school.edu` / `password123`
- `sarah.johnson@school.edu` / `password123`
- `mike.davis@school.edu` / `password123`

### Students (Sample)
- `alice.anderson@student.edu` / `student123`
- `bob.brown@student.edu` / `student123`
- `carol.clark@student.edu` / `student123`

## 🔧 **Testing Checklist**

- [ ] ✅ App loads successfully
- [ ] ✅ Admin login works
- [ ] ✅ Dashboard displays correctly
- [ ] ✅ Can create/view labs
- [ ] ✅ Can create/view classes
- [ ] ✅ Database operations work
- [ ] ✅ Student login works (after creating accounts)

## ⚠️ **Security Reminder**

**CHANGE DEFAULT PASSWORDS IN PRODUCTION!**
- Default admin password is `admin123`
- Change immediately after first login
- Use strong passwords for real users

## 📞 **Need Help?**

- **Full Documentation**: See `LOGIN_CREDENTIALS.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Deployment Issues**: See `DEPLOYMENT_STATUS.md`

**Ready to test your deployed LabManager application!** 🎉
