import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLabSchema, 
  insertUserSchema, 
  insertUserWithRoleSchema,
  insertClassSchema, 
  insertComputerSchema,
  insertGroupSchema,
  insertEnrollmentSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Labs Management
  app.get('/api/labs', async (req, res) => {
    try {
      const labs = await storage.getLabs();
      res.json(labs);
    } catch (error: any) {
      console.error('Error fetching labs:', error);
      res.status(500).json({ error: 'Failed to fetch labs' });
    }
  });

  app.get('/api/labs/:id', async (req, res) => {
    try {
      const lab = await storage.getLab(req.params.id);
      if (!lab) {
        return res.status(404).json({ error: 'Lab not found' });
      }
      res.json(lab);
    } catch (error: any) {
      console.error('Error fetching lab:', error);
      res.status(500).json({ error: 'Failed to fetch lab' });
    }
  });

  app.post('/api/labs', async (req, res) => {
    try {
      const validatedData = insertLabSchema.parse(req.body);
      const lab = await storage.createLab(validatedData);
      res.status(201).json(lab);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid lab data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Lab with this name already exists' });
      }
      console.error('Error creating lab:', error);
      res.status(500).json({ error: 'Failed to create lab' });
    }
  });

  app.patch('/api/labs/:id', async (req, res) => {
    try {
      const validatedData = insertLabSchema.partial().parse(req.body);
      const lab = await storage.updateLab(req.params.id, validatedData);
      if (!lab) {
        return res.status(404).json({ error: 'Lab not found' });
      }
      res.json(lab);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid lab data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Lab with this name already exists' });
      }
      console.error('Error updating lab:', error);
      res.status(500).json({ error: 'Failed to update lab' });
    }
  });

  app.delete('/api/labs/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteLab(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Lab not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.constraint) {
        return res.status(409).json({ error: 'Cannot delete lab: it is referenced by other records' });
      }
      console.error('Error deleting lab:', error);
      res.status(500).json({ error: 'Failed to delete lab' });
    }
  });

  // Instructors Management (Users with instructor role)
  app.get('/api/instructors', async (req, res) => {
    try {
      const instructors = await storage.getUsersByRole('instructor');
      // Remove passwords from response
      const sanitizedInstructors = instructors.map(({ password, ...instructor }) => instructor);
      res.json(sanitizedInstructors);
    } catch (error: any) {
      console.error('Error fetching instructors:', error);
      res.status(500).json({ error: 'Failed to fetch instructors' });
    }
  });

  // SECURITY: POST /api/instructors endpoint temporarily disabled
  // This endpoint allows privilege escalation without proper authentication
  // TODO: Re-enable when authentication system is implemented
  /*
  app.post('/api/instructors', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Create instructor with role
      const instructor = await storage.createUserWithRole({
        ...validatedData,
        role: 'instructor'
      });
      
      // Remove password from response
      const { password, ...instructorResponse } = instructor;
      res.status(201).json(instructorResponse);
    } catch (error: any) {
      console.error('Error creating instructor:', error);
      res.status(400).json({ error: 'Invalid instructor data' });
    }
  });
  */

  // Classes Management
  app.get('/api/classes', async (req, res) => {
    try {
      const { labId, instructorId } = req.query;
      
      let classes;
      if (labId) {
        classes = await storage.getClassesByLab(labId as string);
      } else if (instructorId) {
        classes = await storage.getClassesByInstructor(instructorId as string);
      } else {
        classes = await storage.getClasses();
      }
      
      res.json(classes);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  app.get('/api/classes/:id', async (req, res) => {
    try {
      const classData = await storage.getClass(req.params.id);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }
      res.json(classData);
    } catch (error: any) {
      console.error('Error fetching class:', error);
      res.status(500).json({ error: 'Failed to fetch class' });
    }
  });

  app.post('/api/classes', async (req, res) => {
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const classData = await storage.createClass(validatedData);
      res.status(201).json(classData);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid class data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Class with this code and section already exists for this semester/year' });
      }
      console.error('Error creating class:', error);
      res.status(500).json({ error: 'Failed to create class' });
    }
  });

  app.patch('/api/classes/:id', async (req, res) => {
    try {
      const validatedData = insertClassSchema.partial().parse(req.body);
      const classData = await storage.updateClass(req.params.id, validatedData);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }
      res.json(classData);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid class data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Class with this code and section already exists for this semester/year' });
      }
      console.error('Error updating class:', error);
      res.status(500).json({ error: 'Failed to update class' });
    }
  });

  app.delete('/api/classes/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteClass(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Class not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.constraint) {
        return res.status(409).json({ error: 'Cannot delete class: it is referenced by other records' });
      }
      console.error('Error deleting class:', error);
      res.status(500).json({ error: 'Failed to delete class' });
    }
  });

  // Computers Management
  app.get('/api/labs/:labId/computers', async (req, res) => {
    try {
      const computers = await storage.getComputersByLab(req.params.labId);
      res.json(computers);
    } catch (error: any) {
      console.error('Error fetching computers:', error);
      res.status(500).json({ error: 'Failed to fetch computers' });
    }
  });

  app.post('/api/computers', async (req, res) => {
    try {
      const validatedData = insertComputerSchema.parse(req.body);
      const computer = await storage.createComputer(validatedData);
      res.status(201).json(computer);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid computer data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Computer with this name already exists in this lab' });
      }
      console.error('Error creating computer:', error);
      res.status(500).json({ error: 'Failed to create computer' });
    }
  });

  app.patch('/api/computers/:id', async (req, res) => {
    try {
      const validatedData = insertComputerSchema.partial().parse(req.body);
      const computer = await storage.updateComputer(req.params.id, validatedData);
      if (!computer) {
        return res.status(404).json({ error: 'Computer not found' });
      }
      res.json(computer);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid computer data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Computer with this name already exists in this lab' });
      }
      console.error('Error updating computer:', error);
      res.status(500).json({ error: 'Failed to update computer' });
    }
  });

  app.delete('/api/computers/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteComputer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Computer not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.constraint) {
        return res.status(409).json({ error: 'Cannot delete computer: it is referenced by other records' });
      }
      console.error('Error deleting computer:', error);
      res.status(500).json({ error: 'Failed to delete computer' });
    }
  });

  // Groups Management
  app.get('/api/classes/:classId/groups', async (req, res) => {
    try {
      const groups = await storage.getGroupsByClass(req.params.classId);
      res.json(groups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  app.post('/api/groups', async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid group data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Group with this name already exists in this class' });
      }
      console.error('Error creating group:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  });

  app.patch('/api/groups/:id', async (req, res) => {
    try {
      const validatedData = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, validatedData);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.json(group);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid group data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Group with this name already exists in this class' });
      }
      console.error('Error updating group:', error);
      res.status(500).json({ error: 'Failed to update group' });
    }
  });

  app.delete('/api/groups/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteGroup(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.constraint) {
        return res.status(409).json({ error: 'Cannot delete group: it is referenced by other records' });
      }
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  });

  // Enrollments Management
  app.get('/api/classes/:classId/enrollments', async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByClass(req.params.classId);
      res.json(enrollments);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
  });

  app.post('/api/enrollments', async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(validatedData);
      res.status(201).json(enrollment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid enrollment data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Student is already enrolled in this class' });
      }
      console.error('Error creating enrollment:', error);
      res.status(500).json({ error: 'Failed to create enrollment' });
    }
  });

  app.patch('/api/enrollments/:id', async (req, res) => {
    try {
      const validatedData = insertEnrollmentSchema.partial().parse(req.body);
      const enrollment = await storage.updateEnrollment(req.params.id, validatedData);
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      res.json(enrollment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid enrollment data', details: error.errors });
      }
      if (error.constraint) {
        return res.status(409).json({ error: 'Student is already enrolled in this class' });
      }
      console.error('Error updating enrollment:', error);
      res.status(500).json({ error: 'Failed to update enrollment' });
    }
  });

  app.delete('/api/enrollments/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteEnrollment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      if (error.constraint) {
        return res.status(409).json({ error: 'Cannot delete enrollment: it is referenced by other records' });
      }
      console.error('Error deleting enrollment:', error);
      res.status(500).json({ error: 'Failed to delete enrollment' });
    }
  });

  // Students Management
  app.get('/api/students', async (req, res) => {
    try {
      const students = await storage.getUsersByRole('student');
      // Remove passwords from response
      const studentsResponse = students.map(({ password, ...student }) => student);
      res.json(studentsResponse);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  app.get('/api/students/:id', async (req, res) => {
    try {
      const student = await storage.getUser(req.params.id);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Remove password from response
      const { password, ...studentResponse } = student;
      res.json(studentResponse);
    } catch (error: any) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  });

  app.post('/api/students', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      // Create student with role (default is already student)
      const student = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...studentResponse } = student;
      res.status(201).json(studentResponse);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid student data', details: error.errors });
      }
      if (error.constraint || error.code === '23505') {
        return res.status(409).json({ error: 'Student with this email already exists' });
      }
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  app.patch('/api/students/:id', async (req, res) => {
    try {
      const validatedData = insertUserSchema.partial().parse(req.body);
      const student = await storage.updateUser(req.params.id, validatedData);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Remove password from response
      const { password, ...studentResponse } = student;
      res.json(studentResponse);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid student data', details: error.errors });
      }
      if (error.constraint || error.code === '23505') {
        return res.status(409).json({ error: 'Conflict with existing data' });
      }
      console.error('Error updating student:', error);
      res.status(500).json({ error: 'Failed to update student' });
    }
  });

  app.delete('/api/students/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  app.get('/api/students/:id/enrollments', async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByStudent(req.params.id);
      res.json(enrollments);
    } catch (error: any) {
      console.error('Error fetching student enrollments:', error);
      res.status(500).json({ error: 'Failed to fetch student enrollments' });
    }
  });

  // Users (General)
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Admin/Development endpoints
  app.post('/api/admin/seed', async (req, res) => {
    try {
      // Create sample labs
      const labA = await storage.createLab({
        name: "Lab A - Chemistry", 
        description: "Advanced Chemistry Laboratory",
        location: "Building A, Room 101",
        capacity: 20
      });
      
      const labB = await storage.createLab({
        name: "Lab B - Biology", 
        description: "Biology Research Laboratory",
        location: "Building B, Room 201", 
        capacity: 24
      });

      // Create sample instructors
      const drSmith = await storage.createUserWithRole({
        email: "dr.smith@university.edu",
        password: "instructor123",
        firstName: "Dr. Sarah",
        lastName: "Smith",
        role: "instructor"
      });

      const profJohnson = await storage.createUserWithRole({
        email: "prof.johnson@university.edu", 
        password: "instructor123",
        firstName: "Prof. Michael",
        lastName: "Johnson",
        role: "instructor"
      });

      // Create sample classes
      const chemClass = await storage.createClass({
        name: "Advanced Chemistry",
        code: "CHEM401",
        section: "A1", 
        labId: labA.id,
        instructorId: drSmith.id,
        semester: "Fall",
        year: 2024
      });

      const bioClass = await storage.createClass({
        name: "Molecular Biology",
        code: "BIO301", 
        section: "B1",
        labId: labB.id,
        instructorId: profJohnson.id,
        semester: "Fall", 
        year: 2024
      });

      // Create sample computers
      for (let i = 1; i <= 5; i++) {
        await storage.createComputer({
          name: `CHEM-PC-${i.toString().padStart(2, '0')}`,
          labId: labA.id,
          specs: "Intel i7, 16GB RAM, Windows 11"
        });
      }

      for (let i = 1; i <= 6; i++) {
        await storage.createComputer({
          name: `BIO-PC-${i.toString().padStart(2, '0')}`, 
          labId: labB.id,
          specs: "Intel i5, 8GB RAM, Windows 11"
        });
      }

      // Create sample students
      const students = [];
      for (let i = 1; i <= 8; i++) {
        const student = await storage.createUser({
          email: `student${i}@university.edu`,
          password: "student123", 
          firstName: `Student${i}`,
          lastName: "Test"
        });
        students.push(student);
      }

      res.status(201).json({ 
        message: 'Sample data created successfully',
        created: {
          labs: 2,
          instructors: 2, 
          classes: 2,
          computers: 11,
          students: 8
        }
      });
    } catch (error: any) {
      console.error('Error seeding database:', error);
      res.status(500).json({ error: 'Failed to seed database', details: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
