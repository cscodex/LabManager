import { Calendar, Users, FileText, BarChart3, Settings, Home, GraduationCap, Clock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link } from "wouter";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Students", url: "/students", icon: Users },
  { title: "Groups", url: "/groups", icon: Users },
  { title: "Lab Sessions", url: "/sessions", icon: Calendar },
  { title: "Timetable", url: "/timetable", icon: Clock },
  { title: "Submissions", url: "/submissions", icon: FileText },
  { title: "Grading", url: "/grading", icon: GraduationCap },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" data-testid="logo-icon" />
          <div>
            <h1 className="text-lg font-semibold text-foreground" data-testid="app-title">LabManager</h1>
            <p className="text-sm text-muted-foreground" data-testid="app-subtitle">Lab Management System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}