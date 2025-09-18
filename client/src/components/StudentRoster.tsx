import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Mail, MoreVertical, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User, Class, Enrollment } from "@shared/schema";

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

export function StudentRoster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch all students with role 'student'
  const { data: students = [], isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['/api/students'],
    select: (data) => data?.filter((user: User) => user.role === 'student') || []
  });

  // Fetch all enrollments with detailed information
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError } = useQuery({
    queryKey: ['/api/enrollments/details']
  });

  const isLoading = studentsLoading || enrollmentsLoading;
  const hasError = studentsError || enrollmentsError;

  // Filter students based on search term
  const filteredEnrollments = enrollments.filter((enrollment: EnrollmentWithDetails) => {
    const student = enrollment.student;
    const className = enrollment.class?.displayName || '';
    const searchString = `${student?.firstName || ''} ${student?.lastName || ''} ${student?.email || ''} ${className} ${enrollment.group?.name || ''} ${enrollment.lab?.name || ''}`;
    return searchString.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
    console.log('Student selected:', studentId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Student Roster</h2>
          <p className="text-muted-foreground">Manage student enrollments and track progress</p>
        </div>
        <Button data-testid="button-add-student" onClick={() => console.log('Add student clicked')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Students ({isLoading ? '...' : filteredEnrollments.length})</span>
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => console.log('More options for', studentName)}
                        data-testid={`button-more-${student.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}