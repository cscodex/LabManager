/**
 * Utility functions for simplified student-class assignment
 * Students are automatically assigned to classes based on their profile fields
 */

import type { User, Class } from './schema';

export interface StudentClassAssignment {
  student: User;
  assignedClass: Class | null;
  isValidAssignment: boolean;
  issues: string[];
}

export interface ClassStudentList {
  class: Class;
  students: User[];
  expectedCount: number;
  actualCount: number;
  isComplete: boolean;
}

/**
 * Get the class that a student should be assigned to based on their profile
 */
export function getStudentAssignedClass(
  student: User,
  availableClasses: Class[]
): Class | null {
  // Safety checks
  if (!student || !availableClasses || !Array.isArray(availableClasses)) {
    return null;
  }

  // Students must have complete profile for class assignment
  if (!student.gradeLevel || !student.tradeType || !student.section) {
    return null;
  }

  try {
    // Find matching class
    return availableClasses.find(cls =>
      cls && cls.gradeLevel === student.gradeLevel &&
      cls.tradeType === student.tradeType &&
      cls.section === student.section
    ) || null;
  } catch (error) {
    console.error('Error finding student assigned class:', error);
    return null;
  }
}

/**
 * Get all students that should be assigned to a specific class
 */
export function getStudentsForClass(
  targetClass: Class,
  allStudents: User[]
): User[] {
  if (!targetClass || !allStudents || !Array.isArray(allStudents)) {
    return [];
  }

  return allStudents.filter(student => {
    try {
      return student.role === 'student' &&
        student.gradeLevel === targetClass.gradeLevel &&
        student.tradeType === targetClass.tradeType &&
        student.section === targetClass.section;
    } catch (error) {
      console.error('Error filtering students for class:', error);
      return false;
    }
  });
}

/**
 * Validate a student's class assignment
 */
export function validateStudentClassAssignment(
  student: User,
  availableClasses: Class[]
): StudentClassAssignment {
  const issues: string[] = [];
  let isValidAssignment = true;

  // Check if student has required profile fields
  if (!student.gradeLevel) {
    issues.push('Missing grade level');
    isValidAssignment = false;
  }

  if (!student.tradeType) {
    issues.push('Missing trade type');
    isValidAssignment = false;
  }

  if (!student.section) {
    issues.push('Missing section');
    isValidAssignment = false;
  }

  // Check if student is actually a student
  if (student.role !== 'student') {
    issues.push('User is not a student');
    isValidAssignment = false;
  }

  // Try to find assigned class
  const assignedClass = getStudentAssignedClass(student, availableClasses);
  
  if (!assignedClass && isValidAssignment) {
    issues.push(`No class found for ${student.gradeLevel} ${student.tradeType} ${student.section}`);
    isValidAssignment = false;
  }

  return {
    student,
    assignedClass,
    isValidAssignment,
    issues
  };
}

/**
 * Get comprehensive class-student assignments for all classes
 */
export function getClassStudentAssignments(
  allClasses: Class[],
  allStudents: User[]
): ClassStudentList[] {
  return allClasses.map(cls => {
    const students = getStudentsForClass(cls, allStudents);
    const expectedCount = 10; // Each class should have 10 students
    
    return {
      class: cls,
      students,
      expectedCount,
      actualCount: students.length,
      isComplete: students.length === expectedCount
    };
  });
}

/**
 * Find students without valid class assignments
 */
export function getUnassignedStudents(
  allStudents: User[],
  availableClasses: Class[]
): StudentClassAssignment[] {
  return allStudents
    .filter(student => student.role === 'student')
    .map(student => validateStudentClassAssignment(student, availableClasses))
    .filter(assignment => !assignment.isValidAssignment);
}

/**
 * Generate class assignment summary report
 */
export function generateClassAssignmentReport(
  allClasses: Class[],
  allStudents: User[]
): {
  totalClasses: number;
  totalStudents: number;
  completeClasses: number;
  incompleteClasses: number;
  unassignedStudents: number;
  classDetails: ClassStudentList[];
  unassignedDetails: StudentClassAssignment[];
} {
  const classAssignments = getClassStudentAssignments(allClasses, allStudents);
  const unassignedStudents = getUnassignedStudents(allStudents, allClasses);
  
  const completeClasses = classAssignments.filter(ca => ca.isComplete).length;
  const incompleteClasses = classAssignments.length - completeClasses;

  return {
    totalClasses: allClasses.length,
    totalStudents: allStudents.filter(s => s.role === 'student').length,
    completeClasses,
    incompleteClasses,
    unassignedStudents: unassignedStudents.length,
    classDetails: classAssignments,
    unassignedDetails: unassignedStudents
  };
}

/**
 * Check if a student profile change would result in a valid class assignment
 */
export function validateProfileChange(
  currentStudent: User,
  profileChanges: Partial<Pick<User, 'gradeLevel' | 'tradeType' | 'section'>>,
  availableClasses: Class[]
): {
  isValid: boolean;
  newClass: Class | null;
  currentClass: Class | null;
  issues: string[];
} {
  const updatedStudent = { ...currentStudent, ...profileChanges };
  const currentClass = getStudentAssignedClass(currentStudent, availableClasses);
  const newClass = getStudentAssignedClass(updatedStudent, availableClasses);
  
  const issues: string[] = [];
  let isValid = true;

  // Check if new profile would result in valid assignment
  if (!newClass && (updatedStudent.gradeLevel && updatedStudent.tradeType && updatedStudent.section)) {
    issues.push(`No class exists for ${updatedStudent.gradeLevel} ${updatedStudent.tradeType} ${updatedStudent.section}`);
    isValid = false;
  }

  // Check for incomplete profile
  if (!updatedStudent.gradeLevel || !updatedStudent.tradeType || !updatedStudent.section) {
    issues.push('Profile must include grade level, trade type, and section');
    isValid = false;
  }

  return {
    isValid,
    newClass,
    currentClass,
    issues
  };
}

/**
 * Get valid profile options for student assignment
 */
export function getValidProfileOptions(availableClasses: Class[]): {
  gradeLevels: number[];
  tradeTypes: string[];
  sections: string[];
  validCombinations: Array<{
    gradeLevel: number;
    tradeType: string;
    section: string;
    className: string;
  }>;
} {
  const gradeLevels = Array.from(new Set(availableClasses.map(c => c.gradeLevel))).sort();
  const tradeTypes = Array.from(new Set(availableClasses.map(c => c.tradeType))).sort();
  const sections = Array.from(new Set(availableClasses.map(c => c.section))).sort();
  
  const validCombinations = availableClasses.map(cls => ({
    gradeLevel: cls.gradeLevel,
    tradeType: cls.tradeType,
    section: cls.section,
    className: cls.displayName
  }));

  return {
    gradeLevels,
    tradeTypes,
    sections,
    validCombinations
  };
}

/**
 * Helper function to format class assignment for display
 */
export function formatClassAssignment(assignment: StudentClassAssignment): string {
  if (assignment.isValidAssignment && assignment.assignedClass) {
    return assignment.assignedClass.displayName;
  }
  
  if (assignment.issues.length > 0) {
    return `Unassigned (${assignment.issues.join(', ')})`;
  }
  
  return 'Unassigned';
}

/**
 * Helper function to get class display name from student profile
 */
export function getClassDisplayNameFromProfile(
  gradeLevel?: number | null,
  tradeType?: string | null,
  section?: string | null
): string {
  if (!gradeLevel || !tradeType || !section) {
    return 'Incomplete Profile';
  }
  
  return `${gradeLevel} ${tradeType} ${section}`;
}
