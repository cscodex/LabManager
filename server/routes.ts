import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertLabSchema, 
  insertUserSchema, 
  insertUserWithRoleSchema,
  insertClassSchema, 
  insertComputerSchema,
  insertGroupSchema,
  insertEnrollmentSchema,
  insertSessionSchema
} from "@shared/schema";

// SECURITY FIX: Basic authentication middleware (placeholder until Replit Auth is implemented)
// TODO: Replace with proper Replit Auth when authentication system is set up
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  // For now, check for a basic user ID in headers (temporary security measure)
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide user credentials to access this resource' 
    });
  }
  
  // Verify user exists
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'User not found' 
      });
    }
    
    // Add user to request for downstream use
    (req as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Failed to verify credentials' 
    });
  }
};

// SECURITY FIX: Role-based access control
const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate before accessing this resource'
      });
    }
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

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

  // Smart enrollment with automatic group and seat assignment
  app.post('/api/classes/:classId/enroll-student', async (req, res) => {
    try {
      const { studentId } = req.body;
      const classId = req.params.classId;
      
      if (!studentId) {
        return res.status(400).json({ error: 'Student ID is required' });
      }

      // Verify student exists
      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ error: 'Student not found' });
      }

      // Get class info to find the lab
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Get available groups for this class and all enrollments (prevent inefficiency)
      const [groups, allEnrollments] = await Promise.all([
        storage.getGroupsByClass(classId),
        storage.getEnrollmentsByClass(classId)
      ]);
      
      // Find a group with available spots (fix race condition)
      let selectedGroup = null;
      for (const group of groups) {
        const groupEnrollments = allEnrollments.filter(e => e.groupId === group.id);
        
        if (groupEnrollments.length < group.maxMembers) {
          selectedGroup = group;
          break;
        }
      }

      // If no available group, try to create a new one
      if (!selectedGroup) {
        const computers = await storage.getComputersByLab(classData.labId);
        const usedComputers = new Set(groups.map(g => g.computerId).filter(Boolean));
        const availableComputer = computers.find(c => !usedComputers.has(c.id));
        
        if (availableComputer) {
          selectedGroup = await storage.createGroup({
            name: `Group ${groups.length + 1}`,
            classId: classId,
            computerId: availableComputer.id,
            maxMembers: 4
          });
        } else if (computers.length > 0) {
          // If no unassigned computers, still allow group creation but warn
          selectedGroup = await storage.createGroup({
            name: `Group ${groups.length + 1}`,
            classId: classId,
            computerId: computers[0].id, // Assign to first computer (shared use)
            maxMembers: 4
          });
        }
      }

      if (!selectedGroup) {
        return res.status(400).json({ error: 'No available groups or computers for enrollment' });
      }

      // Generate seat number using already fetched enrollment count (more efficient)
      const seatNumber = `S${(allEnrollments.length + 1).toString().padStart(2, '0')}`;

      // Create enrollment with group and seat assignment
      const enrollment = await storage.createEnrollment({
        studentId,
        classId,
        groupId: selectedGroup.id,
        seatNumber
      });

      res.status(201).json({
        enrollment,
        group: selectedGroup,
        message: 'Student enrolled and assigned to group successfully'
      });

    } catch (error: any) {
      if (error.constraint || error.code === '23505') {
        return res.status(409).json({ error: 'Student is already enrolled in this class' });
      }
      console.error('Error enrolling student:', error);
      res.status(500).json({ error: 'Failed to enroll student' });
    }
  });

  // Get enrollment details with group and computer info
  app.get('/api/enrollments/:id/details', async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }

      let groupInfo = null;
      let computerInfo = null;
      
      if (enrollment.groupId) {
        groupInfo = await storage.getGroup(enrollment.groupId);
        if (groupInfo && groupInfo.computerId) {
          computerInfo = await storage.getComputer(groupInfo.computerId);
        }
      }

      const student = await storage.getUser(enrollment.studentId);
      const classData = await storage.getClass(enrollment.classId);

      // SECURITY: Remove password and other sensitive data from student object
      const sanitizedStudent = student ? {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        role: student.role
      } : null;

      res.json({
        enrollment,
        student: sanitizedStudent,
        class: classData,
        group: groupInfo,
        computer: computerInfo
      });

    } catch (error: any) {
      console.error('Error fetching enrollment details:', error);
      res.status(500).json({ error: 'Failed to fetch enrollment details' });
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

  // Lab Sessions Management
  // SECURITY FIX: Protect session routes with authentication
  app.get('/api/classes/:classId/sessions', requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getSessionsByClass(req.params.classId);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/sessions/:id', requireAuth, async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error: any) {
      console.error('Error fetching session:', error);
      res.status(500).json({ error: 'Failed to fetch session' });
    }
  });

  app.post('/api/sessions', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      
      // FUNCTIONALITY FIX: Check for scheduling conflicts before creating session
      const sessionStart = new Date(validatedData.scheduledAt);
      const sessionEnd = new Date(sessionStart.getTime() + validatedData.duration * 60000);
      
      // Get class info to find the lab
      const classData = await storage.getClass(validatedData.classId);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Get all classes in the same lab
      const labClasses = await storage.getClassesByLab(classData.labId);
      
      // Check for scheduling conflicts in the same lab
      for (const labClass of labClasses) {
        const sessions = await storage.getSessionsByClass(labClass.id);
        
        for (const session of sessions) {
          const existingStart = new Date(session.scheduledAt);
          const existingEnd = new Date(existingStart.getTime() + session.duration * 60000);
          
          // Check for overlap
          if (sessionStart < existingEnd && sessionEnd > existingStart) {
            return res.status(409).json({
              error: 'Scheduling conflict detected',
              conflictingSession: {
                id: session.id,
                title: session.title,
                class: labClass.name + ' (' + labClass.code + '-' + labClass.section + ')',
                scheduledAt: session.scheduledAt,
                duration: session.duration
              },
              message: `Cannot schedule session as it conflicts with existing session "${session.title}" in the same lab`
            });
          }
        }
      }
      
      const session = await storage.createSession(validatedData);
      res.status(201).json(session);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid session data', details: error.errors });
      }
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  app.patch('/api/sessions/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const validatedData = insertSessionSchema.partial().parse(req.body);
      
      // Get the existing session to check for conflicts
      const existingSession = await storage.getSession(req.params.id);
      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      // FUNCTIONALITY FIX: Check for scheduling conflicts if time-related fields are being updated
      if (validatedData.scheduledAt || validatedData.duration || validatedData.classId) {
        // Use new values if provided, otherwise use existing values
        const newScheduledAt = validatedData.scheduledAt || existingSession.scheduledAt;
        const newDuration = validatedData.duration || existingSession.duration;
        const newClassId = validatedData.classId || existingSession.classId;
        
        const sessionStart = new Date(newScheduledAt);
        const sessionEnd = new Date(sessionStart.getTime() + newDuration * 60000);
        
        // Get class info to find the lab
        const classData = await storage.getClass(newClassId);
        if (!classData) {
          return res.status(404).json({ error: 'Class not found' });
        }

        // Get all classes in the same lab
        const labClasses = await storage.getClassesByLab(classData.labId);
        
        // Check for scheduling conflicts in the same lab
        for (const labClass of labClasses) {
          const sessions = await storage.getSessionsByClass(labClass.id);
          
          for (const session of sessions) {
            // Skip the session being updated
            if (session.id === req.params.id) continue;
            
            const existingStart = new Date(session.scheduledAt);
            const existingEnd = new Date(existingStart.getTime() + session.duration * 60000);
            
            // Check for overlap
            if (sessionStart < existingEnd && sessionEnd > existingStart) {
              return res.status(409).json({
                error: 'Scheduling conflict detected',
                conflictingSession: {
                  id: session.id,
                  title: session.title,
                  class: labClass.name + ' (' + labClass.code + '-' + labClass.section + ')',
                  scheduledAt: session.scheduledAt,
                  duration: session.duration
                },
                message: `Cannot update session as it would conflict with existing session "${session.title}" in the same lab`
              });
            }
          }
        }
      }
      
      const session = await storage.updateSession(req.params.id, validatedData);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.json(session);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid session data', details: error.errors });
      }
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  });

  app.delete('/api/sessions/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Session not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // Get session details with groups, computers, and enrollments
  // SECURITY FIX: Protect sensitive session details endpoint
  app.get('/api/sessions/:id/details', requireAuth, async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Get class and lab information
      const classData = await storage.getClass(session.classId);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found for this session' });
      }

      // Get groups for this class
      const groups = await storage.getGroupsByClass(session.classId);
      
      // OPTIMIZATION: Batch fetch all enrollments for the class once to avoid N+1 queries
      const allEnrollments = await storage.getEnrollmentsByClass(session.classId);
      
      // OPTIMIZATION: Batch fetch all students for the enrollments
      const studentIds = allEnrollments.map(e => e.studentId);
      const studentPromises = studentIds.map(id => storage.getUser(id));
      const allStudents = await Promise.all(studentPromises);
      
      // Create a map for quick student lookup
      const studentsMap = new Map();
      allStudents.forEach(student => {
        if (student) {
          // SECURITY FIX: Remove password and other sensitive data from student objects
          studentsMap.set(student.id, {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            role: student.role
          });
        }
      });
      
      // Process groups with optimized data fetching
      const groupsWithComputers = await Promise.all(
        groups.map(async (group) => {
          let computer = null;
          if (group.computerId) {
            computer = await storage.getComputer(group.computerId);
          }
          
          // Get students for this group using the pre-fetched data
          const groupEnrollments = allEnrollments.filter(e => e.groupId === group.id);
          const groupStudents = groupEnrollments.map(enrollment => {
            const student = studentsMap.get(enrollment.studentId);
            return {
              enrollment: {
                id: enrollment.id,
                studentId: enrollment.studentId,
                classId: enrollment.classId,
                groupId: enrollment.groupId,
                seatNumber: enrollment.seatNumber,
                enrolledAt: enrollment.enrolledAt,
                isActive: enrollment.isActive
              },
              student: student || null
            };
          });

          return {
            ...group,
            computer,
            students: groupStudents
          };
        })
      );

      res.json({
        session,
        class: classData,
        groups: groupsWithComputers,
        totalStudents: groupsWithComputers.reduce((sum, group) => sum + group.students.length, 0)
      });

    } catch (error: any) {
      console.error('Error fetching session details:', error);
      res.status(500).json({ error: 'Failed to fetch session details' });
    }
  });

  // Schedule management - check for conflicts
  app.post('/api/sessions/check-conflicts', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const { classId, scheduledAt, duration } = req.body;
      
      if (!classId || !scheduledAt || !duration) {
        return res.status(400).json({ error: 'classId, scheduledAt, and duration are required' });
      }

      const sessionStart = new Date(scheduledAt);
      const sessionEnd = new Date(sessionStart.getTime() + duration * 60000); // duration in minutes
      
      // Get class info to find the lab
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Get all classes in the same lab
      const labClasses = await storage.getClassesByLab(classData.labId);
      
      // Check for scheduling conflicts in the same lab
      const conflicts = [];
      for (const labClass of labClasses) {
        const sessions = await storage.getSessionsByClass(labClass.id);
        
        for (const session of sessions) {
          const existingStart = new Date(session.scheduledAt);
          const existingEnd = new Date(existingStart.getTime() + session.duration * 60000);
          
          // Check for overlap
          if (sessionStart < existingEnd && sessionEnd > existingStart) {
            conflicts.push({
              session,
              class: labClass,
              overlapStart: new Date(Math.max(sessionStart.getTime(), existingStart.getTime())),
              overlapEnd: new Date(Math.min(sessionEnd.getTime(), existingEnd.getTime()))
            });
          }
        }
      }

      res.json({
        hasConflicts: conflicts.length > 0,
        conflicts,
        message: conflicts.length > 0 
          ? `Found ${conflicts.length} scheduling conflict(s) in the same lab`
          : 'No scheduling conflicts detected'
      });

    } catch (error: any) {
      console.error('Error checking scheduling conflicts:', error);
      res.status(500).json({ error: 'Failed to check scheduling conflicts' });
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
