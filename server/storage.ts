import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, not, isNull, isNotNull, inArray } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as schema from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type {
  User, InsertUserWithRole, Lab, InsertLab, Class, InsertClass,
  Computer, InsertComputer, Group, InsertGroup,
  Session, InsertSession,
  Assignment, InsertAssignment, Submission, InsertSubmission,
  Grade, InsertGrade, Timetable, InsertTimetable
} from "@shared/schema";

// Use Node Postgres driver for reliable database connection in Replit
// Optimized connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  // Performance optimizations
  max: 20, // Maximum number of connections in the pool
  min: 2,  // Minimum number of connections to maintain
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for new connections
  maxUses: 7500, // Close connections after 7500 uses to prevent memory leaks
});
const db = drizzle(pool, { schema });

// Export pool for raw SQL queries
export { pool };

export interface IStorage {
  // Session storage
  sessionStore: session.Store;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUserWithRole): Promise<User>;
  createUserWithRole(user: InsertUserWithRole): Promise<User>;
  updateUser(id: string, user: Partial<InsertUserWithRole>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Labs
  getLabs(): Promise<Lab[]>;
  getLab(id: string): Promise<Lab | undefined>;
  createLab(lab: InsertLab): Promise<Lab>;
  updateLab(id: string, lab: Partial<InsertLab>): Promise<Lab | undefined>;
  deleteLab(id: string): Promise<boolean>;
  
  // Classes with trade-section system
  getClasses(): Promise<Class[]>;
  getClassesByLab(labId: string): Promise<Class[]>;
  getClassesByInstructor(instructorId: string): Promise<Class[]>;
  getClassesByGradeAndTrade(gradeLevel: number, tradeType: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: string): Promise<boolean>;
  
  // Timetables
  getTimetables(): Promise<Timetable[]>;
  getTimetablesByClass(classId: string): Promise<Timetable[]>;
  getTimetablesByLab(labId: string): Promise<Timetable[]>;
  getTimetablesByDay(dayOfWeek: number): Promise<Timetable[]>;
  getTimetable(id: string): Promise<Timetable | undefined>;
  createTimetable(timetable: InsertTimetable): Promise<Timetable>;
  updateTimetable(id: string, timetable: Partial<InsertTimetable>): Promise<Timetable | undefined>;
  deleteTimetable(id: string): Promise<boolean>;
  checkTimetableConflicts(labId: string, dayOfWeek: number, startTime: string, endTime: string, excludeTimetableId?: string, classId?: string): Promise<{ hasConflicts: boolean; conflictingTimetables: Timetable[] }>;
  
  // Computers
  getAllComputers(): Promise<Computer[]>;
  getComputersByLab(labId: string): Promise<Computer[]>;
  getComputer(id: string): Promise<Computer | undefined>;
  createComputer(computer: InsertComputer): Promise<Computer>;
  updateComputer(id: string, computer: Partial<InsertComputer>): Promise<Computer | undefined>;
  deleteComputer(id: string): Promise<boolean>;
  
  // Groups
  getAllGroups(): Promise<Group[]>;
  getGroupsByClass(classId: string): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  createGroupWithStudents(group: InsertGroup, studentIds: string[]): Promise<Group>;
  updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;
  addGroupMember(groupId: string, studentId: string): Promise<boolean>;
  removeGroupMember(groupId: string, studentId: string): Promise<boolean>;
  getGroupsWithDetails(): Promise<any[]>;
  
  // Note: Enrollment methods removed - students are directly linked to groups
  
  // Sessions
  getSessionsByClass(classId: string): Promise<Session[]>;
  getSessionsByLab(labId: string): Promise<Session[]>;
  getSessionsByTimetable(timetableId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Computer conflict checking
  checkComputerConflicts(labId: string, scheduledAt: Date, duration: number, excludeSessionId?: string): Promise<{ hasConflicts: boolean; conflictingSessions: Session[] }>;
  
  // Assignments
  getAssignmentsBySession(sessionId: string): Promise<Assignment[]>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  
  // Submissions
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  getSubmission(id: string): Promise<Submission | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  
  // Grades
  getGradesBySubmission(submissionId: string): Promise<Grade[]>;
  getGradesByInstructor(instructorId: string): Promise<Grade[]>;
  createGrade(grade: InsertGrade): Promise<Grade>;
}

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return result as User | undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return result as User | undefined;
  }

  async createUser(insertUser: InsertUserWithRole): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash((insertUser as any).password, saltRounds);

    // Create user with default student role (secure default)
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword,
      role: (insertUser as any).role || "student" as const, // Use provided role or default to student
    };

    const result = await db.insert(schema.users).values(userWithHashedPassword).returning();
    return (result as User[])[0];
  }

  async createUserWithRole(insertUser: InsertUserWithRole): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash((insertUser as any).password, saltRounds);

    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword,
    };

    const result = await db.insert(schema.users).values(userWithHashedPassword).returning();
    return (result as User[])[0];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const result = await db.query.users.findMany({
      where: eq(schema.users.role, role),
    });
    return result as User[];
  }

  async updateUser(id: string, user: Partial<InsertUserWithRole>): Promise<User | undefined> {
    let updateData: any = { ...user };

    // Hash password if it's being updated
    if ((user as any).password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash((user as any).password, saltRounds);
    }
    
    const result = await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id))
      .returning();
    
    return result[0] as User | undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();

    return (result as any[]).length > 0;
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Labs
  async getLabs(): Promise<Lab[]> {
    return await db.query.labs.findMany();
  }

  async getLab(id: string): Promise<Lab | undefined> {
    return await db.query.labs.findFirst({
      where: eq(schema.labs.id, id),
    });
  }

  async createLab(lab: InsertLab): Promise<Lab> {
    const result = await db.insert(schema.labs).values(lab).returning();
    return result[0];
  }

  async updateLab(id: string, lab: Partial<InsertLab>): Promise<Lab | undefined> {
    const result = await db.update(schema.labs)
      .set(lab)
      .where(eq(schema.labs.id, id))
      .returning();
    
    return result[0];
  }

  async deleteLab(id: string): Promise<boolean> {
    const result = await db.delete(schema.labs)
      .where(eq(schema.labs.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Classes
  async getClasses(): Promise<Class[]> {
    return await db.query.classes.findMany() as Class[];
  }

  async getClassesByLab(labId: string): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: eq(schema.classes.labId, labId),
    }) as Class[];
  }

  async getClassesByInstructor(instructorId: string): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: eq(schema.classes.instructorId, instructorId),
    }) as Class[];
  }

  async getClassesByGradeAndTrade(gradeLevel: number, tradeType: string): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: and(eq(schema.classes.gradeLevel, gradeLevel), eq(schema.classes.tradeType, tradeType)),
    }) as Class[];
  }

  async getClass(id: string): Promise<Class | undefined> {
    return await db.query.classes.findFirst({
      where: eq(schema.classes.id, id),
    }) as Class | undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    // Generate displayName server-side to ensure consistency
    const displayName = `${classData.gradeLevel} ${classData.tradeType} ${classData.section}`;
    
    const classWithDisplayName = {
      ...classData,
      displayName
    };
    
    const result = await db.insert(schema.classes).values(classWithDisplayName).returning();
    return (result as Class[])[0];
  }

  async updateClass(id: string, classData: Partial<InsertClass>): Promise<Class | undefined> {
    let updateData: any = { ...classData };
    
    // Regenerate displayName if any relevant fields are updated
    if (classData.gradeLevel || classData.tradeType || classData.section) {
      // Get current class data to fill in missing fields
      const currentClass = await this.getClass(id);
      if (currentClass) {
        const gradeLevel = classData.gradeLevel ?? currentClass.gradeLevel;
        const tradeType = classData.tradeType ?? currentClass.tradeType;
        const section = classData.section ?? currentClass.section;
        updateData.displayName = `${gradeLevel} ${tradeType} ${section}`;
      }
    }
    
    const result = await db.update(schema.classes)
      .set(updateData)
      .where(eq(schema.classes.id, id))
      .returning();
    
    return result[0] as Class;
  }

  async deleteClass(id: string): Promise<boolean> {
    const result = await db.delete(schema.classes)
      .where(eq(schema.classes.id, id))
      .returning();

    return (result as any[]).length > 0;
  }

  // Timetables
  async getTimetables(): Promise<Timetable[]> {
    return await db.query.timetables.findMany();
  }

  async getTimetablesByClass(classId: string): Promise<Timetable[]> {
    return await db.query.timetables.findMany({
      where: eq(schema.timetables.classId, classId),
    });
  }

  async getTimetablesByLab(labId: string): Promise<Timetable[]> {
    return await db.query.timetables.findMany({
      where: eq(schema.timetables.labId, labId),
    });
  }

  async getTimetablesByDay(dayOfWeek: number): Promise<Timetable[]> {
    return await db.query.timetables.findMany({
      where: eq(schema.timetables.dayOfWeek, dayOfWeek),
    });
  }

  async getTimetable(id: string): Promise<Timetable | undefined> {
    return await db.query.timetables.findFirst({
      where: eq(schema.timetables.id, id),
    });
  }

  async createTimetable(timetable: InsertTimetable): Promise<Timetable> {
    // Validate lab consistency: timetable.labId should match class.labId
    const classData = await this.getClass(timetable.classId);
    if (classData && classData.labId !== timetable.labId) {
      throw new Error("Timetable lab must match the class's assigned lab");
    }
    
    const result = await db.insert(schema.timetables).values(timetable).returning();
    return result[0];
  }

  async updateTimetable(id: string, timetable: Partial<InsertTimetable>): Promise<Timetable | undefined> {
    // Validate lab consistency if classId or labId is being updated
    if (timetable.classId || timetable.labId) {
      const currentTimetable = await this.getTimetable(id);
      if (currentTimetable) {
        const classId = timetable.classId ?? currentTimetable.classId;
        const labId = timetable.labId ?? currentTimetable.labId;
        
        const classData = await this.getClass(classId);
        if (classData && classData.labId !== labId) {
          throw new Error("Timetable lab must match the class's assigned lab");
        }
      }
    }
    
    const result = await db.update(schema.timetables)
      .set(timetable)
      .where(eq(schema.timetables.id, id))
      .returning();
    
    return result[0];
  }

  async deleteTimetable(id: string): Promise<boolean> {
    const result = await db.delete(schema.timetables)
      .where(eq(schema.timetables.id, id))
      .returning();
    
    return result.length > 0;
  }

  async checkTimetableConflicts(labId: string, dayOfWeek: number, startTime: string, endTime: string, excludeTimetableId?: string, classId?: string): Promise<{ hasConflicts: boolean; conflictingTimetables: Timetable[] }> {
    // Get all timetables for the same day
    const timetables = await db.query.timetables.findMany({
      where: and(
        eq(schema.timetables.dayOfWeek, dayOfWeek),
        eq(schema.timetables.isActive, true)
      ),
    });
    
    const conflictingTimetables = timetables.filter(timetable => {
      // Skip the timetable being updated if excludeTimetableId is provided
      if (excludeTimetableId && timetable.id === excludeTimetableId) {
        return false;
      }
      
      // Check for time overlap first
      const existingStart = timetable.startTime;
      const existingEnd = timetable.endTime;
      
      // Convert times to minutes for easier comparison
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);
      const existStart = timeToMinutes(existingStart);
      const existEnd = timeToMinutes(existingEnd);
      
      // Check for time overlap first
      const hasTimeOverlap = newStart < existEnd && newEnd > existStart;
      
      if (!hasTimeOverlap) {
        return false;
      }
      
      // Check for conflicts: either same lab OR same class
      const isLabConflict = timetable.labId === labId;
      const isClassConflict = classId && timetable.classId === classId;
      
      return isLabConflict || isClassConflict;
    });
    
    return {
      hasConflicts: conflictingTimetables.length > 0,
      conflictingTimetables
    };
  }

  // Computers
  async getAllComputers(): Promise<Computer[]> {
    return await db.query.computers.findMany();
  }

  async getComputersByLab(labId: string): Promise<Computer[]> {
    return await db.query.computers.findMany({
      where: eq(schema.computers.labId, labId),
    });
  }

  async getComputer(id: string): Promise<Computer | undefined> {
    return await db.query.computers.findFirst({
      where: eq(schema.computers.id, id),
    });
  }

  async createComputer(computer: InsertComputer): Promise<Computer> {
    const result = await db.insert(schema.computers).values(computer).returning();
    return result[0];
  }

  async updateComputer(id: string, computer: Partial<InsertComputer>): Promise<Computer | undefined> {
    const result = await db.update(schema.computers)
      .set(computer)
      .where(eq(schema.computers.id, id))
      .returning();
    
    return result[0];
  }

  async deleteComputer(id: string): Promise<boolean> {
    const result = await db.delete(schema.computers)
      .where(eq(schema.computers.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Groups
  async getAllGroups(): Promise<Group[]> {
    return await db.query.groups.findMany();
  }

  async getGroupsByClass(classId: string): Promise<Group[]> {
    return await db.query.groups.findMany({
      where: eq(schema.groups.classId, classId),
    });
  }

  async getGroup(id: string): Promise<Group | undefined> {
    return await db.query.groups.findFirst({
      where: eq(schema.groups.id, id),
    });
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(schema.groups).values(group).returning();
    return (result as Group[])[0];
  }

  async createGroupWithStudents(group: InsertGroup, studentIds: string[]): Promise<Group> {
    return await db.transaction(async (tx) => {
      console.log('Creating group with students - Group data:', group, 'Student IDs:', studentIds);

      // Server-side validations
      if (studentIds && studentIds.length > 0) {
        // Check if any students are already in groups
        const studentsInGroups = await tx.query.users.findMany({
          where: and(
            inArray(schema.users.id, studentIds),
            isNotNull(schema.users.groupId)
          )
        });

        if (studentsInGroups.length > 0) {
          console.error('Students already in groups:', studentsInGroups.map(s => s.id));
          throw new Error("Some students are already assigned to groups");
        }

        // Validate students exist and are students
        const validStudents = await tx.query.users.findMany({
          where: and(
            inArray(schema.users.id, studentIds),
            eq(schema.users.role, 'student')
          )
        });

        console.log('Valid students found:', validStudents.length, 'Expected:', studentIds.length);

        if (validStudents.length !== studentIds.length) {
          throw new Error("Some selected users are not valid students");
        }

        // Validate max members
        if (studentIds.length > (group.maxMembers || 4)) {
          throw new Error(`Too many students selected. Maximum allowed: ${group.maxMembers || 4}`);
        }

        // Validate leader is in selected students
        if (group.leaderId && !studentIds.includes(group.leaderId)) {
          throw new Error("Group leader must be one of the selected students");
        }
      }
      
      // Validate computer belongs to selected lab and is available
      if (group.computerId && group.labId) {
        const computer = await tx.query.computers.findFirst({
          where: and(
            eq(schema.computers.id, group.computerId),
            eq(schema.computers.labId, group.labId),
            eq(schema.computers.status, 'available')
          )
        });
        
        if (!computer) {
          throw new Error("Computer not found or not available in selected lab");
        }
        
        // Check if computer is already assigned to another group in the SAME CLASS
        const existingGroupWithComputer = await tx.query.groups.findFirst({
          where: and(
            eq(schema.groups.computerId, group.computerId),
            eq(schema.groups.classId, group.classId!)
          )
        });

        if (existingGroupWithComputer) {
          throw new Error("Computer is already assigned to another group in this class");
        }
      }

      // Prepare group data with proper null handling
      const groupToInsert = {
        ...group,
        leaderId: group.leaderId || null,
        labId: group.labId || null,
        computerId: group.computerId === 'none' ? null : (group.computerId || null),
        maxMembers: group.maxMembers || 4
      };

      console.log('Inserting group with data:', groupToInsert);

      // Create the group
      const result = await tx.insert(schema.groups).values(groupToInsert).returning();
      const createdGroup = (result as Group[])[0];

      console.log('Group created:', createdGroup);

      // Assign students to group atomically if provided
      if (studentIds && studentIds.length > 0) {
        console.log('Assigning students to group:', studentIds);
        const updateResult = await tx.update(schema.users)
          .set({ groupId: createdGroup.id })
          .where(
            and(
              inArray(schema.users.id, studentIds),
              eq(schema.users.role, 'student'),
              isNull(schema.users.groupId)
            )
          )
          .returning();

        console.log('Students assigned:', updateResult.length);

        // Verify all students were assigned
        if (updateResult.length !== studentIds.length) {
          throw new Error("Failed to assign all students to group");
        }
      }

      return createdGroup;
    });
  }

  async updateGroup(id: string, group: Partial<InsertGroup>): Promise<Group | undefined> {
    const result = await db.update(schema.groups)
      .set(group)
      .where(eq(schema.groups.id, id))
      .returning();
    
    return result[0];
  }

  async deleteGroup(id: string): Promise<boolean> {
    const result = await db.delete(schema.groups)
      .where(eq(schema.groups.id, id))
      .returning();
    
    return (result as any[]).length > 0;
  }

  async addGroupMember(groupId: string, studentId: string): Promise<boolean> {
    // First get the group to check class and max members
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if student exists and is a student
    const student = await db.query.users.findFirst({
      where: and(
        eq(schema.users.id, studentId),
        eq(schema.users.role, 'student')
      )
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Check if student is already in a group
    if (student.groupId) {
      throw new Error('Student is already in a group');
    }

    // Check current group size
    const currentMembers = await db.query.users.findMany({
      where: and(
        eq(schema.users.groupId, groupId),
        eq(schema.users.role, 'student')
      )
    });

    if (currentMembers.length >= group.maxMembers) {
      throw new Error('Group is at maximum capacity');
    }

    // Add student to group
    await db.update(schema.users)
      .set({ groupId: groupId })
      .where(eq(schema.users.id, studentId));

    // If this is the first member and group has no leader, make them the leader
    if (currentMembers.length === 0 && !group.leaderId) {
      await db.update(schema.groups)
        .set({ leaderId: studentId })
        .where(eq(schema.groups.id, groupId));
    }

    return true;
  }

  async removeGroupMember(groupId: string, studentId: string): Promise<boolean> {
    // First get the group to check if student is the leader
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if student is in this group
    const student = await db.query.users.findFirst({
      where: and(
        eq(schema.users.id, studentId),
        eq(schema.users.groupId, groupId),
        eq(schema.users.role, 'student')
      )
    });

    if (!student) {
      throw new Error('Student is not in this group');
    }

    // Check if student is the leader - if so, we need to reassign leadership or prevent removal
    if (group.leaderId === studentId) {
      // Count remaining members
      const otherMembers = await db.query.users.findMany({
        where: and(
          eq(schema.users.groupId, groupId),
          eq(schema.users.role, 'student'),
          not(eq(schema.users.id, studentId))
        )
      });

      if (otherMembers.length === 0) {
        // This is the last member, allow removal but clear leader
        await db.update(schema.groups)
          .set({ leaderId: null })
          .where(eq(schema.groups.id, groupId));
      } else {
        throw new Error('Cannot remove group leader. Please reassign leadership first.');
      }
    }

    // Remove student from group
    await db.update(schema.users)
      .set({ groupId: null })
      .where(eq(schema.users.id, studentId));

    return true;
  }

  async getGroupsWithDetails(): Promise<any[]> {
    try {
      // Get all groups
      const groups = await db.query.groups.findMany();

      const groupsWithDetails = await Promise.all(
        groups.map(async (group) => {
          // Get class information
          const classInfo = await db.query.classes.findFirst({
            where: eq(schema.classes.id, group.classId),
          });

          // Get lab information
          let labInfo = null;
          if (group.labId) {
            labInfo = await db.query.labs.findFirst({
              where: eq(schema.labs.id, group.labId),
            });
          }

          // Get computer information
          let computerInfo = null;
          if (group.computerId) {
            computerInfo = await db.query.computers.findFirst({
              where: eq(schema.computers.id, group.computerId),
            });
          }

          // Get instructor information
          let instructorInfo = null;
          if (classInfo && classInfo.instructorId) {
            const instructor = await db.query.users.findFirst({
              where: eq(schema.users.id, classInfo.instructorId),
            });
            // Remove password for security
            if (instructor) {
              instructorInfo = {
                id: instructor.id,
                firstName: instructor.firstName,
                lastName: instructor.lastName,
                email: instructor.email,
                role: instructor.role
              };
            }
          }

          // Get group members directly from users table
          const students = await db.query.users.findMany({
            where: and(
              eq(schema.users.groupId, group.id),
              eq(schema.users.role, 'student')
            ),
          });

          const members = students.map((student) => {
            // Remove password for security
            const sanitizedStudent = {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
              role: student.role,
              gradeLevel: student.gradeLevel,
              tradeType: student.tradeType,
              section: student.section,
              groupId: student.groupId
            };

            return {
              student: sanitizedStudent
            };
          });

          return {
            ...group,
            class: classInfo,
            lab: labInfo,
            computer: computerInfo,
            instructor: instructorInfo,
            members
          };
        })
      );

      return groupsWithDetails;
    } catch (error) {
      console.error('Error in getGroupsWithDetails:', error);
      throw error;
    }
  }

  // Note: Enrollment methods removed - students are directly linked to groups via users.groupId

  // Sessions
  async getSessionsByClass(classId: string): Promise<Session[]> {
    return await db.query.sessions.findMany({
      where: eq(schema.sessions.classId, classId),
    });
  }
  
  async getSessionsByTimetable(timetableId: string): Promise<Session[]> {
    return await db.query.sessions.findMany({
      where: eq(schema.sessions.timetableId, timetableId),
    });
  }
  
  async getSessionsByLab(labId: string): Promise<Session[]> {
    // Get all classes in the lab
    const labClasses = await db.query.classes.findMany({
      where: eq(schema.classes.labId, labId),
    });
    
    // Get all sessions for those classes
    const classIds = labClasses.map(c => c.id);
    if (classIds.length === 0) return [];
    
    // Get sessions for all classes in the lab
    const sessionsPromises = classIds.map(classId => 
      db.query.sessions.findMany({
        where: eq(schema.sessions.classId, classId),
      })
    );
    
    const sessionArrays = await Promise.all(sessionsPromises);
    const sessions = sessionArrays.flat();
    
    return sessions;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return await db.query.sessions.findFirst({
      where: eq(schema.sessions.id, id),
    });
  }

  async createSession(session: InsertSession): Promise<Session> {
    const result = await db.insert(schema.sessions).values(session).returning();
    return result[0];
  }

  async updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined> {
    const result = await db.update(schema.sessions)
      .set(session)
      .where(eq(schema.sessions.id, id))
      .returning();
    
    return result[0];
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db.delete(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .returning();
    
    return result.length > 0;
  }
  
  // Computer conflict checking
  async checkComputerConflicts(labId: string, scheduledAt: Date, duration: number, excludeSessionId?: string): Promise<{ hasConflicts: boolean; conflictingSessions: Session[] }> {
    const sessionStart = new Date(scheduledAt);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    
    // Get all sessions for this lab
    const labSessions = await this.getSessionsByLab(labId);
    
    const conflictingSessions = labSessions.filter(session => {
      // Skip the session being updated if excludeSessionId is provided
      if (excludeSessionId && session.id === excludeSessionId) {
        return false;
      }
      
      const existingStart = new Date(session.scheduledAt);
      const existingEnd = new Date(existingStart.getTime() + session.duration * 60000);
      
      // Check for time overlap
      return sessionStart < existingEnd && sessionEnd > existingStart;
    });
    
    return {
      hasConflicts: conflictingSessions.length > 0,
      conflictingSessions
    };
  }

  // Assignments
  async getAssignmentsBySession(sessionId: string): Promise<Assignment[]> {
    return await db.query.assignments.findMany({
      where: eq(schema.assignments.sessionId, sessionId),
    });
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    return await db.query.assignments.findFirst({
      where: eq(schema.assignments.id, id),
    });
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const result = await db.insert(schema.assignments).values(assignment).returning();
    return result[0];
  }

  // Submissions
  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return await db.query.submissions.findMany({
      where: eq(schema.submissions.assignmentId, assignmentId),
    });
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return await db.query.submissions.findMany({
      where: eq(schema.submissions.studentId, studentId),
    });
  }

  async getSubmission(id: string): Promise<Submission | undefined> {
    return await db.query.submissions.findFirst({
      where: eq(schema.submissions.id, id),
    });
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const result = await db.insert(schema.submissions).values(submission).returning();
    return result[0];
  }

  // Grades
  async getGradesBySubmission(submissionId: string): Promise<Grade[]> {
    return await db.query.grades.findMany({
      where: eq(schema.grades.submissionId, submissionId),
    });
  }

  async getGradesByInstructor(instructorId: string): Promise<Grade[]> {
    return await db.query.grades.findMany({
      where: eq(schema.grades.instructorId, instructorId),
    });
  }

  async createGrade(grade: InsertGrade): Promise<Grade> {
    const result = await db.insert(schema.grades).values(grade).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
