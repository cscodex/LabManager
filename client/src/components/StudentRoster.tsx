import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Plus, Search, Mail, MoreVertical, AlertCircle, Edit, Trash2, UserPlus, Filter, ChevronLeft, ChevronRight, Upload, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Class, Enrollment, Lab, Group } from "@shared/schema";
import { baseUserSchema } from "@shared/schema";
import {
  getStudentAssignedClass as getStudentAssignedClassUtil,
  validateStudentClassAssignment,
  getClassDisplayNameFromProfile,
  formatClassAssignment,
  type StudentClassAssignment
} from "@shared/student-class-utils";

interface StudentEnrollmentDetails {
  student: User;
  enrollment: Enrollment;
  class: Class;
  instructor: User;
  labName: string;
  groupName?: string;
  computerName?: string;
  completedSessions?: number;
  totalSessions?: number;
}

interface EnrollmentWithDetails {
  id: string;
  studentId: string;
  classId: string;
  groupId?: string;
  seatNumber?: string;
  enrolledAt: string;
  isActive: boolean;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    displayName: string;
    gradeLevel: number;
    tradeType: string;
    section: string;
  };
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  lab?: {
    name: string;
  };
  group?: {
    name: string;
  };
  computer?: {
    name: string;
  };
}

// Form schemas - extend the shared schema for consistency
const addStudentSchema = baseUserSchema.extend({
  gradeLevel: z.number().int().min(11).max(12), // Make required for students
  tradeType: z.enum(["NM", "M", "C"]), // Make required for students
  section: z.string().regex(/^[A-J]$/, "Section must be A through J"), // Make required for students
  studentId: z.string().min(1, "Student ID is required").optional(),
  gender: z.enum(["male", "female"]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => {
  // Section validation based on trade type (matches backend rules)
  if (data.tradeType === "NM") {
    return /^[A-F]$/.test(data.section);
  } else if (data.tradeType === "M" || data.tradeType === "C") {
    return /^[G-J]$/.test(data.section);
  }
  return true;
}, {
  message: "Section must be A-F for Non Medical (NM), G-H for Medical (M), I-J for Commerce (C)",
  path: ["section"]
});

const enrollStudentSchema = z.object({
  classId: z.string().min(1, "Please select a class"),
  groupId: z.string().optional(),
  seatNumber: z.string().optional(),
});

type AddStudentFormData = z.infer<typeof addStudentSchema>;
type EnrollStudentFormData = z.infer<typeof enrollStudentSchema>;

export function StudentRoster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [filterClasses, setFilterClasses] = useState<string[]>([]);
  const [filterLab, setFilterLab] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | null>(null);
  const [selectedTradeType, setSelectedTradeType] = useState<string>("NM");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Increased to show more students by default
  
  // Additional filters for new student fields
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterTrade, setFilterTrade] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  
  const { toast } = useToast();

  // Fetch all students with role 'student'
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useQuery<User[]>({
    queryKey: ['/api/students'],
    select: (data: User[]) => data?.filter((user: User) => user.role === 'student') || []
  });

  // Fetch all enrollments with detailed information
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError } = useQuery<EnrollmentWithDetails[]>({
    queryKey: ['/api/enrollments/details']
  });

  // Fetch classes for filters and forms
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes']
  });

  // Fetch labs for filters
  const { data: labs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs']
  });

  // Fetch groups for filters and forms
  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups']
  });

  const isLoading = studentsLoading || enrollmentsLoading;
  const hasError = studentsError || enrollmentsError;

  // Filter students based on search term and filters
  const filteredStudents = React.useMemo(() => {
    if (!students || !Array.isArray(students)) {
      return [];
    }

    return students.filter((student: User) => {
      try {
        // Search filter
        const searchString = `${student.firstName || ''} ${student.lastName || ''} ${student.email || ''} ${student.id || ''} ${student.studentId || ''}`;
        const matchesSearch = searchString.toLowerCase().includes(searchTerm.toLowerCase());

        // Grade level filter (for student properties)
        const matchesGrade = filterGrade === 'all' || student.gradeLevel?.toString() === filterGrade;

        // Trade type filter (for student properties)
        const matchesTrade = filterTrade === 'all' || student.tradeType === filterTrade;

        // Section filter (for student properties)
        const matchesSection = filterSection === 'all' || student.section === filterSection;

        // Find student's enrollment for enrollment-based filters
        const studentEnrollment = enrollments?.find(e => e.student?.id === student.id);

        // Class filter (based on student profile) - supports multiple selection
        let matchesClass = true;
        if (filterClasses.length > 0) {
          try {
            const studentClass = getStudentClass(student);
            matchesClass = studentClass?.id && filterClasses.includes(studentClass.id);
          } catch (error) {
            console.error('Error in class filter:', error);
            matchesClass = false;
          }
        }

        // Lab filter (based on enrollment)
        const matchesLab = filterLab === 'all' || (studentEnrollment && studentEnrollment.lab?.name === filterLab);

        // Group filter (based on enrollment)
        const matchesGroup = filterGroup === 'all' || (studentEnrollment && studentEnrollment.group?.name === filterGroup);

        return matchesSearch && matchesGrade && matchesTrade && matchesSection && matchesClass && matchesLab && matchesGroup;
      } catch (error) {
        console.error('Error filtering student:', error, student);
        return false;
      }
    });
  }, [students, searchTerm, filterGrade, filterTrade, filterSection, filterClasses, filterLab, filterGroup, enrollments]);

  // Pagination logic
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset pagination when filters change
  const resetPagination = () => setCurrentPage(1);

  // Get class assignment for student based on profile (simplified system)
  const getStudentClassAssignment = (student: User): StudentClassAssignment => {
    try {
      return validateStudentClassAssignment(student, classes || []);
    } catch (error) {
      console.error('Error validating student class assignment:', error);
      return {
        student,
        assignedClass: null,
        isValidAssignment: false,
        issues: ['Error validating assignment']
      };
    }
  };

  // Get student's assigned class based on profile
  const getStudentClass = (student: User) => {
    try {
      return getStudentAssignedClassUtil(student, classes || []);
    } catch (error) {
      console.error('Error getting student class:', error);
      return null;
    }
  };

  // Get enrollment details for each student (legacy system for groups/seats)
  const getStudentEnrollment = (studentId: string): StudentEnrollmentDetails | null => {
    const enrollment = enrollments.find(e => e.studentId === studentId);
    if (!enrollment) return null;

    const enrolledClass = classes.find(c => c.id === enrollment.classId);
    const lab = enrolledClass ? labs.find(l => l.id === enrolledClass.labId) : null;
    const group = enrollment.groupId ? groups.find(g => g.id === enrollment.groupId) : null;

    return {
      student: students.find(s => s.id === studentId)!,
      enrollment: enrollment!,
      class: enrolledClass!,
      lab: lab || null,
      group: group || null
    };
  };

  // Guard against out-of-range pages when filters or search change
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  // Reset pagination when search term or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterClasses, filterLab, filterGroup, filterGrade, filterTrade, filterSection]);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      try {
        return prev.includes(studentId)
          ? prev.filter(id => id !== studentId)
          : [...prev, studentId];
      } catch (error) {
        console.error('Error selecting student:', error);
        return prev;
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((student: User) => student.id));
    }
  };

  // Forms
  const addStudentForm = useForm<AddStudentFormData>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      studentId: "",
      gender: undefined,
      phone: "",
      address: "",
      gradeLevel: 11,
      tradeType: "NM",
      section: "A",
    }
  });

  const enrollStudentForm = useForm<EnrollStudentFormData>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      classId: "",
      groupId: "",
      seatNumber: "",
    }
  });

  // Mutations
  const addStudentMutation = useMutation({
    mutationFn: async (data: AddStudentFormData) => {
      const response = await apiRequest("POST", "/api/students", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      setShowAddDialog(false);
      addStudentForm.reset();
      toast({
        title: "Success",
        description: "Student added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (data: EnrollStudentFormData & { studentId: string }) => {
      const response = await apiRequest("POST", "/api/enrollments", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      setShowEnrollDialog(false);
      setSelectedStudentForEnroll(null);
      enrollStudentForm.reset();
      toast({
        title: "Success", 
        description: "Student enrolled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      });
    },
  });

  const importStudentsMutation = useMutation({
    mutationFn: async (studentsData: AddStudentFormData[]) => {
      const response = await apiRequest("POST", "/api/students/bulk-import", { students: studentsData });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }
      return await response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      
      // Handle partial success (when there are errors)
      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        toast({ 
          title: "Partial Import Success",
          description: `${result.imported || 0} students imported, ${result.errors.length} failed. Check errors below.`,
          variant: "destructive"
        });
        // Don't close dialog so user can see errors
      } else {
        // Complete success
        toast({ 
          title: "Import Successful",
          description: `${result.imported || 0} students imported successfully`
        });
        setShowImportDialog(false);
        setImportFile(null);
        setImportErrors([]);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Import Failed", 
        description: error.message || "Failed to import students", 
        variant: "destructive" 
      });
    },
  });

  const handleAddStudent = (data: AddStudentFormData) => {
    addStudentMutation.mutate(data);
  };

  const handleEnrollStudent = (data: EnrollStudentFormData) => {
    if (selectedStudentForEnroll) {
      enrollStudentMutation.mutate({ ...data, studentId: selectedStudentForEnroll });
    }
  };

  // Additional state for dialogs and operations
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStudentForDelete, setSelectedStudentForDelete] = useState<User | null>(null);

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await apiRequest("DELETE", `/api/students/${studentId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete student');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      setShowDeleteDialog(false);
      setSelectedStudentForDelete(null);
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  // Unenroll student mutation
  const unenrollStudentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await apiRequest("DELETE", `/api/enrollments/${enrollmentId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unenroll student');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      toast({
        title: "Success",
        description: "Student unenrolled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unenroll student",
        variant: "destructive",
      });
    },
  });

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: async (data: { studentId: string; updates: Partial<AddStudentFormData> }) => {
      const response = await apiRequest("PATCH", `/api/students/${data.studentId}`, data.updates);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update student');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments/details'] });
      setShowEditDialog(false);
      setSelectedStudentForEdit(null);
      addStudentForm.reset();
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update student",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = (student: User) => {
    setSelectedStudentForDelete(student);
    setShowDeleteDialog(true);
  };

  const handleEditStudent = (student: User) => {
    setSelectedStudentForEdit(student);
    // Pre-populate form with student data
    addStudentForm.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      studentId: student.studentId || '',
      gender: (student.gender === 'male' || student.gender === 'female') ? student.gender : undefined,
      phone: student.phone || '',
      address: student.address || '',
      gradeLevel: student.gradeLevel || 11,
      tradeType: (student.tradeType === 'NM' || student.tradeType === 'M' || student.tradeType === 'C') ? student.tradeType : 'NM',
      section: student.section || 'A',
    });
    setShowEditDialog(true);
  };

  const handleUnenrollStudent = (enrollmentId: string) => {
    unenrollStudentMutation.mutate(enrollmentId);
  };

  const confirmDeleteStudent = () => {
    if (selectedStudentForDelete) {
      deleteStudentMutation.mutate(selectedStudentForDelete.id);
    }
  };

  const handleEditSubmit = (data: AddStudentFormData) => {
    if (selectedStudentForEdit) {
      editStudentMutation.mutate({
        studentId: selectedStudentForEdit.id,
        updates: data
      });
    }
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select students to delete",
        variant: "destructive",
      });
      return;
    }

    // Check if any selected students have enrollments
    const studentsWithEnrollments = selectedStudents.filter(studentId => {
      try {
        return enrollments?.some(e => e.student?.id === studentId) || false;
      } catch (error) {
        console.error('Error checking enrollments:', error);
        return false;
      }
    });

    if (studentsWithEnrollments.length > 0) {
      toast({
        title: "Cannot delete enrolled students",
        description: `${studentsWithEnrollments.length} selected students have active enrollments. Please unenroll them first.`,
        variant: "destructive",
      });
      return;
    }

    // Proceed with bulk delete
    Promise.all(
      selectedStudents.map(studentId =>
        deleteStudentMutation.mutateAsync(studentId)
      )
    ).then(() => {
      setSelectedStudents([]);
      toast({
        title: "Success",
        description: `${selectedStudents.length} students deleted successfully`,
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Some students could not be deleted",
        variant: "destructive",
      });
    });
  };

  const handleBulkEnroll = (classId: string) => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select students to enroll",
        variant: "destructive",
      });
      return;
    }

    // Check if any selected students are already enrolled
    const alreadyEnrolled = selectedStudents.filter(studentId => {
      try {
        return enrollments?.some(e => e.student?.id === studentId && e.isActive) || false;
      } catch (error) {
        console.error('Error checking active enrollments:', error);
        return false;
      }
    });

    if (alreadyEnrolled.length > 0) {
      toast({
        title: "Some students already enrolled",
        description: `${alreadyEnrolled.length} selected students are already enrolled in classes`,
        variant: "destructive",
      });
      return;
    }

    // Proceed with bulk enrollment
    Promise.all(
      selectedStudents.map(studentId =>
        enrollStudentMutation.mutateAsync({ classId, studentId })
      )
    ).then(() => {
      setSelectedStudents([]);
      toast({
        title: "Success",
        description: `${selectedStudents.length} students enrolled successfully`,
      });
    }).catch((error) => {
      toast({
        title: "Error",
        description: "Some students could not be enrolled",
        variant: "destructive",
      });
    });
  };

  const handleEnrollInClass = (studentId: string) => {
    setSelectedStudentForEnroll(studentId);
    setShowEnrollDialog(true);
  };

  const parseCSVFile = (file: File): Promise<AddStudentFormData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV must have at least a header row and one data row'));
            return;
          }

          // Expected headers: firstName,lastName,email,studentId,gender,phone,address,gradeLevel,tradeType,section
          const headers = lines[0].split(',').map(h => h.trim());
          const expectedHeaders = ['firstName', 'lastName', 'email', 'gradeLevel', 'tradeType', 'section'];
          const optionalHeaders = ['studentId', 'gender', 'phone', 'address'];
          
          const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
            return;
          }

          const students: AddStudentFormData[] = [];
          const errors: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const rowData: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              rowData[header] = values[index] || '';
            });

            try {
              // Parse and validate each student
              const studentData = {
                firstName: rowData.firstName,
                lastName: rowData.lastName,
                email: rowData.email,
                studentId: rowData.studentId || undefined,
                gender: rowData.gender || undefined,
                phone: rowData.phone || undefined,
                address: rowData.address || undefined,
                gradeLevel: parseInt(rowData.gradeLevel),
                tradeType: rowData.tradeType,
                section: rowData.section,
                role: 'student' as const,
                password: 'defaultPassword123' // Will be changed on first login
              };

              // Validate against schema
              const result = addStudentSchema.safeParse(studentData);
              if (!result.success) {
                errors.push(`Row ${i + 1}: ${result.error.issues.map(issue => issue.message).join(', ')}`);
              } else {
                students.push(result.data);
              }
            } catch (error) {
              errors.push(`Row ${i + 1}: Invalid data format`);
            }
          }

          if (errors.length > 0) {
            setImportErrors(errors);
            reject(new Error(`Validation errors found. Check the error list.`));
          } else {
            resolve(students);
          }
        } catch (error) {
          reject(new Error('Failed to parse CSV file. Please check the format.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportErrors([]);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    
    try {
      const students = await parseCSVFile(importFile);
      importStudentsMutation.mutate(students);
    } catch (error) {
      // Errors are already set in parseCSVFile
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Student Roster</h2>
          <p className="text-muted-foreground">Manage student enrollments and track progress</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a new student account. Students can be enrolled in classes after creation.
                </DialogDescription>
              </DialogHeader>
              <Form {...addStudentForm}>
                <form onSubmit={addStudentForm.handleSubmit(handleAddStudent)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addStudentForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-first-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addStudentForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-last-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addStudentForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addStudentForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" data-testid="input-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addStudentForm.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-student-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addStudentForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-gender">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addStudentForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addStudentForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={addStudentForm.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-grade">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="11">Grade 11</SelectItem>
                              <SelectItem value="12">Grade 12</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addStudentForm.control}
                      name="tradeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedTradeType(value);
                              // Reset section when trade changes
                              addStudentForm.setValue("section", "");
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-trade">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NM">Non Medical</SelectItem>
                              <SelectItem value="M">Medical</SelectItem>
                              <SelectItem value="C">Commerce</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addStudentForm.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-section">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedTradeType === "NM" && (
                                <>
                                  <SelectItem value="A">Section A</SelectItem>
                                  <SelectItem value="B">Section B</SelectItem>
                                  <SelectItem value="C">Section C</SelectItem>
                                  <SelectItem value="D">Section D</SelectItem>
                                  <SelectItem value="E">Section E</SelectItem>
                                  <SelectItem value="F">Section F</SelectItem>
                                </>
                              )}
                              {selectedTradeType === "M" && (
                                <>
                                  <SelectItem value="G">Section G</SelectItem>
                                  <SelectItem value="H">Section H</SelectItem>
                                </>
                              )}
                              {selectedTradeType === "C" && (
                                <>
                                  <SelectItem value="I">Section I</SelectItem>
                                  <SelectItem value="J">Section J</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addStudentMutation.isPending}
                      data-testid="button-submit-student"
                    >
                      {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            data-testid="button-import-students"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
        </div>
      </div>
      


      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, ID, lab, class, or group..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-export">
                  Export
                </Button>
                <Button variant="outline" size="sm" data-testid="button-import">
                  Import
                </Button>
              </div>
            </div>
            
            {/* Primary Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <MultiSelect
                  options={classes.map((classItem): MultiSelectOption => ({
                    label: `${classItem.displayName} - ${classItem.name}`,
                    value: classItem.id
                  }))}
                  selected={filterClasses}
                  onChange={(selected) => { setFilterClasses(selected); resetPagination(); }}
                  placeholder="Filter by Classes"
                  className="w-full"
                />
              </div>
              
              <div className="flex-1">
                <Select value={filterLab} onValueChange={(value) => { setFilterLab(value); resetPagination(); }}>
                  <SelectTrigger data-testid="select-filter-lab">
                    <SelectValue placeholder="Filter by Lab" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labs</SelectItem>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.name}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={filterGroup} onValueChange={(value) => { setFilterGroup(value); resetPagination(); }}>
                  <SelectTrigger data-testid="select-filter-group">
                    <SelectValue placeholder="Filter by Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.name}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Student Classification Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={filterGrade} onValueChange={(value) => { setFilterGrade(value); resetPagination(); }}>
                  <SelectTrigger data-testid="select-filter-grade">
                    <SelectValue placeholder="Filter by Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={filterTrade} onValueChange={(value) => { setFilterTrade(value); resetPagination(); }}>
                  <SelectTrigger data-testid="select-filter-trade">
                    <SelectValue placeholder="Filter by Trade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="NM">Non Medical</SelectItem>
                    <SelectItem value="M">Medical</SelectItem>
                    <SelectItem value="C">Commerce</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={filterSection} onValueChange={(value) => { setFilterSection(value); resetPagination(); }}>
                  <SelectTrigger data-testid="select-filter-section">
                    <SelectValue placeholder="Filter by Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].map((section) => (
                      <SelectItem key={section} value={section}>
                        Section {section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={pageSize.toString()} onValueChange={(value) => { setPageSize(parseInt(value)); resetPagination(); }}>
                  <SelectTrigger data-testid="select-page-size">
                    <SelectValue placeholder="Items per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                    <SelectItem value="250">250 per page</SelectItem>
                    <SelectItem value="1000">Show All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Students ({isLoading ? '...' : `${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}`})</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                  data-testid="checkbox-select-all"
                />
                <label className="text-sm text-muted-foreground">Select All</label>
              </div>
            </div>
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" data-testid="badge-selected">
                  {selectedStudents.length} selected
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // TODO: Implement bulk profile editing
                      toast({
                        title: "Feature Coming Soon",
                        description: "Bulk profile editing will be available soon",
                      });
                    }}
                    data-testid="button-bulk-edit"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bulk Edit Profiles
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    data-testid="button-bulk-delete"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasError ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>Failed to load students. Please try again.</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <span>No students found.</span>
            </div>
          ) : (
            <div className="divide-y">
              {paginatedStudents.map((student: User) => {
                const studentName = `${student.firstName} ${student.lastName}`;
                // Find enrollment for this student to show additional info
                const studentEnrollment = enrollments.find(e => e.student?.id === student.id);
                
                return (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 hover-elevate"
                    data-testid={`student-row-${student.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                        className="h-4 w-4"
                        data-testid={`checkbox-student-${student.id}`}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-foreground" data-testid={`text-student-name-${student.id}`}>
                          {studentName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                          <span>ID: {student.id.slice(0, 8)}</span>
                          {student.gradeLevel && (
                            <>
                              <span>•</span>
                              <span>Grade {student.gradeLevel}</span>
                            </>
                          )}
                          {student.tradeType && (
                            <>
                              <span>•</span>
                              <span>{student.tradeType === 'NM' ? 'Non Medical' : student.tradeType === 'M' ? 'Medical' : 'Commerce'}</span>
                            </>
                          )}
                          {student.section && (
                            <>
                              <span>•</span>
                              <span>Section {student.section}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {/* Show class based on student profile */}
                          {(() => {
                            try {
                              const assignedClass = getStudentClass(student);
                              return assignedClass ? (
                                <Badge variant="default" className="text-xs">
                                  {assignedClass.displayName || 'Unknown Class'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  {getClassDisplayNameFromProfile(student.gradeLevel, student.tradeType, student.section)}
                                </Badge>
                              );
                            } catch (error) {
                              console.error('Error rendering class badge:', error);
                              return (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  Error Loading Class
                                </Badge>
                              );
                            }
                          })()}

                          {/* Show enrollment-based info for groups/labs */}
                          {studentEnrollment?.lab && (
                            <Badge variant="outline" className="text-xs">{studentEnrollment.lab.name}</Badge>
                          )}
                          {studentEnrollment?.group && (
                            <Badge variant="secondary" className="text-xs">{studentEnrollment.group.name}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {studentEnrollment?.seatNumber && (
                          <div className="font-medium">Seat: {studentEnrollment.seatNumber}</div>
                        )}
                        {studentEnrollment?.computer && (
                          <div>Computer: {studentEnrollment.computer.name}</div>
                        )}
                        {studentEnrollment?.instructor && (
                          <div className="text-xs">Instructor: {studentEnrollment.instructor.firstName} {studentEnrollment.instructor.lastName}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(() => {
                            const assignedClass = getStudentClass(student);
                            return assignedClass ? 'Assigned' : 'Unassigned';
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                      <Badge
                        variant={(() => {
                          const assignedClass = getStudentClass(student);
                          return assignedClass ? 'secondary' : 'outline';
                        })()}
                        data-testid={`badge-status-${student.id}`}
                      >
                        {(() => {
                          const assignedClass = getStudentClass(student);
                          return assignedClass ? 'assigned' : 'unassigned';
                        })()}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-more-${student.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStudent(student)} data-testid={`menu-edit-${student.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Student Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteStudent(student)}
                            className="text-destructive"
                            data-testid={`menu-delete-${student.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Page {currentPage} of {totalPages}</span>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    data-testid="button-prev-page"
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        data-testid={`button-page-${pageNum}`}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        data-testid={`button-page-${totalPages}`}
                        className="cursor-pointer"
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    data-testid="button-next-page"
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enroll Student in Class</DialogTitle>
            <DialogDescription>
              Select a class and optionally assign the student to a group.
            </DialogDescription>
          </DialogHeader>
          <Form {...enrollStudentForm}>
            <form onSubmit={enrollStudentForm.handleSubmit(handleEnrollStudent)} className="space-y-4">
              <FormField
                control={enrollStudentForm.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-enrollment-class">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.displayName} - {classItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enrollStudentForm.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-enrollment-group">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Group</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={enrollStudentForm.control}
                name="seatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seat Number (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., A-12" data-testid="input-seat-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEnrollDialog(false)}
                  data-testid="button-cancel-enrollment"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={enrollStudentMutation.isPending}
                  data-testid="button-enroll-submit"
                >
                  {enrollStudentMutation.isPending ? "Enrolling..." : "Enroll Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Students Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Students from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with student data. Expected columns: firstName, lastName, email, gradeLevel, tradeType, section
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="csv-file" className="block text-sm font-medium mb-2">
                Select CSV File
              </label>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                data-testid="input-csv-file"
                className="w-full p-2 border border-input rounded-md"
              />
            </div>
            
            {importFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {importFile.name}
              </div>
            )}
            
            {importErrors.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-destructive/30 rounded-md p-3">
                <h4 className="text-sm font-medium text-destructive mb-2">Import Errors:</h4>
                <ul className="text-sm space-y-1">
                  {importErrors.map((error, index) => (
                    <li key={index} className="text-destructive">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p><strong>CSV Format:</strong></p>
              <p>firstName,lastName,email,gradeLevel,tradeType,section</p>
              <p><strong>Example:</strong></p>
              <p>John,Smith,john.smith@example.com,11,NM,A</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
                setImportErrors([]);
              }}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={!importFile || importStudentsMutation.isPending}
              data-testid="button-submit-import"
            >
              {importStudentsMutation.isPending ? "Importing..." : "Import Students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information and profile details.
            </DialogDescription>
          </DialogHeader>
          <Form {...addStudentForm}>
            <form onSubmit={addStudentForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addStudentForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStudentForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={addStudentForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-edit-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addStudentForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-student-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addStudentForm.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editStudentMutation.isPending}
                  data-testid="button-submit-edit"
                >
                  {editStudentMutation.isPending ? "Updating..." : "Update Student"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedStudentForDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {selectedStudentForDelete.firstName[0]}{selectedStudentForDelete.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedStudentForDelete.firstName} {selectedStudentForDelete.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedStudentForDelete.email}
                  </div>
                  {selectedStudentForDelete.studentId && (
                    <div className="text-xs text-muted-foreground">
                      ID: {selectedStudentForDelete.studentId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteStudent}
              disabled={deleteStudentMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}