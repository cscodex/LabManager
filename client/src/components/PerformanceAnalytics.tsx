import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, Users, Target } from "lucide-react";

//todo: remove mock functionality  
const gradeDistributionData = [
  { grade: 'A', count: 28, percentage: 23 },
  { grade: 'B', count: 42, percentage: 35 },
  { grade: 'C', count: 31, percentage: 26 },
  { grade: 'D', count: 15, percentage: 12 },
  { grade: 'F', count: 5, percentage: 4 },
];

//todo: remove mock functionality
const labPerformanceData = [
  { lab: 'Lab 1', avgGrade: 87.5, submissions: 120 },
  { lab: 'Lab 2', avgGrade: 84.2, submissions: 118 },
  { lab: 'Lab 3', avgGrade: 89.1, submissions: 115 },
  { lab: 'Lab 4', avgGrade: 82.8, submissions: 112 },
  { lab: 'Lab 5', avgGrade: 85.6, submissions: 108 },
];

//todo: remove mock functionality
const progressOverTime = [
  { week: 'Week 1', avgGrade: 82.1, submissions: 98 },
  { week: 'Week 2', avgGrade: 84.3, submissions: 102 },
  { week: 'Week 3', avgGrade: 86.2, submissions: 105 },
  { week: 'Week 4', avgGrade: 85.8, submissions: 108 },
  { week: 'Week 5', avgGrade: 87.4, submissions: 112 },
  { week: 'Week 6', avgGrade: 85.9, submissions: 115 },
];

const COLORS = {
  A: '#4CAF50',
  B: '#2196F3', 
  C: '#FF9800',
  D: '#FF5722',
  F: '#f44336'
};

export function PerformanceAnalytics() {
  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return 0;
    const first = data[0][key];
    const last = data[data.length - 1][key];
    return ((last - first) / first) * 100;
  };

  const avgGradeTrend = calculateTrend(progressOverTime, 'avgGrade');
  const submissionTrend = calculateTrend(progressOverTime, 'submissions');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Performance Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into student performance and lab outcomes</p>
        </div>
        <Button data-testid="button-export-report" onClick={() => console.log('Export report clicked')}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate" data-testid="card-total-students">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-students">121</div>
            <div className="text-xs text-muted-foreground">Active enrollments</div>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-avg-performance">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Performance</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-performance">85.2%</div>
            <div className={`text-xs flex items-center gap-1 ${avgGradeTrend >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {avgGradeTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(avgGradeTrend).toFixed(1)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completion-rate">94.5%</div>
            <div className={`text-xs flex items-center gap-1 ${submissionTrend >= 0 ? 'text-secondary' : 'text-destructive'}`}>
              {submissionTrend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(submissionTrend).toFixed(1)}% submissions trend
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-grading-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Grading Progress</CardTitle>
            <Badge variant="secondary">18 Pending</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-grading-progress">87%</div>
            <div className="text-xs text-muted-foreground">Assignments graded</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card data-testid="card-grade-distribution">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistributionData}
                    dataKey="count"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({grade, percentage}) => `${grade}: ${percentage}%`}
                  >
                    {gradeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.grade as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {gradeDistributionData.map((item) => (
                <div key={item.grade} className="text-center">
                  <div className="text-sm font-semibold" data-testid={`text-grade-count-${item.grade}`}>
                    {item.count}
                  </div>
                  <div className="text-xs text-muted-foreground">Grade {item.grade}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance by Lab */}
        <Card data-testid="card-lab-performance">
          <CardHeader>
            <CardTitle>Performance by Lab</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lab" />
                  <YAxis domain={[75, 95]} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'avgGrade' ? `${value}%` : value,
                      name === 'avgGrade' ? 'Average Grade' : 'Submissions'
                    ]}
                  />
                  <Bar dataKey="avgGrade" fill="#1976D2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Over Time */}
      <Card data-testid="card-progress-timeline">
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" domain={[80, 90]} />
                <YAxis yAxisId="right" orientation="right" domain={[90, 120]} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'avgGrade' ? `${value}%` : value,
                    name === 'avgGrade' ? 'Average Grade' : 'Submissions'
                  ]}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="avgGrade" 
                  stroke="#1976D2" 
                  strokeWidth={3}
                  dot={{ fill: '#1976D2', r: 4 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="submissions" 
                  stroke="#388E3C" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#388E3C', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-top-performers">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Michael Chen", grade: 96.5, improvement: "+2.3%" },
                { name: "Emma Johnson", grade: 94.8, improvement: "+1.8%" },
                { name: "Sarah Williams", grade: 92.1, improvement: "+4.2%" },
              ].map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover-elevate" data-testid={`top-performer-${index}`}>
                  <div>
                    <div className="font-medium" data-testid={`text-performer-name-${index}`}>{student.name}</div>
                    <div className="text-sm text-secondary">{student.improvement} improvement</div>
                  </div>
                  <Badge variant="secondary" data-testid={`badge-performer-grade-${index}`}>
                    {student.grade}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-attention-needed">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Alex Johnson", grade: 68.2, issue: "Missing 2 labs" },
                { name: "Maria Garcia", grade: 71.5, issue: "Late submissions" },
                { name: "James Wilson", grade: 69.8, issue: "Declining performance" },
              ].map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover-elevate" data-testid={`attention-needed-${index}`}>
                  <div>
                    <div className="font-medium" data-testid={`text-concern-name-${index}`}>{student.name}</div>
                    <div className="text-sm text-accent">{student.issue}</div>
                  </div>
                  <Badge variant="destructive" data-testid={`badge-concern-grade-${index}`}>
                    {student.grade}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}