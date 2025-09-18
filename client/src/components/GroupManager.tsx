import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Users, Monitor, MapPin, Settings, Plus, UserPlus, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group, Class, Lab, Computer, User, Enrollment } from "@shared/schema";

// Form schemas
const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  classId: z.string().min(1, "Please select a class"),
  computerId: z.string().optional(),
  maxMembers: z.number().min(1, "Must allow at least 1 member").max(10, "Maximum 10 members"),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface GroupWithDetails extends Group {
  class?: Class;
  lab?: Lab;
  computer?: Computer;
  instructor?: User;
  members?: Array<{
    enrollment: Enrollment;
    student: User;
  }>;
}

export function GroupManager() {
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  
  const { toast } = useToast();

  // Fetch all groups with details
  const { data: groups = [], isLoading: groupsLoading } = useQuery<GroupWithDetails[]>({
    queryKey: ['/api/groups/details']
  });

  // Fetch classes for creating groups
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes']
  });

  // Fetch labs for filtering
  const { data: labs = [] } = useQuery<Lab[]>({
    queryKey: ['/api/labs']
  });

  // Fetch computers for group assignment
  const { data: computers = [] } = useQuery<Computer[]>({
    queryKey: ['/api/computers']
  });

  const filteredGroups = selectedLab === "all" 
    ? groups 
    : groups.filter(group => group.lab?.name === selectedLab);

  const labNames = ["all", ...labs.map(lab => lab.name)];

  // Handler functions
  const handleManageGroup = (group: GroupWithDetails) => {
    setSelectedGroup(group);
    setShowManageDialog(true);
  };

  const handleReassignComputer = (group: GroupWithDetails) => {
    toast({
      title: "Feature coming soon",
      description: "Computer reassignment functionality will be available soon",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Group Management</h2>
          <p className="text-muted-foreground">Manage student groups and computer assignments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Users className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group for collaborative lab work.
              </DialogDescription>
            </DialogHeader>
            <CreateGroupForm 
              onSuccess={() => setShowCreateDialog(false)}
              classes={classes}
              computers={computers}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lab Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            {labNames.map(lab => (
              <Button
                key={lab}
                variant={selectedLab === lab ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLab(lab)}
                data-testid={`button-filter-${lab.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {lab === "all" ? "All Labs" : lab}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      {groupsLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading groups...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No groups found for the selected lab.
            </div>
          ) : (
            filteredGroups.map((group) => (
              <Card key={group.id} className="hover-elevate" data-testid={`card-group-${group.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold" data-testid={`text-group-name-${group.id}`}>
                      {group.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-group-settings-${group.id}`}>
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleManageGroup(group)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReassignComputer(group)}>
                          <Monitor className="h-4 w-4 mr-2" />
                          Reassign Computer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span data-testid={`text-lab-${group.id}`}>{group.lab?.name || 'Unknown Lab'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span data-testid={`text-computer-${group.id}`}>{group.computer?.name || 'No Computer'}</span>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="w-fit">
                    {group.instructor ? `${group.instructor.firstName} ${group.instructor.lastName}` : 'No Instructor'}
                  </Badge>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Group Members */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Members ({group.members?.length || 0}/{group.maxMembers})
                    </h4>
                    {!group.members || group.members.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No members in this group
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {group.members.map((memberData, index) => {
                          const member = memberData.student;
                          const enrollment = memberData.enrollment;
                          return (
                            <div 
                              key={member.id} 
                              className="flex items-center justify-between p-2 rounded-lg hover-elevate"
                              data-testid={`member-${group.id}-${member.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="" />
                                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                    {member.firstName[0]}{member.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium text-sm" data-testid={`text-member-name-${group.id}-${member.id}`}>
                                    {member.firstName} {member.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {enrollment.seatNumber ? `Seat: ${enrollment.seatNumber}` : 'No seat assigned'}
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={index === 0 ? "default" : "secondary"}
                                className="text-xs"
                                data-testid={`badge-role-${group.id}-${member.id}`}
                              >
                                {index === 0 ? 'leader' : 'member'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Group Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleManageGroup(group)}
                      data-testid={`button-manage-${group.id}`}
                    >
                      Manage Members
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReassignComputer(group)}
                      data-testid={`button-reassign-${group.id}`}
                    >
                      Reassign PC
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Create Group Form Component
function CreateGroupForm({ 
  onSuccess, 
  classes, 
  computers 
}: {
  onSuccess: () => void;
  classes: Class[];
  computers: Computer[];
}) {
  const { toast } = useToast();
  
  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      classId: "",
      computerId: "",
      maxMembers: 4,
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupFormData) => {
      const response = await apiRequest("POST", "/api/groups", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups/details'] });
      onSuccess();
      form.reset();
      toast({
        title: "Success",
        description: "Group created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateGroupFormData) => {
    createGroupMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Group 1" data-testid="input-group-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="classId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-group-class">
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
          control={form.control}
          name="computerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Computer (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-group-computer">
                    <SelectValue placeholder="Select a computer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Computer</SelectItem>
                  {computers.map((computer) => (
                    <SelectItem key={computer.id} value={computer.id}>
                      {computer.name} - {computer.specs}
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
          name="maxMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maximum Members</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1" 
                  max="10"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  data-testid="input-max-members"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            data-testid="button-cancel-group"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createGroupMutation.isPending}
            data-testid="button-create-group-submit"
          >
            {createGroupMutation.isPending ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}