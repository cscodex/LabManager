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
  // Student-specific fields
  gradeLevel: integer("grade_level"), // 11 or 12 (nullable for instructors)
  tradeType: text("trade_type"), // "NM" (Non Medical), "M" (Medical), "C" (Commerce) - matches classes table
  section: text("section"), // "A" to "J" (nullable for instructors)
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

// Classes table with enhanced class-trade-section system
export const classes = pgTable("classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull(),
  gradeLevel: integer("grade_level").notNull(), // 11 or 12
  tradeType: text("trade_type").notNull(), // "NM" (Non Medical), "M" (Medical), "C" (Commerce)
  section: text("section").notNull(), // "A", "B", "C", etc.
  displayName: text("display_name").notNull(), // "11 NM A", "12 M B", etc.
  labId: varchar("lab_id").references(() => labs.id).notNull(),
  instructorId: varchar("instructor_id").references(() => users.id).notNull(),
  semester: text("semester").notNull(),
  year: integer("year").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one class per grade, trade, section, semester, and year
  uniqueClass: unique().on(table.gradeLevel, table.tradeType, table.section, table.semester, table.year),
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
  leaderId: varchar("leader_id").references(() => users.id), // Group leader (student)
  labId: varchar("lab_id").references(() => labs.id), // Lab assignment for group
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

// Weekly timetable structure
export const timetables = pgTable("timetables", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday, 2=Tuesday, ..., 7=Sunday
  startTime: text("start_time").notNull(), // "09:00", "10:30", etc.
  endTime: text("end_time").notNull(), // "10:30", "12:00", etc.
  labId: varchar("lab_id").references(() => labs.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one timetable slot per class per day and time
  uniqueTimetableSlot: unique().on(table.classId, table.dayOfWeek, table.startTime),
}));

// Lab sessions
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  classId: varchar("class_id").references(() => classes.id).notNull(),
  timetableId: varchar("timetable_id").references(() => timetables.id), // Optional: link to recurring timetable
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
// Base user schema without refinements (for extending in other places)
export const baseUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  gradeLevel: true,
  tradeType: true,
  section: true,
}).extend({
  // Validation for student fields - aligned with classes table
  gradeLevel: z.number().int().min(11).max(12).optional(),
  tradeType: z.enum(["NM", "M", "C"]).optional(),
  section: z.string().regex(/^[A-J]$/, "Section must be A through J").optional(),
});

// Security: Remove role from client-controlled schema to prevent privilege escalation
export const insertUserSchema = baseUserSchema.refine((data) => {
  // If any student field is provided, all must be provided
  const hasStudentFields = data.gradeLevel || data.tradeType || data.section;
  if (hasStudentFields) {
    return data.gradeLevel && data.tradeType && data.section;
  }
  return true;
}, {
  message: "Grade level, trade type, and section must all be provided together",
  path: ["gradeLevel"]
}).refine((data) => {
  // Section validation based on trade type (matches classes table rules)
  if (data.tradeType && data.section) {
    if (data.tradeType === "NM") {
      return /^[A-F]$/.test(data.section);
    } else if (data.tradeType === "M" || data.tradeType === "C") {
      return /^[A-B]$/.test(data.section);
    }
  }
  return true;
}, {
  message: "Section must be A-F for Non Medical (NM), A-B for Medical (M) or Commerce (C)",
  path: ["section"]
});

// Server-only schema that includes role (for admin operations)
export const insertUserWithRoleSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
  gradeLevel: true,
  tradeType: true,
  section: true,
}).extend({
  // Validation for student fields - aligned with classes table
  gradeLevel: z.number().int().min(11).max(12).optional(),
  tradeType: z.enum(["NM", "M", "C"]).optional(),
  section: z.string().regex(/^[A-J]$/, "Section must be A through J").optional(),
}).refine((data) => {
  // For students, require all student fields
  if (data.role === "student") {
    return data.gradeLevel && data.tradeType && data.section;
  }
  // For instructors, student fields should be null
  if (data.role === "instructor") {
    return !data.gradeLevel && !data.tradeType && !data.section;
  }
  return true;
}, {
  message: "Students must have grade level, trade type, and section. Instructors should not have these fields.",
  path: ["role"]
}).refine((data) => {
  // Section validation based on trade type (matches classes table rules)
  if (data.tradeType && data.section) {
    if (data.tradeType === "NM") {
      return /^[A-F]$/.test(data.section);
    } else if (data.tradeType === "M" || data.tradeType === "C") {
      return /^[A-B]$/.test(data.section);
    }
  }
  return true;
}, {
  message: "Section must be A-F for Non Medical (NM), A-B for Medical (M) or Commerce (C)",
  path: ["section"]
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
  gradeLevel: true,
  tradeType: true,
  section: true,
  labId: true,
  instructorId: true,
  semester: true,
  year: true,
}).extend({
  // Validation for grade levels
  gradeLevel: z.number().int().min(11).max(12),
  // Validation for trade types
  tradeType: z.enum(["NM", "M", "C"]),
  // Section validation based on trade type
  section: z.string(),
}).refine((data) => {
  // Dynamic section validation based on trade type
  if (data.tradeType === "NM") {
    return /^[A-F]$/.test(data.section);
  } else if (data.tradeType === "M" || data.tradeType === "C") {
    return /^[A-B]$/.test(data.section);
  }
  return false;
}, {
  message: "Section must be A-F for Non Medical, A-B for Medical/Commerce",
  path: ["section"]
});

export const insertTimetableSchema = createInsertSchema(timetables).pick({
  classId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  labId: true,
}).extend({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
}).refine((data) => {
  // Ensure endTime is after startTime
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  return timeToMinutes(data.endTime) > timeToMinutes(data.startTime);
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

export const insertComputerSchema = createInsertSchema(computers).pick({
  name: true,
  labId: true,
  specs: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  classId: true,
  leaderId: true,
  labId: true,
  computerId: true,
  maxMembers: true,
}).extend({
  maxMembers: z.number().int().min(1).max(10),
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
  timetableId: true,
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

export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type Timetable = typeof timetables.$inferSelect;

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
