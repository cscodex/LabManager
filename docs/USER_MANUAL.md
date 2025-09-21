## LabManager - User Manual (v1)

Audience: Instructors (Admins) and Students

---

### Sign in
- Use your provided email and password
- Roles:
  - Instructor: full management access (acts as admin)
  - Student: can view assignments, submit work

---

### Navigation
- Students: Manage student roster, profiles, bulk operations
- Groups: Create/assign groups to Labs and Computers
- Submissions: Track assignment submissions and grades
- Settings: Account, preferences, security, and Admin tools

---

### Students
1) Add Student
- Click “Add Student”
- Fill profile: First/Last name, Email, Grade (11/12), Trade (NM/M/C), Section
- Click “Create”. Note: UI supplies a default password “student123” for new accounts (change later)

2) Edit Student
- Click the row’s ••• menu → Edit
- Update profile fields → Update Student

3) Delete Student
- Select one row → ••• menu → Delete, confirm
- Or select multiple via checkboxes → Bulk Delete

4) Enroll / Unenroll
- ••• menu → Enroll in Class (if your build still shows enrollments)
- To remove, use Unenroll on the enrollment chip
  Note: The app primarily uses profile-based class (Grade + Trade + Section). Enrollment features are legacy/optional.

5) Filters
- Use the top filters to slice by Grade, Trade, Section, Gender
- “Select All / Clear All” to quickly apply/reset

6) Bulk Edit Profiles
- Select multiple students → Bulk Edit Profiles
- Choose Grade, Trade, Section → Apply to N students

7) Remove Orphans (incomplete profiles)
- Settings → Admin Tools → “Remove orphan students” (Safe or Force)
  - Safe: Deletes only students without enrollments
  - Force: Deletes regardless of enrollments

---

### Groups
1) Create a Group
- Choose a Class (Grade/Trade/Section). Students with matching profile appear
- Choose a Lab. Available computers in that lab are listed
  - Legacy data: computers missing status are treated as available
- Assign students and a computer → Save

2) Reassign Computer
- Open group → Change computer
- Lists available computers in the selected lab, excluding ones assigned to other groups

3) Tips
- If no computers are shown, verify:
  - Lab is selected
  - Computers exist in that lab
  - Computer status is “available” (or missing for legacy. Both are shown)

---

### Submissions
- Students upload assignment files and view grades
- Instructors review and grade
- If your build shows placeholders, the UI is complete; backend integration may vary per deployment. Contact admin if submission upload is disabled.

---

### Settings
- Profile fields (if enabled by your deployment)
- Notifications and security toggles
- Theme: Light/Dark
- Admin Tools:
  - Remove orphan students: Safe/Force

Save button
- Click “Save Changes” to commit UI preferences; a confirmation toast will appear

---

### Known Notes / Limitations
- Session completion tracking: visible in APIs but not fully implemented in UI yet
- Enrollment features are kept for compatibility; class assignment primarily uses profile fields
- Default password for UI-created students is “student123” (change via your auth system)

---

### Troubleshooting
- Students don’t appear after selecting class when creating a group
  - Ensure their profiles (Grade/Trade/Section) are complete
- No computers shown after selecting lab
  - Verify lab has computers; status should be available (null/undefined treated as available)
- Add Student fails
  - Ensure unique email; try again. If still failing, contact admin/logs

---

### Support
- For issues or feature requests, contact the system administrator or file a ticket in your project tracker.

