import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Download, Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockSubmissions = [
  {
    id: "1",
    student: "Emma Johnson",
    studentId: "2023001",
    labTitle: "Chemical Analysis Lab",
    submittedAt: "2024-09-18 14:30",
    dueDate: "2024-09-20 23:59",
    status: "submitted",
    files: ["lab_report.pdf", "data_analysis.xlsx"],
    grade: null
  },
  {
    id: "2", 
    student: "Michael Chen",
    studentId: "2023002",
    labTitle: "Microscopy Techniques",
    submittedAt: "2024-09-17 16:45",
    dueDate: "2024-09-18 23:59",
    status: "graded",
    files: ["microscopy_report.pdf", "images.zip"],
    grade: "A-"
  },
  {
    id: "3",
    student: "Sarah Williams", 
    studentId: "2023003",
    labTitle: "Organic Synthesis",
    submittedAt: null,
    dueDate: "2024-09-19 23:59",
    status: "overdue",
    files: [],
    grade: null
  },
  {
    id: "4",
    student: "David Rodriguez",
    studentId: "2023004", 
    labTitle: "Titration Analysis",
    submittedAt: "2024-09-16 10:20",
    dueDate: "2024-09-17 23:59",
    status: "graded",
    files: ["titration_report.pdf"],
    grade: "B+"
  }
];

export function SubmissionTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredSubmissions = mockSubmissions.filter(submission => {
    const matchesSearch = submission.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.labTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.studentId.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-accent" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="text-accent border-accent/20 bg-accent/10">Submitted</Badge>;
      case 'graded':
        return <Badge variant="secondary">Graded</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Lab Submissions</h2>
          <p className="text-muted-foreground">Track student submissions and manage grading workflow</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, lab title, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-submissions"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'submitted', 'graded', 'overdue'].map(status => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  data-testid={`button-filter-${status}`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredSubmissions.map((submission) => (
              <div 
                key={submission.id} 
                className="flex items-center justify-between p-4 hover-elevate"
                data-testid={`submission-row-${submission.id}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getStatusIcon(submission.status)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {submission.student.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground" data-testid={`text-student-${submission.id}`}>
                        {submission.student}
                      </span>
                      <span className="text-xs text-muted-foreground">({submission.studentId})</span>
                    </div>
                    <div className="text-sm text-foreground font-medium mb-1" data-testid={`text-lab-title-${submission.id}`}>
                      {submission.labTitle}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Due: {submission.dueDate}</span>
                      {submission.submittedAt && (
                        <span>Submitted: {submission.submittedAt}</span>
                      )}
                      {submission.files.length > 0 && (
                        <span>{submission.files.length} file{submission.files.length > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {submission.grade && (
                    <div className="text-right">
                      <div className="font-semibold text-lg" data-testid={`text-grade-${submission.id}`}>
                        {submission.grade}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(submission.status)}
                    <div className="flex gap-1">
                      {submission.files.length > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => console.log('Download files for:', submission.student)}
                          data-testid={`button-download-${submission.id}`}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Files
                        </Button>
                      )}
                      <Button 
                        variant={submission.status === 'submitted' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => console.log('Grade submission:', submission.id)}
                        data-testid={`button-grade-${submission.id}`}
                      >
                        {submission.status === 'graded' ? 'Review' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}