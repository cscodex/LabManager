import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockSessions = [
  {
    id: "1",
    title: "Chemical Analysis Lab",
    date: "2024-09-20",
    time: "09:00 - 11:00",
    room: "Lab Room 201",
    instructor: "Dr. Smith",
    enrolled: 18,
    capacity: 20,
    status: "upcoming"
  },
  {
    id: "2", 
    title: "Microscopy Techniques",
    date: "2024-09-20",
    time: "14:00 - 16:00",
    room: "Lab Room 103",
    instructor: "Prof. Johnson",
    enrolled: 15,
    capacity: 16,
    status: "upcoming"
  },
  {
    id: "3",
    title: "Organic Synthesis",
    date: "2024-09-21",
    time: "10:00 - 12:00",
    room: "Lab Room 205",
    instructor: "Dr. Chen",
    enrolled: 12,
    capacity: 15,
    status: "upcoming"
  }
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const timeSlots = ['09:00', '11:00', '14:00', '16:00'];

export function LabScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
    console.log('Week navigation:', direction);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Lab Sessions</h2>
          <p className="text-muted-foreground">Schedule and manage laboratory sessions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            data-testid="button-toggle-view"
          >
            {viewMode === 'list' ? <Calendar className="h-4 w-4 mr-2" /> : <Users className="h-4 w-4 mr-2" />}
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </Button>
          <Button data-testid="button-schedule-session" onClick={() => console.log('Schedule session clicked')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Week View</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('prev')} data-testid="button-prev-week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {getWeekStart(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                {new Date(getWeekStart(selectedDate).getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => navigateWeek('next')} data-testid="button-next-week">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 text-sm">
              <div></div>
              {weekDays.map(day => (
                <div key={day} className="font-medium text-center p-2 border-b" data-testid={`day-header-${day}`}>
                  {day}
                </div>
              ))}
              {timeSlots.map(time => (
                <div key={time} className="contents">
                  <div className="text-muted-foreground p-2 text-right font-medium">{time}</div>
                  {weekDays.map((day, dayIndex) => {
                    const cellDate = new Date(getWeekStart(selectedDate));
                    cellDate.setDate(cellDate.getDate() + dayIndex);
                    const session = mockSessions.find(s => 
                      s.date === formatDateForComparison(cellDate) && s.time.startsWith(time)
                    );
                    
                    return (
                      <div key={`${day}-${time}`} className="border rounded p-2 h-16 hover-elevate" data-testid={`cell-${day}-${time}`}>
                        {session && (
                          <div className="text-xs">
                            <div className="font-medium truncate" data-testid={`session-title-${session.id}`}>
                              {session.title}
                            </div>
                            <div className="text-muted-foreground">{session.room}</div>
                            <Badge variant="outline" className="text-xs">
                              {session.enrolled}/{session.capacity}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid gap-4">
          {mockSessions.map((session) => (
            <Card key={session.id} className="hover-elevate" data-testid={`session-card-${session.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`text-session-title-${session.id}`}>
                        {session.title}
                      </h3>
                      <Badge 
                        variant={session.enrolled === session.capacity ? 'destructive' : 'secondary'}
                        data-testid={`badge-capacity-${session.id}`}
                      >
                        {session.enrolled === session.capacity ? 'Full' : `${session.capacity - session.enrolled} spots left`}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-date-${session.id}`}>{session.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span data-testid={`text-time-${session.id}`}>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span data-testid={`text-room-${session.id}`}>{session.room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span data-testid={`text-enrollment-${session.id}`}>{session.enrolled}/{session.capacity} students</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <span className="text-muted-foreground">Instructor: </span>
                      <span className="text-foreground font-medium" data-testid={`text-instructor-${session.id}`}>
                        {session.instructor}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => console.log('Edit session:', session.id)}
                      data-testid={`button-edit-${session.id}`}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => console.log('View details:', session.id)}
                      data-testid={`button-details-${session.id}`}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}