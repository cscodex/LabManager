import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { eq, and } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, InsertUserWithRole, Lab, InsertLab, Class, InsertClass,
  Computer, InsertComputer, Group, InsertGroup, 
  Enrollment, InsertEnrollment, Session, InsertSession,
  Assignment, InsertAssignment, Submission, InsertSubmission,
  Grade, InsertGrade
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithRole(user: InsertUserWithRole): Promise<User>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // Labs
  getLabs(): Promise<Lab[]>;
  getLab(id: string): Promise<Lab | undefined>;
  createLab(lab: InsertLab): Promise<Lab>;
  
  // Classes
  getClasses(): Promise<Class[]>;
  getClassesByLab(labId: string): Promise<Class[]>;
  getClassesByInstructor(instructorId: string): Promise<Class[]>;
  getClass(id: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  
  // Computers
  getComputersByLab(labId: string): Promise<Computer[]>;
  getComputer(id: string): Promise<Computer | undefined>;
  createComputer(computer: InsertComputer): Promise<Computer>;
  
  // Groups
  getGroupsByClass(classId: string): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Enrollments
  getEnrollmentsByClass(classId: string): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  
  // Sessions
  getSessionsByClass(classId: string): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  
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

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    // Create user with default student role (secure default)
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword,
      role: "student" as const, // Default role assignment - only server can set role
    };
    
    const result = await db.insert(schema.users).values(userWithHashedPassword).returning();
    return result[0];
  }

  async createUserWithRole(insertUser: InsertUserWithRole): Promise<User> {
    // Hash the password before storing
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(insertUser.password, saltRounds);
    
    const userWithHashedPassword = {
      ...insertUser,
      password: hashedPassword,
    };
    
    const result = await db.insert(schema.users).values(userWithHashedPassword).returning();
    return result[0];
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

  // Classes
  async getClasses(): Promise<Class[]> {
    return await db.query.classes.findMany();
  }

  async getClassesByLab(labId: string): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: eq(schema.classes.labId, labId),
    });
  }

  async getClassesByInstructor(instructorId: string): Promise<Class[]> {
    return await db.query.classes.findMany({
      where: eq(schema.classes.instructorId, instructorId),
    });
  }

  async getClass(id: string): Promise<Class | undefined> {
    return await db.query.classes.findFirst({
      where: eq(schema.classes.id, id),
    });
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(schema.classes).values(classData).returning();
    return result[0];
  }

  // Computers
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

  // Groups
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
    return result[0];
  }

  // Enrollments
  async getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
    return await db.query.enrollments.findMany({
      where: eq(schema.enrollments.classId, classId),
    });
  }

  async getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
    return await db.query.enrollments.findMany({
      where: eq(schema.enrollments.studentId, studentId),
    });
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(schema.enrollments).values(enrollment).returning();
    return result[0];
  }

  // Sessions
  async getSessionsByClass(classId: string): Promise<Session[]> {
    return await db.query.sessions.findMany({
      where: eq(schema.sessions.classId, classId),
    });
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
