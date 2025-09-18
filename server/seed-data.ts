import { storage } from "./storage";

export async function seedTestData() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create test labs
    console.log("Creating labs...");
    const lab1 = await storage.createLab({
      name: "Computer Lab A",
      description: "Main computer laboratory with 30 workstations",
      location: "Building A, Ground Floor",
      capacity: 30
    });

    const lab2 = await storage.createLab({
      name: "Computer Lab B", 
      description: "Secondary computer laboratory with 20 workstations",
      location: "Building B, First Floor",
      capacity: 20
    });

    const lab3 = await storage.createLab({
      name: "Programming Lab",
      description: "Specialized programming laboratory with advanced hardware",
      location: "Building A, Second Floor", 
      capacity: 25
    });

    console.log("✅ Labs created successfully");

    // Create test users (instructors and students)
    console.log("Creating users...");
    
    // Create instructors
    const instructor1 = await storage.createUserWithRole({
      email: "john.smith@school.edu",
      password: "password123",
      firstName: "John",
      lastName: "Smith",
      role: "instructor"
    });

    const instructor2 = await storage.createUserWithRole({
      email: "sarah.johnson@school.edu", 
      password: "password123",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "instructor"
    });

    const instructor3 = await storage.createUserWithRole({
      email: "mike.davis@school.edu",
      password: "password123", 
      firstName: "Mike",
      lastName: "Davis",
      role: "instructor"
    });

    // Create students
    const students = [];
    const studentData = [
      { firstName: "Alice", lastName: "Anderson", email: "alice.anderson@student.edu" },
      { firstName: "Bob", lastName: "Brown", email: "bob.brown@student.edu" },
      { firstName: "Carol", lastName: "Clark", email: "carol.clark@student.edu" },
      { firstName: "David", lastName: "Davis", email: "david.davis@student.edu" },
      { firstName: "Eva", lastName: "Evans", email: "eva.evans@student.edu" },
      { firstName: "Frank", lastName: "Foster", email: "frank.foster@student.edu" },
      { firstName: "Grace", lastName: "Green", email: "grace.green@student.edu" },
      { firstName: "Henry", lastName: "Harris", email: "henry.harris@student.edu" },
      { firstName: "Ivy", lastName: "Irving", email: "ivy.irving@student.edu" },
      { firstName: "Jack", lastName: "Jackson", email: "jack.jackson@student.edu" },
      { firstName: "Kate", lastName: "Kelly", email: "kate.kelly@student.edu" },
      { firstName: "Leo", lastName: "Lewis", email: "leo.lewis@student.edu" },
      { firstName: "Mia", lastName: "Miller", email: "mia.miller@student.edu" },
      { firstName: "Noah", lastName: "Nelson", email: "noah.nelson@student.edu" },
      { firstName: "Olivia", lastName: "Owen", email: "olivia.owen@student.edu" }
    ];

    for (const studentInfo of studentData) {
      const student = await storage.createUser({
        email: studentInfo.email,
        password: "student123",
        firstName: studentInfo.firstName,
        lastName: studentInfo.lastName
      });
      students.push(student);
    }

    console.log("✅ Users created successfully");

    // Create computers for labs
    console.log("Creating computers...");
    
    // Computers for Lab A
    for (let i = 1; i <= 15; i++) {
      await storage.createComputer({
        name: `PC-A${i.toString().padStart(2, '0')}`,
        labId: lab1.id,
        specs: "Intel i7, 16GB RAM, 512GB SSD, Windows 11"
      });
    }

    // Computers for Lab B  
    for (let i = 1; i <= 10; i++) {
      await storage.createComputer({
        name: `PC-B${i.toString().padStart(2, '0')}`,
        labId: lab2.id,
        specs: "Intel i5, 8GB RAM, 256GB SSD, Windows 11"
      });
    }

    // Computers for Programming Lab
    for (let i = 1; i <= 12; i++) {
      await storage.createComputer({
        name: `PC-P${i.toString().padStart(2, '0')}`,
        labId: lab3.id,
        specs: "Intel i9, 32GB RAM, 1TB SSD, Ubuntu 22.04"
      });
    }

    console.log("✅ Computers created successfully");

    // Create classes
    console.log("Creating classes...");
    
    const currentYear = new Date().getFullYear();
    const currentSemester = "Fall";

    const class1 = await storage.createClass({
      name: "Computer Programming I",
      code: "CS101",
      gradeLevel: 11,
      tradeType: "NM",
      section: "A", 
      labId: lab1.id,
      instructorId: instructor1.id,
      semester: currentSemester,
      year: currentYear
    });

    const class2 = await storage.createClass({
      name: "Computer Programming I",
      code: "CS101", 
      gradeLevel: 11,
      tradeType: "NM",
      section: "B",
      labId: lab2.id,
      instructorId: instructor2.id,
      semester: currentSemester,
      year: currentYear
    });

    const class3 = await storage.createClass({
      name: "Advanced Programming",
      code: "CS201",
      gradeLevel: 12,
      tradeType: "NM", 
      section: "A",
      labId: lab3.id,
      instructorId: instructor3.id,
      semester: currentSemester,
      year: currentYear
    });

    const class4 = await storage.createClass({
      name: "Data Structures",
      code: "CS202",
      gradeLevel: 12,
      tradeType: "M",
      section: "A",
      labId: lab1.id,
      instructorId: instructor1.id,
      semester: currentSemester,
      year: currentYear
    });

    console.log("✅ Classes created successfully");

    // Create timetables for classes
    console.log("Creating timetables...");
    
    // Class 1 schedule: Monday, Wednesday, Friday 9:00-10:30
    await storage.createTimetable({
      classId: class1.id,
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "10:30",
      labId: lab1.id
    });

    await storage.createTimetable({
      classId: class1.id, 
      dayOfWeek: 3, // Wednesday
      startTime: "09:00",
      endTime: "10:30",
      labId: lab1.id
    });

    await storage.createTimetable({
      classId: class1.id,
      dayOfWeek: 5, // Friday
      startTime: "09:00", 
      endTime: "10:30",
      labId: lab1.id
    });

    // Class 2 schedule: Tuesday, Thursday 11:00-12:30
    await storage.createTimetable({
      classId: class2.id,
      dayOfWeek: 2, // Tuesday
      startTime: "11:00",
      endTime: "12:30",
      labId: lab2.id
    });

    await storage.createTimetable({
      classId: class2.id,
      dayOfWeek: 4, // Thursday  
      startTime: "11:00",
      endTime: "12:30",
      labId: lab2.id
    });

    // Class 3 schedule: Monday, Wednesday 14:00-15:30
    await storage.createTimetable({
      classId: class3.id,
      dayOfWeek: 1, // Monday
      startTime: "14:00",
      endTime: "15:30", 
      labId: lab3.id
    });

    await storage.createTimetable({
      classId: class3.id,
      dayOfWeek: 3, // Wednesday
      startTime: "14:00",
      endTime: "15:30",
      labId: lab3.id  
    });

    // Class 4 schedule: Tuesday, Thursday 15:30-17:00
    await storage.createTimetable({
      classId: class4.id,
      dayOfWeek: 2, // Tuesday
      startTime: "15:30",
      endTime: "17:00",
      labId: lab1.id
    });

    await storage.createTimetable({
      classId: class4.id,
      dayOfWeek: 4, // Thursday
      startTime: "15:30", 
      endTime: "17:00",
      labId: lab1.id
    });

    console.log("✅ Timetables created successfully");

    // Get computers to assign to groups
    const lab1Computers = await storage.getComputersByLab(lab1.id);
    const lab2Computers = await storage.getComputersByLab(lab2.id);
    const lab3Computers = await storage.getComputersByLab(lab3.id);

    // Create groups for classes
    console.log("Creating groups...");
    
    // Groups for Class 1 (CS101 Section A)
    const groups1 = [];
    for (let i = 1; i <= 4; i++) {
      const group = await storage.createGroup({
        name: `Group ${i}`,
        classId: class1.id,
        computerId: lab1Computers[i - 1]?.id,
        maxMembers: 4
      });
      groups1.push(group);
    }

    // Groups for Class 2 (CS101 Section B)
    const groups2 = [];
    for (let i = 1; i <= 3; i++) {
      const group = await storage.createGroup({
        name: `Group ${i}`,
        classId: class2.id,
        computerId: lab2Computers[i - 1]?.id,
        maxMembers: 4
      });
      groups2.push(group);
    }

    console.log("✅ Groups created successfully");

    // Enroll students in classes
    console.log("Creating enrollments...");
    
    // Enroll first 8 students in Class 1
    for (let i = 0; i < 8 && i < students.length; i++) {
      const groupIndex = Math.floor(i / 2); // 2 students per group
      await storage.createEnrollment({
        studentId: students[i].id,
        classId: class1.id,
        groupId: groups1[groupIndex]?.id,
        seatNumber: `S${i + 1}`
      });
    }

    // Enroll next 6 students in Class 2
    for (let i = 8; i < 14 && i < students.length; i++) {
      const groupIndex = Math.floor((i - 8) / 2); // 2 students per group
      await storage.createEnrollment({
        studentId: students[i].id,
        classId: class2.id,
        groupId: groups2[groupIndex]?.id,
        seatNumber: `S${i - 7}`
      });
    }

    // Enroll last student in Class 3
    if (students.length > 14) {
      await storage.createEnrollment({
        studentId: students[14].id,
        classId: class3.id,
        seatNumber: "S1"
      });
    }

    console.log("✅ Enrollments created successfully");

    console.log("🎉 Database seeding completed successfully!");
    console.log(`
📊 Summary:
- 3 Labs created
- 3 Instructors created
- ${students.length} Students created  
- 37 Computers created
- 4 Classes created
- 9 Timetable entries created
- 7 Groups created
- ${Math.min(15, students.length)} Enrollments created
`);

    return {
      labs: [lab1, lab2, lab3],
      instructors: [instructor1, instructor2, instructor3],
      students,
      classes: [class1, class2, class3, class4]
    };

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTestData()
    .then(() => {
      console.log("Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}