import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar, FileText, TrendingUp, Clock, CheckCircle } from "lucide-react";

//todo: remove mock functionality
const mockStats = [
  { title: "Total Students", value: "124", icon: Users, change: "+8 this week", changeType: "positive" },
  { title: "Active Lab Sessions", value: "12", icon: Calendar, change: "3 today", changeType: "neutral" },
  { title: "Pending Submissions", value: "18", icon: FileText, change: "-5 since yesterday", changeType: "positive" },
  { title: "Average Grade", value: "87.2%", icon: TrendingUp, change: "+2.1% this semester", changeType: "positive" },
];

//todo: remove mock functionality
const recentActivity = [
  { student: "Emma Johnson", action: "submitted", item: "Lab 3: Chemical Analysis", time: "2 hours ago", status: "pending" },
  { student: "Michael Chen", action: "graded", item: "Lab 2: Microscopy", time: "4 hours ago", status: "completed" },
  { student: "Sarah Williams", action: "submitted", item: "Lab 4: Titration", time: "6 hours ago", status: "pending" },
  { student: "David Rodriguez", action: "submitted", item: "Lab 3: Chemical Analysis", time: "1 day ago", status: "graded" },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <Card key={stat.title} className="hover-elevate" data-testid={`card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid={`text-${stat.title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                {stat.value}
              </div>
              <div className={`text-xs ${
                stat.changeType === 'positive' ? 'text-secondary' : 
                stat.changeType === 'negative' ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="outline" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover-elevate" data-testid={`activity-${index}`}>
                <div className="flex-shrink-0">
                  {activity.status === 'pending' && <Clock className="h-5 w-5 text-accent" />}
                  {activity.status === 'completed' && <CheckCircle className="h-5 w-5 text-secondary" />}
                  {activity.status === 'graded' && <FileText className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground" data-testid={`text-student-${index}`}>
                      {activity.student}
                    </span>
                    <span className="text-muted-foreground">{activity.action}</span>
                    <Badge 
                      variant={activity.status === 'pending' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                      data-testid={`badge-status-${index}`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid={`text-item-${index}`}>
                    {activity.item}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}