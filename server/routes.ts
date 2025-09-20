import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireRole } from "./auth";
import { 
  insertLabSchema, 
  insertUserSchema, 
  insertUserWithRoleSchema,
  insertClassSchema, 
  insertComputerSchema,
  insertGroupSchema,
  insertEnrollmentSchema,
  insertSessionSchema,
  insertAssignmentSchema,
  insertSubmissionSchema,
  insertGradeSchema,
  insertTimetableSchema
} from "@shared/schema";

// Authentication middleware is now handled by auth.ts

// SECURITY FIX: Authorization helpers
const validateSubmissionOwnership = async (submissionId: string, userId: string, userRole: string): Promise<boolean> => {
  const submission = await storage.getSubmission(submissionId);
  if (!submission) return false;
  
  if (userRole === 'student') {
    return submission.studentId === userId;
  } else if (userRole === 'instructor') {
    // Instructor can access if they teach the class this assignment belongs to
    const assignment = await storage.getAssignment(submission.assignmentId);
    if (!assignment) return false;
    
    const session = await storage.getSession(assignment.sessionId);
    if (!session) return false;
    
    const classData = await storage.getClass(session.classId);
    return classData?.instructorId === userId;
  }
  return false;
};

const validateGradeAccess = async (submissionId: string, userId: string, userRole: string): Promise<boolean> => {
  // Use same logic as submission ownership for grade access
  return await validateSubmissionOwnership(submissionId, userId, userRole);
};

const validateInstructorOwnsSession = async (sessionId: string, instructorId: string): Promise<boolean> => {
  const session = await storage.getSession(sessionId);
  if (!session) return false;
  
  const classData = await storage.getClass(session.classId);
  return classData?.instructorId === instructorId;
};

const validateStudentEnrollment = async (studentId: string, assignmentId: string): Promise<boolean> => {
  const assignment = await storage.getAssignment(assignmentId);
  if (!assignment) return false;
  
  const session = await storage.getSession(assignment.sessionId);
  if (!session) return false;
  
  const enrollments = await storage.getEnrollmentsByClass(session.classId);
  return enrollments.some(enrollment => enrollment.studentId === studentId && enrollment.isActive);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Health check endpoint for deployment monitoring
  app.get('/api/health', async (req, res) => {
    try {
      // Test database connection
      await storage.getLabs();
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error: any) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      });
    }
  });

  // Labs Management
  app.get('/api/labs', requireAuth, async (req, res) => {
    try {
      const labs = await storage.getLabs();
      res.json(labs);
    } catch (error: any) {
      console.error('Error fetching labs:', error);
      res.status(500).json({ error: 'Failed to fetch labs' });
    }
  });

  app.get('/api/labs/:id', requireAuth, async (req, res) => {
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

  app.post('/api/labs', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.patch('/api/labs/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.delete('/api/labs/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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
  app.get('/api/instructors', requireAuth, async (req, res) => {
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


  // Classes Management
  app.get('/api/classes', requireAuth, async (req, res) => {
    try {
      const { labId, instructorId, gradeLevel, tradeType } = req.query;
      
      let classes;
      if (labId) {
        classes = await storage.getClassesByLab(labId as string);
      } else if (instructorId) {
        classes = await storage.getClassesByInstructor(instructorId as string);
      } else if (gradeLevel && tradeType) {
        classes = await storage.getClassesByGradeAndTrade(parseInt(gradeLevel as string), tradeType as string);
      } else {
        classes = await storage.getClasses();
      }
      
      res.json(classes);
    } catch (error: any) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ error: 'Failed to fetch classes' });
    }
  });

  app.get('/api/classes/:id', requireAuth, async (req, res) => {
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

  app.post('/api/classes', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.patch('/api/classes/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      // For partial updates, we'll validate manually to avoid schema issues
      const validatedData = req.body;
      // TODO: Add proper partial validation once Zod schema refine issues are resolved
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

  app.delete('/api/classes/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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
  app.get('/api/labs/:labId/computers', requireAuth, async (req, res) => {
    try {
      const computers = await storage.getComputersByLab(req.params.labId);
      res.json(computers);
    } catch (error: any) {
      console.error('Error fetching computers:', error);
      res.status(500).json({ error: 'Failed to fetch computers' });
    }
  });

  app.post('/api/computers', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.patch('/api/computers/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.delete('/api/computers/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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
  app.get('/api/groups', requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAllGroups();
      res.json(groups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  app.get('/api/groups/details', requireAuth, async (req, res) => {
    try {
      const groupsWithDetails = await storage.getGroupsWithDetails();
      res.json(groupsWithDetails);
    } catch (error: any) {
      console.error('Error fetching groups with details:', error);
      res.status(500).json({ error: 'Failed to fetch groups with details' });
    }
  });

  app.get('/api/classes/:classId/groups', requireAuth, async (req, res) => {
    try {
      const groups = await storage.getGroupsByClass(req.params.classId);
      res.json(groups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      res.status(500).json({ error: 'Failed to fetch groups' });
    }
  });

  app.post('/api/groups', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const { studentIds, ...groupData } = validatedData;
      
      let group;
      if (studentIds && studentIds.length > 0) {
        // Create group with student assignments
        group = await storage.createGroupWithStudents(groupData, studentIds);
      } else {
        // Create group without students
        group = await storage.createGroup(groupData);
      }
      
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

  app.patch('/api/groups/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.delete('/api/groups/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  // Group member management endpoints
  app.post('/api/groups/:id/members', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      // Zod validation
      const memberSchema = z.object({
        studentId: z.string().uuid('Invalid student ID format')
      });
      
      const { studentId } = memberSchema.parse(req.body);
      
      // Ownership verification - ensure instructor owns the class
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      const classInfo = await storage.getClass(group.classId);
      if (!classInfo) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      if (classInfo.instructorId !== req.user!.id) {
        return res.status(403).json({ error: 'You can only modify groups in your own classes' });
      }

      await storage.addGroupMember(req.params.id, studentId);
      res.json({ message: 'Member added successfully' });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid input data', details: error.errors });
      }
      console.error('Error adding group member:', error);
      res.status(400).json({ error: error.message || 'Failed to add member' });
    }
  });

  app.delete('/api/groups/:id/members/:studentId', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      // Ownership verification - ensure instructor owns the class
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      const classInfo = await storage.getClass(group.classId);
      if (!classInfo) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      if (classInfo.instructorId !== req.user!.id) {
        return res.status(403).json({ error: 'You can only modify groups in your own classes' });
      }

      await storage.removeGroupMember(req.params.id, req.params.studentId);
      res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
      console.error('Error removing group member:', error);
      res.status(400).json({ error: error.message || 'Failed to remove member' });
    }
  });

  // Students Management - Get all students (instructors) or current student info (students)
  app.get('/api/students', requireAuth, async (req, res) => {
    try {
      const userRole = req.user?.role;
      
      if (userRole === 'instructor') {
        // Instructors can see all students
        const students = await storage.getUsersByRole('student');
        // Remove passwords from response for security
        const sanitizedStudents = students.map(({ password, ...student }) => student);
        res.json(sanitizedStudents);
      } else if (userRole === 'student') {
        // Students can only see their own information
        const { password, ...currentStudent } = req.user!;
        res.json([currentStudent]);
      } else {
        res.status(403).json({ error: 'Insufficient permissions', message: 'You don\'t have permission to access this resource' });
      }
    } catch (error: any) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  // Bulk import students
  app.post('/api/students/bulk-import', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const { students } = req.body;
      
      if (!Array.isArray(students) || students.length === 0) {
        return res.status(400).json({ error: 'Invalid request', message: 'Students array is required and must not be empty' });
      }

      const results: {
        imported: number;
        errors: string[];
      } = {
        imported: 0,
        errors: []
      };

      for (let i = 0; i < students.length; i++) {
        try {
          // Validate each student data - add default password if not provided
          const studentData = {
            ...students[i],
            role: 'student',
            password: students[i].password || 'student123' // Default password for CSV imports
          };
          
          const validatedData = insertUserWithRoleSchema.parse(studentData);
          
          // Create the student
          await storage.createUser(validatedData);
          results.imported++;
        } catch (error: any) {
          if (error.name === 'ZodError') {
            results.errors.push(`Student ${i + 1}: ${error.errors.map((e: any) => e.message).join(', ')}`);
          } else if (error.constraint && error.constraint.includes('unique')) {
            results.errors.push(`Student ${i + 1}: Email already exists`);
          } else {
            results.errors.push(`Student ${i + 1}: ${error.message || 'Unknown error'}`);
          }
        }
      }

      if (results.errors.length > 0) {
        return res.status(207).json({
          message: `Partial success: ${results.imported} students imported, ${results.errors.length} failed`,
          imported: results.imported,
          errors: results.errors
        });
      }

      res.status(201).json({
        message: `Successfully imported ${results.imported} students`,
        imported: results.imported
      });
    } catch (error: any) {
      console.error('Error bulk importing students:', error);
      res.status(500).json({ error: 'Failed to import students', message: error.message });
    }
  });

  // Enrollments with detailed information
  app.get('/api/enrollments/details', requireAuth, async (req, res) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      if (userRole === 'instructor') {
        // Instructors can see all enrollments  
        const classes = await storage.getClasses();
        const allEnrollments = [];
        
        for (const cls of classes) {
          const enrollments = await storage.getEnrollmentsByClass(cls.id);
          for (const enrollment of enrollments) {
            // Get student info
            const student = await storage.getUser(enrollment.studentId);
            if (!student) continue;
            
            // Get instructor info
            const instructor = await storage.getUser(cls.instructorId);
            
            // Get lab info
            const lab = await storage.getLab(cls.labId);
            
            // Get group and computer info if available
            let group = null;
            let computer = null;
            if (enrollment.groupId) {
              group = await storage.getGroup(enrollment.groupId);
              if (group && group.computerId) {
                computer = await storage.getComputer(group.computerId);
              }
            }
            
            // Count sessions for completion tracking
            const sessions = await storage.getSessionsByClass(cls.id);
            
            allEnrollments.push({
              ...enrollment,
              student: {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email
              },
              class: {
                id: cls.id,
                name: cls.name,
                displayName: cls.displayName,
                gradeLevel: cls.gradeLevel,
                tradeType: cls.tradeType,
                section: cls.section
              },
              instructor: instructor ? {
                id: instructor.id,
                firstName: instructor.firstName,
                lastName: instructor.lastName
              } : null,
              lab: lab ? {
                name: lab.name
              } : null,
              group: group ? {
                name: group.name
              } : null,
              computer: computer ? {
                name: computer.name
              } : null,
              completedSessions: 0, // TODO: Implement session completion tracking
              totalSessions: sessions.length
            });
          }
        }
        
        res.json(allEnrollments);
      } else if (userRole === 'student') {
        // Students can only see their own enrollments
        const classes = await storage.getClasses();
        const studentEnrollments = [];
        
        for (const cls of classes) {
          const enrollments = await storage.getEnrollmentsByClass(cls.id);
          const studentEnrollment = enrollments.find(e => e.studentId === userId && e.isActive);
          
          if (studentEnrollment) {
            // Get instructor info
            const instructor = await storage.getUser(cls.instructorId);
            
            // Get lab info
            const lab = await storage.getLab(cls.labId);
            
            // Get group and computer info if available
            let group = null;
            let computer = null;
            if (studentEnrollment.groupId) {
              group = await storage.getGroup(studentEnrollment.groupId);
              if (group && group.computerId) {
                computer = await storage.getComputer(group.computerId);
              }
            }
            
            // Count sessions for completion tracking
            const sessions = await storage.getSessionsByClass(cls.id);
            
            studentEnrollments.push({
              ...studentEnrollment,
              student: {
                id: req.user!.id,
                firstName: req.user!.firstName,
                lastName: req.user!.lastName,
                email: req.user!.email
              },
              class: {
                id: cls.id,
                name: cls.name,
                displayName: cls.displayName,
                gradeLevel: cls.gradeLevel,
                tradeType: cls.tradeType,
                section: cls.section
              },
              instructor: instructor ? {
                id: instructor.id,
                firstName: instructor.firstName,
                lastName: instructor.lastName
              } : null,
              lab: lab ? {
                name: lab.name
              } : null,
              group: group ? {
                name: group.name
              } : null,
              computer: computer ? {
                name: computer.name
              } : null,
              completedSessions: 0, // TODO: Implement session completion tracking
              totalSessions: sessions.length
            });
          }
        }
        
        res.json(studentEnrollments);
      } else {
        res.status(403).json({ error: 'Insufficient permissions', message: 'You don\'t have permission to access this resource' });
      }
    } catch (error: any) {
      console.error('Error fetching enrollment details:', error);
      res.status(500).json({ error: 'Failed to fetch enrollment details' });
    }
  });

  // Enrollments Management
  app.get('/api/classes/:classId/enrollments', requireAuth, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByClass(req.params.classId);
      res.json(enrollments);
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
  });

  app.post('/api/enrollments', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.patch('/api/enrollments/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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

  app.delete('/api/enrollments/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
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
  app.post('/api/classes/:classId/enroll-student', requireAuth, requireRole(['instructor']), async (req, res) => {
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
  app.get('/api/enrollments/:id/details', requireAuth, async (req, res) => {
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


  app.get('/api/students/:id/enrollments', requireAuth, async (req, res) => {
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

  // Timetable Management
  app.get('/api/timetables', requireAuth, async (req, res) => {
    try {
      const { classId, labId, dayOfWeek } = req.query;
      
      let timetables;
      if (classId) {
        timetables = await storage.getTimetablesByClass(classId as string);
      } else if (labId) {
        timetables = await storage.getTimetablesByLab(labId as string);
      } else if (dayOfWeek) {
        timetables = await storage.getTimetablesByDay(parseInt(dayOfWeek as string));
      } else {
        timetables = await storage.getTimetables();
      }
      
      res.json(timetables);
    } catch (error: any) {
      console.error('Error fetching timetables:', error);
      res.status(500).json({ error: 'Failed to fetch timetables' });
    }
  });

  app.get('/api/timetables/:id', requireAuth, async (req, res) => {
    try {
      const timetable = await storage.getTimetable(req.params.id);
      if (!timetable) {
        return res.status(404).json({ error: 'Timetable entry not found' });
      }
      res.json(timetable);
    } catch (error: any) {
      console.error('Error fetching timetable:', error);
      res.status(500).json({ error: 'Failed to fetch timetable' });
    }
  });

  app.post('/api/timetables', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const validatedData = insertTimetableSchema.parse(req.body);
      
      // Check for timetable conflicts before creating
      const { hasConflicts, conflictingTimetables } = await storage.checkTimetableConflicts(
        validatedData.labId,
        validatedData.dayOfWeek,
        validatedData.startTime,
        validatedData.endTime,
        undefined,
        validatedData.classId
      );
      
      if (hasConflicts) {
        // Determine conflict type for better error messaging
        const firstConflict = conflictingTimetables[0];
        const isLabConflict = firstConflict.labId === validatedData.labId;
        const isClassConflict = firstConflict.classId === validatedData.classId;
        
        return res.status(409).json({
          error: 'SCHEDULE_CONFLICT',
          conflictType: isClassConflict ? 'class' : 'lab',
          conflicts: conflictingTimetables,
          message: isClassConflict 
            ? 'This class already has a session at this time'
            : 'Lab is already occupied at this time'
        });
      }
      
      const timetable = await storage.createTimetable(validatedData);
      res.status(201).json(timetable);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid timetable data', details: error.errors });
      }
      if (error.message.includes('lab must match')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error creating timetable:', error);
      res.status(500).json({ error: 'Failed to create timetable' });
    }
  });

  app.patch('/api/timetables/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      // For partial updates, validate without refinement constraints
      const validatedData = req.body;
      
      // Check for conflicts if time-related fields are being updated
      if (validatedData.dayOfWeek || validatedData.startTime || validatedData.endTime || validatedData.labId) {
        const currentTimetable = await storage.getTimetable(req.params.id);
        if (!currentTimetable) {
          return res.status(404).json({ error: 'Timetable entry not found' });
        }
        
        const classId = validatedData.classId ?? currentTimetable.classId;
        const dayOfWeek = validatedData.dayOfWeek ?? currentTimetable.dayOfWeek;
        const startTime = validatedData.startTime ?? currentTimetable.startTime;
        const endTime = validatedData.endTime ?? currentTimetable.endTime;
        const labId = validatedData.labId ?? currentTimetable.labId;
        
        const { hasConflicts, conflictingTimetables } = await storage.checkTimetableConflicts(
          labId,
          dayOfWeek,
          startTime,
          endTime,
          req.params.id,
          classId
        );
        
        if (hasConflicts) {
          // Determine conflict type for better error messaging
          const firstConflict = conflictingTimetables[0];
          const isLabConflict = firstConflict.labId === labId;
          const isClassConflict = firstConflict.classId === classId;
          
          return res.status(409).json({
            error: 'SCHEDULE_CONFLICT',
            conflictType: isClassConflict ? 'class' : 'lab',
            conflicts: conflictingTimetables,
            message: isClassConflict 
              ? 'This class already has a session at this time'
              : 'Lab is already occupied at this time'
          });
        }
      }
      
      const timetable = await storage.updateTimetable(req.params.id, validatedData);
      if (!timetable) {
        return res.status(404).json({ error: 'Timetable entry not found' });
      }
      res.json(timetable);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid timetable data', details: error.errors });
      }
      if (error.message.includes('lab must match')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error updating timetable:', error);
      res.status(500).json({ error: 'Failed to update timetable' });
    }
  });

  app.delete('/api/timetables/:id', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const deleted = await storage.deleteTimetable(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Timetable entry not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting timetable:', error);
      res.status(500).json({ error: 'Failed to delete timetable' });
    }
  });

  // Assignment Management
  app.get('/api/sessions/:sessionId/assignments', requireAuth, async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsBySession(req.params.sessionId);
      res.json(assignments);
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });

  app.get('/api/assignments/:id', requireAuth, async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      res.json(assignment);
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ error: 'Failed to fetch assignment' });
    }
  });

  app.post('/api/assignments', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertAssignmentSchema.parse(req.body);
      
      // SECURITY FIX: Validate instructor owns the session's class
      const hasAccess = await validateInstructorOwnsSession(validatedData.sessionId, user.id);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only create assignments for sessions in your own classes'
        });
      }
      
      // SECURITY FIX: Validate session exists
      const session = await storage.getSession(validatedData.sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid assignment data', details: error.errors });
      }
      console.error('Error creating assignment:', error);
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  });

  // Submission Management
  app.get('/api/assignments/:assignmentId/submissions', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const user = (req as any).user;
      
      // SECURITY FIX: Validate instructor owns the assignment's session
      const assignment = await storage.getAssignment(req.params.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      const hasAccess = await validateInstructorOwnsSession(assignment.sessionId, user.id);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only view submissions for your own assignments'
        });
      }
      
      const submissions = await storage.getSubmissionsByAssignment(req.params.assignmentId);
      res.json(submissions);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/students/:studentId/submissions', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const requestedStudentId = req.params.studentId;
      
      // SECURITY FIX: Students can only view their own submissions
      if (user.role === 'student') {
        if (user.id !== requestedStudentId) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'Students can only view their own submissions'
          });
        }
      } else if (user.role === 'instructor') {
        // SECURITY FIX: Instructors can only view submissions from students in their classes
        const studentEnrollments = await storage.getEnrollmentsByStudent(requestedStudentId);
        const instructorClasses = await storage.getClassesByInstructor(user.id);
        
        const hasAccess = studentEnrollments.some(enrollment => 
          instructorClasses.some(classData => classData.id === enrollment.classId && enrollment.isActive)
        );
        
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'You can only view submissions from students in your classes'
          });
        }
      }
      
      const submissions = await storage.getSubmissionsByStudent(requestedStudentId);
      res.json(submissions);
    } catch (error: any) {
      console.error('Error fetching student submissions:', error);
      res.status(500).json({ error: 'Failed to fetch student submissions' });
    }
  });

  app.get('/api/submissions/:id', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // SECURITY FIX: Validate ownership before returning submission
      const hasAccess = await validateSubmissionOwnership(req.params.id, user.id, user.role);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only view your own submissions or submissions from your students'
        });
      }
      
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      res.json(submission);
    } catch (error: any) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  app.post('/api/submissions', requireAuth, requireRole(['student']), async (req, res) => {
    try {
      const user = (req as any).user;
      
      // SECURITY FIX: Parse and validate the request, but derive studentId from authenticated user
      const { studentId: _, ...submissionData } = insertSubmissionSchema.parse(req.body);
      
      // SECURITY FIX: Force studentId to be the authenticated user
      const validatedData = {
        ...submissionData,
        studentId: user.id
      };
      
      // SECURITY FIX: Validate student is enrolled in the class for this assignment
      const isEnrolled = await validateStudentEnrollment(user.id, validatedData.assignmentId);
      if (!isEnrolled) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You are not enrolled in the class for this assignment'
        });
      }
      
      // SECURITY FIX: Check if assignment exists and get due date
      const assignment = await storage.getAssignment(validatedData.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      // SECURITY FIX: Server-side computation of isLate based on due date
      const submittedAt = new Date();
      const isLate = submittedAt > new Date(assignment.dueDate);
      
      const submissionWithTimestamp = {
        ...validatedData,
        submittedAt,
        isLate
      };
      
      const submission = await storage.createSubmission(submissionWithTimestamp);
      res.status(201).json(submission);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid submission data', details: error.errors });
      }
      if (error.constraint && error.constraint.includes('unique')) {
        return res.status(409).json({ error: 'You have already submitted for this assignment' });
      }
      console.error('Error creating submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  });

  // Grade Management
  app.get('/api/submissions/:submissionId/grades', requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // SECURITY FIX: Validate access to submission before showing grades
      const hasAccess = await validateGradeAccess(req.params.submissionId, user.id, user.role);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only view grades for your own submissions or your students\' submissions'
        });
      }
      
      const grades = await storage.getGradesBySubmission(req.params.submissionId);
      res.json(grades);
    } catch (error: any) {
      console.error('Error fetching grades:', error);
      res.status(500).json({ error: 'Failed to fetch grades' });
    }
  });

  app.get('/api/instructors/:instructorId/grades', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const user = (req as any).user;
      const requestedInstructorId = req.params.instructorId;
      
      // SECURITY FIX: Instructors can only view their own grades
      if (user.id !== requestedInstructorId) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only view your own grades'
        });
      }
      
      const grades = await storage.getGradesByInstructor(requestedInstructorId);
      res.json(grades);
    } catch (error: any) {
      console.error('Error fetching instructor grades:', error);
      res.status(500).json({ error: 'Failed to fetch instructor grades' });
    }
  });

  app.post('/api/grades', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const user = (req as any).user;
      const validatedData = insertGradeSchema.parse(req.body);
      
      // SECURITY FIX: Validate instructor can grade this submission
      const hasAccess = await validateSubmissionOwnership(validatedData.submissionId, user.id, 'instructor');
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only grade submissions from your own classes'
        });
      }
      
      // SECURITY FIX: Validate submission exists
      const submission = await storage.getSubmission(validatedData.submissionId);
      if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
      }
      
      const grade = await storage.createGrade(validatedData);
      res.status(201).json(grade);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid grade data', details: error.errors });
      }
      console.error('Error creating grade:', error);
      res.status(500).json({ error: 'Failed to create grade' });
    }
  });

  // Analytics and Reporting
  app.get('/api/analytics/lab-utilization', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Get all labs
      const labs = await storage.getLabs();
      
      const analyticsData = await Promise.all(labs.map(async (lab) => {
        // Get classes for this lab
        const classes = await storage.getClassesByLab(lab.id);
        
        let totalSessions = 0;
        let totalStudents = 0;
        let sessionHours = 0;
        
        for (const classData of classes) {
          const sessions = await storage.getSessionsByClass(classData.id);
          const enrollments = await storage.getEnrollmentsByClass(classData.id);
          
          // Filter sessions by date if provided
          let filteredSessions = sessions;
          if (startDate || endDate) {
            filteredSessions = sessions.filter(session => {
              const sessionDate = new Date(session.scheduledAt);
              if (startDate && sessionDate < new Date(startDate as string)) return false;
              if (endDate && sessionDate > new Date(endDate as string)) return false;
              return true;
            });
          }
          
          totalSessions += filteredSessions.length;
          totalStudents += enrollments.filter(e => e.isActive).length;
          sessionHours += filteredSessions.reduce((sum, s) => sum + s.duration / 60, 0);
        }
        
        return {
          lab: {
            id: lab.id,
            name: lab.name,
            location: lab.location,
            capacity: lab.capacity
          },
          utilization: {
            totalClasses: classes.filter(c => c.isActive).length,
            totalSessions,
            totalStudents,
            sessionHours: Math.round(sessionHours * 10) / 10,
            utilizationRate: lab.capacity > 0 ? Math.round((totalStudents / lab.capacity) * 100) : 0
          }
        };
      }));
      
      res.json({
        dateRange: { startDate, endDate },
        labs: analyticsData,
        summary: {
          totalLabs: labs.length,
          totalClasses: analyticsData.reduce((sum, lab) => sum + lab.utilization.totalClasses, 0),
          totalSessions: analyticsData.reduce((sum, lab) => sum + lab.utilization.totalSessions, 0),
          totalStudents: analyticsData.reduce((sum, lab) => sum + lab.utilization.totalStudents, 0),
          totalSessionHours: Math.round(analyticsData.reduce((sum, lab) => sum + lab.utilization.sessionHours, 0) * 10) / 10
        }
      });
    } catch (error: any) {
      console.error('Error generating lab utilization analytics:', error);
      res.status(500).json({ error: 'Failed to generate lab utilization analytics' });
    }
  });

  app.get('/api/analytics/class-performance/:classId', requireAuth, async (req, res) => {
    try {
      const classId = req.params.classId;
      const { userId, role } = req as any; // From auth middleware
      
      // Get class details
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      // Authorization: Students can only see their own class performance, instructors can see classes they teach
      if (role === 'student') {
        const enrollment = await storage.getEnrollmentsByStudent(userId);
        if (!enrollment.some(e => e.classId === classId)) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (role === 'instructor' && classData.instructorId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get sessions, assignments, and submissions for analysis
      const sessions = await storage.getSessionsByClass(classId);
      const enrollments = await storage.getEnrollmentsByClass(classId);
      
      let allAssignments = [];
      let allSubmissions = [];
      let allGrades = [];
      
      for (const session of sessions) {
        const assignments = await storage.getAssignmentsBySession(session.id);
        allAssignments.push(...assignments);
        
        for (const assignment of assignments) {
          const submissions = await storage.getSubmissionsByAssignment(assignment.id);
          allSubmissions.push(...submissions);
          
          for (const submission of submissions) {
            const grades = await storage.getGradesBySubmission(submission.id);
            allGrades.push(...grades);
          }
        }
      }
      
      // Calculate performance metrics
      const activeStudents = enrollments.filter(e => e.isActive).length;
      const completionRate = allAssignments.length > 0 ? 
        Math.round((allSubmissions.length / (allAssignments.length * activeStudents)) * 100) : 0;
      
      const lateSubmissions = allSubmissions.filter(s => s.isLate).length;
      const onTimeRate = allSubmissions.length > 0 ? 
        Math.round(((allSubmissions.length - lateSubmissions) / allSubmissions.length) * 100) : 0;
      
      const averageScore = allGrades.length > 0 ? 
        Math.round((allGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / allGrades.length) * 10) / 10 : 0;
      
      // Grade distribution
      const gradeDistribution = {
        A: 0, B: 0, C: 0, D: 0, F: 0
      };
      
      allGrades.forEach(grade => {
        const percentage = (grade.score / grade.maxScore) * 100;
        if (percentage >= 90) gradeDistribution.A++;
        else if (percentage >= 80) gradeDistribution.B++;
        else if (percentage >= 70) gradeDistribution.C++;
        else if (percentage >= 60) gradeDistribution.D++;
        else gradeDistribution.F++;
      });
      
      res.json({
        class: classData,
        performance: {
          totalStudents: activeStudents,
          totalAssignments: allAssignments.length,
          totalSubmissions: allSubmissions.length,
          totalGrades: allGrades.length,
          completionRate,
          onTimeSubmissionRate: onTimeRate,
          lateSubmissions,
          averageScore,
          gradeDistribution
        },
        timeline: {
          sessionsCompleted: sessions.length,
          upcomingSessions: sessions.filter(s => new Date(s.scheduledAt) > new Date()).length
        }
      });
    } catch (error: any) {
      console.error('Error generating class performance analytics:', error);
      res.status(500).json({ error: 'Failed to generate class performance analytics' });
    }
  });

  app.get('/api/analytics/assignment-completion', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const { classId, sessionId } = req.query;
      
      let assignments = [];
      let scope = 'all';
      
      if (sessionId) {
        assignments = await storage.getAssignmentsBySession(sessionId as string);
        scope = 'session';
      } else if (classId) {
        const sessions = await storage.getSessionsByClass(classId as string);
        for (const session of sessions) {
          const sessionAssignments = await storage.getAssignmentsBySession(session.id);
          assignments.push(...sessionAssignments);
        }
        scope = 'class';
      } else {
        // Get assignments for all classes taught by this instructor
        const { userId } = req as any;
        const classes = await storage.getClassesByInstructor(userId);
        
        for (const classData of classes) {
          const sessions = await storage.getSessionsByClass(classData.id);
          for (const session of sessions) {
            const sessionAssignments = await storage.getAssignmentsBySession(session.id);
            assignments.push(...sessionAssignments);
          }
        }
        scope = 'instructor';
      }
      
      // Analyze each assignment
      const assignmentAnalytics = await Promise.all(assignments.map(async (assignment) => {
        const submissions = await storage.getSubmissionsByAssignment(assignment.id);
        const grades = [];
        
        for (const submission of submissions) {
          const submissionGrades = await storage.getGradesBySubmission(submission.id);
          grades.push(...submissionGrades);
        }
        
        // Get expected submission count (students enrolled in the class of this assignment's session)
        const session = await storage.getSession(assignment.sessionId);
        const enrollments = session ? await storage.getEnrollmentsByClass(session.classId) : [];
        const expectedSubmissions = enrollments.filter(e => e.isActive).length;
        
        const completionRate = expectedSubmissions > 0 ? 
          Math.round((submissions.length / expectedSubmissions) * 100) : 0;
        
        const gradingRate = submissions.length > 0 ? 
          Math.round((grades.length / submissions.length) * 100) : 0;
        
        const lateSubmissions = submissions.filter(s => s.isLate).length;
        
        return {
          assignment: {
            id: assignment.id,
            title: assignment.title,
            dueDate: assignment.dueDate,
            maxPoints: assignment.maxPoints,
            sessionId: assignment.sessionId
          },
          metrics: {
            expectedSubmissions,
            actualSubmissions: submissions.length,
            gradedSubmissions: grades.length,
            completionRate,
            gradingRate,
            lateSubmissions,
            onTimeSubmissions: submissions.length - lateSubmissions
          },
          averageScore: grades.length > 0 ? 
            Math.round((grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length) * 10) / 10 : null
        };
      }));
      
      res.json({
        scope,
        totalAssignments: assignments.length,
        assignments: assignmentAnalytics,
        summary: {
          totalExpectedSubmissions: assignmentAnalytics.reduce((sum, a) => sum + a.metrics.expectedSubmissions, 0),
          totalActualSubmissions: assignmentAnalytics.reduce((sum, a) => sum + a.metrics.actualSubmissions, 0),
          totalGradedSubmissions: assignmentAnalytics.reduce((sum, a) => sum + a.metrics.gradedSubmissions, 0),
          averageCompletionRate: assignmentAnalytics.length > 0 ? 
            Math.round(assignmentAnalytics.reduce((sum, a) => sum + a.metrics.completionRate, 0) / assignmentAnalytics.length) : 0,
          averageGradingRate: assignmentAnalytics.length > 0 ? 
            Math.round(assignmentAnalytics.reduce((sum, a) => sum + a.metrics.gradingRate, 0) / assignmentAnalytics.length) : 0
        }
      });
    } catch (error: any) {
      console.error('Error generating assignment completion analytics:', error);
      res.status(500).json({ error: 'Failed to generate assignment completion analytics' });
    }
  });

  app.get('/api/analytics/student-performance/:studentId', requireAuth, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const { userId, role } = req as any;
      
      // Authorization: Students can only see their own performance, instructors can see students in their classes
      if (role === 'student' && userId !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (role === 'instructor') {
        // Check if student is in any of the instructor's classes
        const instructorClasses = await storage.getClassesByInstructor(userId);
        const studentEnrollments = await storage.getEnrollmentsByStudent(studentId);
        
        const hasAccess = instructorClasses.some(cls => 
          studentEnrollments.some(enrollment => enrollment.classId === cls.id)
        );
        
        if (!hasAccess) {
          return res.status(403).json({ error: 'Student not in your classes' });
        }
      }
      
      // Get student information
      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Get student's enrollments and performance data
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      const submissions = await storage.getSubmissionsByStudent(studentId);
      
      let allGrades = [];
      for (const submission of submissions) {
        const grades = await storage.getGradesBySubmission(submission.id);
        allGrades.push(...grades);
      }
      
      // Calculate performance metrics per class
      const classPerformance = await Promise.all(enrollments.map(async (enrollment) => {
        const classData = await storage.getClass(enrollment.classId);
        if (!classData) return null;
        
        // Get assignments for this class
        const sessions = await storage.getSessionsByClass(classData.id);
        let classAssignments = [];
        
        for (const session of sessions) {
          const assignments = await storage.getAssignmentsBySession(session.id);
          classAssignments.push(...assignments);
        }
        
        // Get student's submissions and grades for this class
        const classSubmissions = submissions.filter(sub => 
          classAssignments.some(assignment => assignment.id === sub.assignmentId)
        );
        
        const classGrades = [];
        for (const submission of classSubmissions) {
          const grades = await storage.getGradesBySubmission(submission.id);
          classGrades.push(...grades);
        }
        
        const completionRate = classAssignments.length > 0 ? 
          Math.round((classSubmissions.length / classAssignments.length) * 100) : 0;
        
        const averageScore = classGrades.length > 0 ? 
          Math.round((classGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / classGrades.length) * 10) / 10 : 0;
        
        const lateSubmissions = classSubmissions.filter(s => s.isLate).length;
        
        return {
          class: classData,
          enrollment,
          performance: {
            totalAssignments: classAssignments.length,
            completedAssignments: classSubmissions.length,
            gradedAssignments: classGrades.length,
            completionRate,
            averageScore,
            lateSubmissions,
            onTimeSubmissions: classSubmissions.length - lateSubmissions
          }
        };
      }));
      
      const validClassPerformance = classPerformance.filter(cp => cp !== null);
      
      // Overall student performance
      const overallAverageScore = allGrades.length > 0 ? 
        Math.round((allGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / allGrades.length) * 10) / 10 : 0;
      
      const totalLateSubmissions = submissions.filter(s => s.isLate).length;
      const onTimeRate = submissions.length > 0 ? 
        Math.round(((submissions.length - totalLateSubmissions) / submissions.length) * 100) : 0;
      
      res.json({
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email
        },
        overall: {
          totalClasses: enrollments.filter(e => e.isActive).length,
          totalSubmissions: submissions.length,
          totalGrades: allGrades.length,
          overallAverageScore,
          onTimeSubmissionRate: onTimeRate,
          totalLateSubmissions
        },
        classesByPerformance: validClassPerformance.sort((a, b) => b.performance.averageScore - a.performance.averageScore)
      });
    } catch (error: any) {
      console.error('Error generating student performance analytics:', error);
      res.status(500).json({ error: 'Failed to generate student performance analytics' });
    }
  });

  app.get('/api/analytics/multi-lab-comparison', requireAuth, requireRole(['instructor']), async (req, res) => {
    try {
      const { semester, year } = req.query;
      
      // Get all labs
      const labs = await storage.getLabs();
      
      const comparison = await Promise.all(labs.map(async (lab) => {
        // Get classes for this lab, optionally filtered by semester/year
        let classes = await storage.getClassesByLab(lab.id);
        
        if (semester || year) {
          classes = classes.filter(cls => {
            if (semester && cls.semester !== semester) return false;
            if (year && cls.year !== parseInt(year as string)) return false;
            return true;
          });
        }
        
        let totalStudents = 0;
        let totalAssignments = 0;
        let totalSubmissions = 0;
        let totalGrades = 0;
        let allScores: number[] = [];
        let totalLateSubmissions = 0;
        
        for (const classData of classes) {
          const enrollments = await storage.getEnrollmentsByClass(classData.id);
          totalStudents += enrollments.filter(e => e.isActive).length;
          
          const sessions = await storage.getSessionsByClass(classData.id);
          
          for (const session of sessions) {
            const assignments = await storage.getAssignmentsBySession(session.id);
            totalAssignments += assignments.length;
            
            for (const assignment of assignments) {
              const submissions = await storage.getSubmissionsByAssignment(assignment.id);
              totalSubmissions += submissions.length;
              totalLateSubmissions += submissions.filter(s => s.isLate).length;
              
              for (const submission of submissions) {
                const grades = await storage.getGradesBySubmission(submission.id);
                totalGrades += grades.length;
                
                grades.forEach(grade => {
                  allScores.push((grade.score / grade.maxScore) * 100);
                });
              }
            }
          }
        }
        
        const averageScore = allScores.length > 0 ? 
          Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10 : 0;
        
        const completionRate = (totalAssignments * totalStudents) > 0 ? 
          Math.round((totalSubmissions / (totalAssignments * totalStudents)) * 100) : 0;
        
        const onTimeRate = totalSubmissions > 0 ? 
          Math.round(((totalSubmissions - totalLateSubmissions) / totalSubmissions) * 100) : 0;
        
        return {
          lab: {
            id: lab.id,
            name: lab.name,
            location: lab.location,
            capacity: lab.capacity
          },
          metrics: {
            totalClasses: classes.filter(c => c.isActive).length,
            totalStudents,
            totalAssignments,
            totalSubmissions,
            totalGrades,
            averageScore,
            completionRate,
            onTimeSubmissionRate: onTimeRate,
            utilizationRate: lab.capacity > 0 ? Math.round((totalStudents / lab.capacity) * 100) : 0
          }
        };
      }));
      
      // Calculate system-wide metrics
      const systemMetrics = {
        totalLabs: labs.length,
        totalClasses: comparison.reduce((sum, lab) => sum + lab.metrics.totalClasses, 0),
        totalStudents: comparison.reduce((sum, lab) => sum + lab.metrics.totalStudents, 0),
        totalAssignments: comparison.reduce((sum, lab) => sum + lab.metrics.totalAssignments, 0),
        totalSubmissions: comparison.reduce((sum, lab) => sum + lab.metrics.totalSubmissions, 0),
        systemAverageScore: comparison.length > 0 ? 
          Math.round(comparison.reduce((sum, lab) => sum + lab.metrics.averageScore, 0) / comparison.length * 10) / 10 : 0,
        systemCompletionRate: comparison.length > 0 ? 
          Math.round(comparison.reduce((sum, lab) => sum + lab.metrics.completionRate, 0) / comparison.length) : 0,
        systemUtilizationRate: comparison.length > 0 ? 
          Math.round(comparison.reduce((sum, lab) => sum + lab.metrics.utilizationRate, 0) / comparison.length) : 0
      };
      
      res.json({
        filters: { semester, year },
        systemMetrics,
        labComparison: comparison.sort((a, b) => b.metrics.averageScore - a.metrics.averageScore),
        topPerformingLab: comparison.reduce((top, current) => 
          current.metrics.averageScore > top.metrics.averageScore ? current : top, comparison[0] || null),
        mostUtilizedLab: comparison.reduce((top, current) => 
          current.metrics.utilizationRate > top.metrics.utilizationRate ? current : top, comparison[0] || null)
      });
    } catch (error: any) {
      console.error('Error generating multi-lab comparison:', error);
      res.status(500).json({ error: 'Failed to generate multi-lab comparison' });
    }
  });

  // Users (General)
  app.get('/api/users/:id', requireAuth, async (req, res) => {
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

  // Bootstrap endpoint - creates initial admin user (no auth required)
  app.post('/api/bootstrap', async (req, res) => {
    try {
      // Check if any users exist
      const existingUsers = await storage.getUsersByRole('instructor');

      if (existingUsers.length > 0) {
        return res.status(400).json({
          error: 'Bootstrap not needed',
          message: 'Admin users already exist. Use /api/admin/seed instead.'
        });
      }

      // Create initial admin user
      const adminUser = await storage.createUserWithRole({
        email: "admin@labmanager.com",
        password: "admin123",
        firstName: "System",
        lastName: "Administrator",
        role: "instructor"
      });

      res.status(201).json({
        message: 'Bootstrap completed successfully',
        admin: {
          email: adminUser.email,
          id: adminUser.id
        },
        nextSteps: [
          'Login with admin@labmanager.com / admin123',
          'Change the default password immediately',
          'Use POST /api/admin/seed to create sample data'
        ]
      });
    } catch (error: any) {
      console.error('Error during bootstrap:', error);
      res.status(500).json({ error: 'Bootstrap failed', details: error.message });
    }
  });

  // Admin/Development endpoints
  app.post('/api/admin/seed', requireAuth, requireRole(['instructor']), async (req, res) => {
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
        gradeLevel: 11,
        tradeType: "NM" as const,
        section: "A", 
        labId: labA.id,
        instructorId: drSmith.id,
        semester: "Fall",
        year: 2024
      });

      const bioClass = await storage.createClass({
        name: "Molecular Biology",
        code: "BIO301",
        gradeLevel: 12,
        tradeType: "M" as const, 
        section: "A",
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
