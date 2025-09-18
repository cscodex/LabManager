import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type SelectTimetable, type SelectClass, type SelectLab } from "@shared/schema";

// Helper function to format time range
const formatTimeRange = (startTime: string, endTime: string) => {
  return `${startTime} - ${endTime}`;
};

// Helper function to get current date for a given day of week in selected week
const getDateForDayOfWeek = (weekStart: Date, dayOfWeek: number) => {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + dayOfWeek);
  return date.toISOString().split('T')[0];
};

// Helper function to generate class display name
const getClassDisplayName = (classData: SelectClass) => {
  const tradeTypeMap = {
    'non_medical': 'NM',
    'medical': 'M', 
    'commerce': 'C'
  };
  return `${classData.gradeLevel} ${tradeTypeMap[classData.tradeType]} ${classData.section}`;
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const timeSlots = ['09:00', '11:00', '14:00', '16:00'];

export function LabScheduler() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedClass, setSelectedClass] = useState<string>('all');

  // Fetch classes for filtering
  const { data: classes = [] } = useQuery<SelectClass[]>({
    queryKey: ['/api/classes']
  });

  // Fetch labs for display
  const { data: labs = [] } = useQuery<SelectLab[]>({
    queryKey: ['/api/labs']
  });

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Get current week start for fetching timetables
  const weekStart = getWeekStart(selectedDate);
  const selectedDay = selectedDate.getDay() || 7; // Convert Sunday (0) to 7

  // Fetch timetables for the selected week and class
  const { data: timetables = [], isLoading } = useQuery<SelectTimetable[]>({
    queryKey: ['/api/timetables', ...(selectedClass && selectedClass !== 'all' ? [selectedClass] : [])]
  });

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  // Convert timetables to session format for display
  const sessions = timetables.map(timetable => {
    const classData = classes.find(c => c.id === timetable.classId);
    const lab = labs.find(l => l.id === timetable.labId);
    const weekStartDate = getWeekStart(selectedDate);
    const sessionDate = getDateForDayOfWeek(weekStartDate, timetable.dayOfWeek);
    
    return {
      id: timetable.id,
      title: classData ? `${getClassDisplayName(classData)} Lab Session` : 'Lab Session',
      date: sessionDate,
      time: formatTimeRange(timetable.startTime, timetable.endTime),
      room: lab?.name || 'Lab Room',
      instructor: timetable.instructor || 'TBA',
      classDisplayName: classData ? getClassDisplayName(classData) : 'Unknown Class',
      className: classData?.name || 'Unknown',
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      enrolled: 0, // TODO: Connect to enrollment system
      capacity: lab?.capacity || 20,
      status: "upcoming"
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Lab Sessions</h2>
          <p className="text-muted-foreground">View and manage scheduled laboratory sessions</p>
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
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {getClassDisplayName(classItem)} - {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    const session = sessions.find(s => 
                      s.date === formatDateForComparison(cellDate) && s.startTime === time
                    );
                    
                    return (
                      <div key={`${day}-${time}`} className="border rounded p-2 h-16 hover-elevate" data-testid={`cell-${day}-${time}`}>
                        {session && (
                          <div className="text-xs">
                            <div className="font-medium truncate" data-testid={`session-title-${session.id}`}>
                              {session.classDisplayName}
                            </div>
                            <div className="text-muted-foreground text-[10px]">{session.room}</div>
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              {session.instructor}
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
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading lab sessions...
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No lab sessions found for the current selection.
            </div>
          )}
          {sessions.map((session) => (
            <Card key={session.id} className="hover-elevate" data-testid={`session-card-${session.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`text-session-title-${session.id}`}>
                        {session.classDisplayName}
                      </h3>
                      <Badge variant="secondary" data-testid={`badge-class-${session.id}`}>
                        {session.className}
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
                        <span data-testid={`text-capacity-${session.id}`}>Capacity: {session.capacity} students</span>
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
                      onClick={() => console.log('View enrollment details:', session.id)}
                      data-testid={`button-enrollment-${session.id}`}
                    >
                      Enrollment
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