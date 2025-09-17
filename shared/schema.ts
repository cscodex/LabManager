import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("student"), // instructor, student
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Labs table
export const labs = pgTable("labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Classes table
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  section: text("section").notNull(),
  labId: varchar("lab_id").references(() => labs.id).notNull(),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one class per code, section, semester, and year
  uniqueClass: unique().on(table.code, table.section, table.semester, table.year),
}));

// Computers table
export const computers = pgTable("computers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  labId: varchar("lab_id").references(() => labs.id).notNull(),
  specs: text("specs"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one computer name per lab
  uniqueComputerInLab: unique().on(table.name, table.labId),
}));

// Groups table
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  computerId: varchar("computer_id").references(() => computers.id),
  maxMembers: integer("max_members").default(4).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one group name per class
  uniqueGroupInClass: unique().on(table.name, table.classId),
}));

// Student enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id),
  seatNumber: text("seat_number"),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  // Unique constraint: one enrollment per student per class (business logic enforced via triggers or app logic for active-only)
  uniqueEnrollment: unique().on(table.studentId, table.classId),
}));

// Lab sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // minutes
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assignments/Lab exercises
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  sessionId: varchar("session_id").references(() => sessions.id).notNull(),
  dueDate: timestamp("due_date").notNull(),
  maxPoints: integer("max_points").default(100).notNull(),
  rubric: text("rubric"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Submissions
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assignmentId: varchar("assignment_id").references(() => assignments.id).notNull(),
  studentId: varchar("student_id").references(() => users.id).notNull(),
  groupId: varchar("group_id").references(() => groups.id),
  files: text("files"), // JSON string of file paths
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  isLate: boolean("is_late").default(false).notNull(),
}, (table) => ({
  // Unique constraint: one submission per student per assignment
  uniqueSubmissionPerStudent: unique().on(table.assignmentId, table.studentId),
}));

// Grades
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").references(() => submissions.id).notNull(),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  rubricScores: text("rubric_scores"), // JSON string
  feedback: text("feedback"),
  gradedAt: timestamp("graded_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one grade per submission
  uniqueGradePerSubmission: unique().on(table.submissionId),
}));

// Zod schemas for validation
// Security: Remove role from client-controlled schema to prevent privilege escalation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

// Server-only schema that includes role (for admin operations)
export const insertUserWithRoleSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const insertLabSchema = createInsertSchema(labs).pick({
  name: true,
  description: true,
  location: true,
  capacity: true,
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  code: true,
  section: true,
  labId: true,
  instructorId: true,
  semester: true,
  year: true,
});

export const insertComputerSchema = createInsertSchema(computers).pick({
  name: true,
  labId: true,
  specs: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  classId: true,
  computerId: true,
  maxMembers: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  classId: true,
  groupId: true,
  seatNumber: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  title: true,
  description: true,
  classId: true,
  scheduledAt: true,
  duration: true,
});

export const insertAssignmentSchema = createInsertSchema(assignments).pick({
  title: true,
  description: true,
  sessionId: true,
  dueDate: true,
  maxPoints: true,
  rubric: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).pick({
  assignmentId: true,
  studentId: true,
  groupId: true,
  files: true,
});

export const insertGradeSchema = createInsertSchema(grades).pick({
  submissionId: true,
  instructorId: true,
  score: true,
  maxScore: true,
  rubricScores: true,
  feedback: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserWithRole = z.infer<typeof insertUserWithRoleSchema>;
export type User = typeof users.$inferSelect;

export type InsertLab = z.infer<typeof insertLabSchema>;
export type Lab = typeof labs.$inferSelect;

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

export type InsertComputer = z.infer<typeof insertComputerSchema>;
export type Computer = typeof computers.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignments.$inferSelect;

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;

export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Grade = typeof grades.$inferSelect;
