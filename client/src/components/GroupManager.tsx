import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Monitor, MapPin, Settings } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const mockGroups = [
  {
    id: "1",
    name: "Group 1",
    lab: "Lab A - Chemistry",
    instructor: "Dr. Smith",
    computer: "PC-03",
    members: [
      { id: "1", name: "Emma Johnson", seat: "A-12", role: "leader" },
      { id: "5", name: "Alex Thompson", seat: "A-13", role: "member" },
      { id: "9", name: "Lisa Zhang", seat: "A-14", role: "member" }
    ]
  },
  {
    id: "2", 
    name: "Group 2",
    lab: "Lab A - Chemistry",
    instructor: "Dr. Smith",
    computer: "PC-07",
    members: [
      { id: "3", name: "Sarah Williams", seat: "A-05", role: "leader" },
      { id: "7", name: "Kevin Park", seat: "A-06", role: "member" },
      { id: "11", name: "Maya Patel", seat: "A-07", role: "member" }
    ]
  },
  {
    id: "3",
    name: "Group 3", 
    lab: "Lab B - Biology",
    instructor: "Prof. Johnson",
    computer: "PC-11",
    members: [
      { id: "2", name: "Michael Chen", seat: "B-08", role: "leader" },
      { id: "6", name: "Rachel Kim", seat: "B-09", role: "member" },
      { id: "10", name: "Daniel Lopez", seat: "B-10", role: "member" }
    ]
  },
  {
    id: "4",
    name: "Group 4",
    lab: "Lab B - Biology", 
    instructor: "Prof. Johnson",
    computer: "PC-14",
    members: [
      { id: "4", name: "David Rodriguez", seat: "B-15", role: "leader" },
      { id: "8", name: "Sophie Miller", seat: "B-16", role: "member" },
      { id: "12", name: "James Wilson", seat: "B-17", role: "member" }
    ]
  }
];

export function GroupManager() {
  const [selectedLab, setSelectedLab] = useState<string>("all");

  const filteredGroups = selectedLab === "all" 
    ? mockGroups 
    : mockGroups.filter(group => group.lab === selectedLab);

  const labs = ["all", "Lab A - Chemistry", "Lab B - Biology"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Group Management</h2>
          <p className="text-muted-foreground">Manage student groups and computer assignments</p>
        </div>
        <Button data-testid="button-create-group" onClick={() => console.log('Create group clicked')}>
          <Users className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Lab Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {labs.map(lab => (
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover-elevate" data-testid={`card-group-${group.id}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold" data-testid={`text-group-name-${group.id}`}>
                  {group.name}
                </CardTitle>
                <Button variant="ghost" size="sm" data-testid={`button-group-settings-${group.id}`}>
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span data-testid={`text-lab-${group.id}`}>{group.lab}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span data-testid={`text-computer-${group.id}`}>{group.computer}</span>
                </div>
              </div>
              
              <Badge variant="outline" className="w-fit">
                {group.instructor}
              </Badge>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Group Members */}
              <div>
                <h4 className="text-sm font-medium mb-3">Members ({group.members.length})</h4>
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-2 rounded-lg hover-elevate"
                      data-testid={`member-${group.id}-${member.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm" data-testid={`text-member-name-${group.id}-${member.id}`}>
                            {member.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Seat: {member.seat}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={member.role === "leader" ? "default" : "secondary"}
                        className="text-xs"
                        data-testid={`badge-role-${group.id}-${member.id}`}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => console.log('Manage group:', group.id)}
                  data-testid={`button-manage-${group.id}`}
                >
                  Manage Members
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => console.log('Reassign computer:', group.id)}
                  data-testid={`button-reassign-${group.id}`}
                >
                  Reassign PC
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}