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
import { Plus, Search, Mail, MoreVertical, AlertCircle, Edit, Trash2, UserPlus, Filter } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Class, Enrollment, Lab, Group, insertUserSchema } from "@shared/schema";

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

// Form schemas
const addStudentSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterLab, setFilterLab] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Fetch all students with role 'student'
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['/api/students'],
    select: (data) => data?.filter((user: User) => user.role === 'student') || []
  });

  // Fetch all enrollments with detailed information
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError } = useQuery({
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
  const filteredEnrollments = enrollments.filter((enrollment: EnrollmentWithDetails) => {
    const student = enrollment.student;
    const className = enrollment.class?.displayName || '';
    const labName = enrollment.lab?.name || '';
    const groupName = enrollment.group?.name || '';
    
    // Search filter
    const searchString = `${student?.firstName || ''} ${student?.lastName || ''} ${student?.email || ''} ${student?.id || ''} ${className} ${groupName} ${labName}`;
    const matchesSearch = searchString.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Class filter
    const matchesClass = filterClass === 'all' || enrollment.classId === filterClass;
    
    // Lab filter  
    const matchesLab = filterLab === 'all' || enrollment.lab?.name === filterLab;
    
    // Group filter
    const matchesGroup = filterGroup === 'all' || enrollment.group?.name === filterGroup;
    
    return matchesSearch && matchesClass && matchesLab && matchesGroup;
  });

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredEnrollments.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredEnrollments.map(e => e.student!.id));
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

  const handleAddStudent = (data: AddStudentFormData) => {
    addStudentMutation.mutate(data);
  };

  const handleEnrollStudent = (data: EnrollStudentFormData) => {
    if (selectedStudentForEnroll) {
      enrollStudentMutation.mutate({ ...data, studentId: selectedStudentForEnroll });
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    // TODO: Implement delete student functionality
    toast({
      title: "Not implemented",
      description: "Delete student functionality coming soon",
    });
  };

  const handleEnrollInClass = (studentId: string) => {
    setSelectedStudentForEnroll(studentId);
    setShowEnrollDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Student Roster</h2>
          <p className="text-muted-foreground">Manage student enrollments and track progress</p>
        </div>
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
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addStudentMutation.isPending}
                    data-testid="button-add-student-submit"
                  >
                    {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger data-testid="select-filter-class">
                    <SelectValue placeholder="Filter by Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.displayName} - {classItem.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <Select value={filterLab} onValueChange={setFilterLab}>
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
                <Select value={filterGroup} onValueChange={setFilterGroup}>
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
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Students ({isLoading ? '...' : filteredEnrollments.length})</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === filteredEnrollments.length && filteredEnrollments.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                  data-testid="checkbox-select-all"
                />
                <label className="text-sm text-muted-foreground">Select All</label>
              </div>
            </div>
            {selectedStudents.length > 0 && (
              <Badge variant="secondary" data-testid="badge-selected">
                {selectedStudents.length} selected
              </Badge>
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
          ) : filteredEnrollments.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <span>No students found.</span>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEnrollments.map((enrollment: EnrollmentWithDetails) => {
                const student = enrollment.student!;
                const studentName = `${student.firstName} ${student.lastName}`;
                const className = enrollment.class?.displayName || 'Unknown Class';
                const instructorName = enrollment.instructor ? `${enrollment.instructor.firstName} ${enrollment.instructor.lastName}` : 'Unknown';
                
                return (
                  <div 
                    key={enrollment.id} 
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
                          <span>•</span>
                          <span className="font-medium">{className}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {enrollment.lab && (
                            <Badge variant="outline" className="text-xs">{enrollment.lab.name}</Badge>
                          )}
                          {enrollment.group && (
                            <Badge variant="secondary" className="text-xs">{enrollment.group.name}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {enrollment.seatNumber && (
                          <div className="font-medium">Seat: {enrollment.seatNumber}</div>
                        )}
                        {enrollment.computer && (
                          <div>Computer: {enrollment.computer.name}</div>
                        )}
                        <div className="text-xs">Instructor: {instructorName}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {enrollment.completedSessions || 0}/{enrollment.totalSessions || 0} Sessions
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {enrollment.totalSessions ? Math.round(((enrollment.completedSessions || 0) / enrollment.totalSessions) * 100) : 0}% complete
                        </div>
                      </div>
                      <Badge 
                        variant={enrollment.isActive ? 'secondary' : 'outline'}
                        data-testid={`badge-status-${student.id}`}
                      >
                        {enrollment.isActive ? 'active' : 'inactive'}
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
                          <DropdownMenuItem onClick={() => handleEnrollInClass(student.id)} data-testid={`menu-enroll-${student.id}`}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Enroll in Class
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log('Edit student:', student.id)} data-testid={`menu-edit-${student.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Student
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteStudent(student.id)} 
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
    </div>
  );
}