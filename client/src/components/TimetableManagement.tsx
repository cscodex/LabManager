import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Clock, Users, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import type { Class, Lab, Timetable } from '@shared/schema';
import { insertTimetableSchema } from '@shared/schema';

// Base schema from shared types with additional validation
const baseTimetableSchema = z.object({
  classId: z.string().min(1, "Please select a class"),
  dayOfWeek: z.coerce.number().min(1).max(7),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  labId: z.string().min(1, "Please select a lab"),
  isActive: z.boolean().optional()
});

// Form schema with time validation
const timetableFormSchema = baseTimetableSchema.refine((data: any) => {
  // Validate that end time is after start time
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  return endTotalMinutes > startTotalMinutes;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type TimetableFormData = z.infer<typeof timetableFormSchema>;

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export function TimetableManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch timetables with filtering
  const { data: timetables = [], isLoading: timetablesLoading } = useQuery<Timetable[]>({
    queryKey: ['/api/timetables', selectedDay, selectedClass],
    queryFn: async (): Promise<Timetable[]> => {
      const params = new URLSearchParams();
      if (selectedDay) params.append('dayOfWeek', selectedDay.toString());
      if (selectedClass) params.append('classId', selectedClass);
      
      const response = await fetch(`/api/timetables?${params}`);
      if (!response.ok) throw new Error('Failed to fetch timetables');
      return response.json();
    }
  });

  // Fetch classes for dropdown
  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/classes']
  });

  // Fetch labs for dropdown
  const { data: labs = [], isLoading: labsLoading } = useQuery<Lab[]>({
    queryKey: ['/api/labs']
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: TimetableFormData) => apiRequest('/api/timetables', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'], exact: false });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Timetable entry created successfully"
      });
    },
    onError: (error: any) => {
      // Handle structured conflict errors
      if (error.response?.status === 409 && error.response?.data?.error === 'SCHEDULE_CONFLICT') {
        const conflictData = error.response.data;
        const title = conflictData.conflictType === 'class' ? 'Class Scheduling Conflict' : 'Lab Scheduling Conflict';
        toast({
          title,
          description: conflictData.message || "This time slot conflicts with existing entries",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create timetable entry",
          variant: "destructive"
        });
      }
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: TimetableFormData }) =>
      apiRequest(`/api/timetables/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'], exact: false });
      setEditingTimetable(null);
      toast({
        title: "Success",
        description: "Timetable entry updated successfully"
      });
    },
    onError: (error: any) => {
      // Handle structured conflict errors
      if (error.response?.status === 409 && error.response?.data?.error === 'SCHEDULE_CONFLICT') {
        const conflictData = error.response.data;
        const title = conflictData.conflictType === 'class' ? 'Class Scheduling Conflict' : 'Lab Scheduling Conflict';
        toast({
          title,
          description: conflictData.message || "This time slot conflicts with existing entries",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update timetable entry",
          variant: "destructive"
        });
      }
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/timetables/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timetables'], exact: false });
      toast({
        title: "Success",
        description: "Timetable entry deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete timetable entry",
        variant: "destructive"
      });
    }
  });

  const form = useForm<TimetableFormData>({
    resolver: zodResolver(timetableFormSchema),
    defaultValues: {
      classId: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      labId: ''
    }
  });

  // Check for client-side conflicts before submitting
  const checkConflicts = (data: TimetableFormData, excludeId?: string) => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const newStart = startHour * 60 + startMinute;
    const newEnd = endHour * 60 + endMinute;

    const conflicts = timetables.filter(t => {
      if (excludeId && t.id === excludeId) return false;
      if (t.dayOfWeek !== data.dayOfWeek) return false;
      
      const [existingStartHour, existingStartMinute] = t.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMinute] = t.endTime.split(':').map(Number);
      const existingStart = existingStartHour * 60 + existingStartMinute;
      const existingEnd = existingEndHour * 60 + existingEndMinute;
      
      // Check for overlap - either same lab OR same class
      const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;
      const isLabConflict = t.labId === data.labId && hasTimeOverlap;
      const isClassConflict = t.classId === data.classId && hasTimeOverlap;
      
      return isLabConflict || isClassConflict;
    });

    return conflicts;
  };

  const handleCreateSubmit = (data: TimetableFormData) => {
    const conflicts = checkConflicts(data);
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      const conflictClass = classes.find((c: Class) => c.id === conflict.classId);
      const isLabConflict = conflict.labId === data.labId;
      const isClassConflict = conflict.classId === data.classId;
      
      let message = "";
      if (isClassConflict) {
        message = `Class ${conflictClass?.displayName || conflictClass?.name || 'this class'} already has a session at this time`;
      } else if (isLabConflict) {
        message = `Lab is already occupied by ${conflictClass?.displayName || conflictClass?.name || 'another class'} at this time`;
      }
      
      toast({
        title: "Scheduling Conflict Detected",
        description: message,
        variant: "destructive"
      });
      return;
    }
    createMutation.mutate(data);
  };

  const handleEditSubmit = (data: TimetableFormData) => {
    if (editingTimetable) {
      const conflicts = checkConflicts(data, editingTimetable.id);
      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const conflictClass = classes.find((c: Class) => c.id === conflict.classId);
        const isLabConflict = conflict.labId === data.labId;
        const isClassConflict = conflict.classId === data.classId;
        
        let message = "";
        if (isClassConflict) {
          message = `Class ${conflictClass?.displayName || conflictClass?.name || 'this class'} already has a session at this time`;
        } else if (isLabConflict) {
          message = `Lab is already occupied by ${conflictClass?.displayName || conflictClass?.name || 'another class'} at this time`;
        }
        
        toast({
          title: "Scheduling Conflict Detected",
          description: message,
          variant: "destructive"
        });
        return;
      }
      updateMutation.mutate({ id: editingTimetable.id, data });
    }
  };

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable);
    form.reset({
      classId: timetable.classId,
      dayOfWeek: timetable.dayOfWeek,
      startTime: timetable.startTime,
      endTime: timetable.endTime,
      labId: timetable.labId
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this timetable entry?')) {
      deleteMutation.mutate(id);
    }
  };

  // Group timetables by day and time for grid display
  const timetableGrid = DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day.value] = TIME_SLOTS.reduce((timeAcc, time) => {
      timeAcc[time] = timetables.filter((t: Timetable) => 
        t.dayOfWeek === day.value && t.startTime === time
      );
      return timeAcc;
    }, {} as Record<string, Timetable[]>);
    return acc;
  }, {} as Record<number, Record<string, Timetable[]>>);

  // Get class display name
  const getClassDisplayName = (classId: string) => {
    const cls = classes.find((c: Class) => c.id === classId);
    return cls ? cls.displayName || cls.name : 'Unknown Class';
  };

  // Get lab name
  const getLabName = (labId: string) => {
    const lab = labs.find((l: Lab) => l.id === labId);
    return lab ? lab.name : 'Unknown Lab';
  };

  if (timetablesLoading || classesLoading || labsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 64 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Weekly Timetable</h2>
          <p className="text-muted-foreground">Manage lab session schedules for all classes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-timetable">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Timetable Entry</DialogTitle>
              <DialogDescription>
                Schedule a new lab session for a class.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-class">
                            <SelectValue placeholder="Select a class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((cls: Class) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.displayName || cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-day">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-start-time">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-end-time">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="labId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratory</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-lab">
                            <SelectValue placeholder="Select a lab" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {labs.map((lab: Lab) => (
                            <SelectItem key={lab.id} value={lab.id}>
                              {lab.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-timetable"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Day</label>
              <Select 
                value={selectedDay?.toString() || ''} 
                onValueChange={(value) => setSelectedDay(value ? parseInt(value) : null)}
              >
                <SelectTrigger data-testid="filter-day">
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All days</SelectItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Class</label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
              >
                <SelectTrigger data-testid="filter-class">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All classes</SelectItem>
                  {classes.map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.displayName || cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 gap-2 text-sm">
            {/* Header row */}
            <div className="p-2 font-medium text-center">Time</div>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="p-2 font-medium text-center border-b" data-testid={`day-header-${day.value}`}>
                {day.label}
              </div>
            ))}

            {/* Time slots */}
            {TIME_SLOTS.map((time) => (
              <div key={time} className="contents">
                <div className="p-2 text-right font-medium text-muted-foreground bg-muted/30">
                  {time}
                </div>
                {DAYS_OF_WEEK.map((day) => {
                  const cellTimetables = timetableGrid[day.value]?.[time] || [];
                  return (
                    <div 
                      key={`${day.value}-${time}`} 
                      className="border rounded p-1 min-h-[60px] hover:bg-muted/50 transition-colors"
                      data-testid={`cell-${day.value}-${time}`}
                    >
                      {cellTimetables.map((timetable: Timetable) => (
                        <div 
                          key={timetable.id} 
                          className="bg-primary/10 border border-primary/20 rounded p-2 mb-1 text-xs group hover:bg-primary/20 transition-colors"
                        >
                          <div className="font-medium truncate text-foreground" data-testid={`timetable-class-${timetable.id}`}>
                            {getClassDisplayName(timetable.classId)}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {getLabName(timetable.labId)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {timetable.startTime} - {timetable.endTime}
                          </div>
                          <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => handleEdit(timetable)}
                              data-testid={`button-edit-${timetable.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={() => handleDelete(timetable.id)}
                              data-testid={`button-delete-${timetable.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTimetable} onOpenChange={() => setEditingTimetable(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Update the lab session schedule.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-class">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls: Class) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.displayName || cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-day">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="edit-select-start-time">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="edit-select-end-time">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="labId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laboratory</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-lab">
                          <SelectValue placeholder="Select a lab" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {labs.map((lab: Lab) => (
                          <SelectItem key={lab.id} value={lab.id}>
                            {lab.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-update-timetable"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}