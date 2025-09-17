import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Mail, MoreVertical } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockStudents = [
  { 
    id: "1", 
    name: "Emma Johnson", 
    email: "emma.j@university.edu", 
    studentId: "2023001", 
    status: "active",
    lab: "Lab A - Chemistry",
    instructor: "Dr. Smith", 
    class: "CHEM 101 - Section A",
    group: "Group 1",
    seat: "A-12",
    computer: "PC-03",
    completedLabs: 8,
    totalLabs: 12
  },
  { 
    id: "2", 
    name: "Michael Chen", 
    email: "michael.c@university.edu", 
    studentId: "2023002", 
    status: "active",
    lab: "Lab B - Biology",
    instructor: "Prof. Johnson", 
    class: "BIO 201 - Section B",
    group: "Group 3",
    seat: "B-08",
    computer: "PC-11",
    completedLabs: 10,
    totalLabs: 12
  },
  { 
    id: "3", 
    name: "Sarah Williams", 
    email: "sarah.w@university.edu", 
    studentId: "2023003", 
    status: "inactive",
    lab: "Lab A - Chemistry",
    instructor: "Dr. Smith", 
    class: "CHEM 101 - Section A",
    group: "Group 2",
    seat: "A-05",
    computer: "PC-07",
    completedLabs: 6,
    totalLabs: 12
  },
  { 
    id: "4", 
    name: "David Rodriguez", 
    email: "david.r@university.edu", 
    studentId: "2023004", 
    status: "active",
    lab: "Lab B - Biology",
    instructor: "Prof. Johnson", 
    class: "BIO 201 - Section B", 
    group: "Group 4",
    seat: "B-15",
    computer: "PC-14",
    completedLabs: 9,
    totalLabs: 12
  },
];

export function StudentRoster() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.includes(searchTerm) ||
    student.lab.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span>Students ({filteredStudents.length})</span>
            {selectedStudents.length > 0 && (
              <Badge variant="secondary" data-testid="badge-selected">
                {selectedStudents.length} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredStudents.map((student) => (
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
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium text-foreground" data-testid={`text-student-name-${student.id}`}>
                      {student.name}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {student.email}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
                      <span>ID: {student.studentId}</span>
                      <span>•</span>
                      <span className="font-medium">{student.class}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{student.lab}</Badge>
                      <Badge variant="secondary" className="text-xs">{student.group}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium">Seat: {student.seat}</div>
                    <div>Computer: {student.computer}</div>
                    <div className="text-xs">Instructor: {student.instructor}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {student.completedLabs}/{student.totalLabs} Labs
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((student.completedLabs / student.totalLabs) * 100)}% complete
                    </div>
                  </div>
                  <Badge 
                    variant={student.status === 'active' ? 'secondary' : 'outline'}
                    data-testid={`badge-status-${student.id}`}
                  >
                    {student.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => console.log('More options for', student.name)}
                    data-testid={`button-more-${student.id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}