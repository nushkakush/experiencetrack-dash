import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  User, 
  Settings,
  Users,
  BarChart3,
  FileText,
  DollarSign,
  Receipt,
  Handshake,
  TrendingUp,
  Briefcase,
  Building2,
  LogOut
} from 'lucide-react';
import { UserRole } from '@/types/auth';

interface NavigationItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  onClick?: () => void;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

const getNavigationItems = (role: UserRole, signOut: () => void): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { title: 'Dashboard', url: '#', icon: Home },
  ];

  const roleSpecificItems: Record<UserRole, NavigationItem[]> = {
    student: [
      { title: 'My Programs', url: '#', icon: BookOpen },
      { title: 'Assignments', url: '#', icon: FileText },
      { title: 'Progress', url: '#', icon: TrendingUp },
      { title: 'Profile', url: '#', icon: User },
    ],
    super_admin: [
      { title: 'User Management', url: '#', icon: Users },
      { title: 'System Settings', url: '#', icon: Settings },
      { title: 'Analytics', url: '#', icon: BarChart3 },
      { title: 'Reports', url: '#', icon: FileText },
    ],
    program_manager: [
      { title: 'Programs', url: '#', icon: BookOpen },
      { title: 'Students', url: '#', icon: GraduationCap },
      { title: 'Schedule', url: '#', icon: FileText },
      { title: 'Analytics', url: '#', icon: BarChart3 },
    ],
    fee_collector: [
      { title: 'Payments', url: '#', icon: DollarSign },
      { title: 'Outstanding Fees', url: '#', icon: Receipt },
      { title: 'Reports', url: '#', icon: FileText },
      { title: 'Students', url: '#', icon: Users },
    ],
    partnerships_head: [
      { title: 'Active Partnerships', url: '#', icon: Handshake },
      { title: 'Partnership Leads', url: '#', icon: Users },
      { title: 'Analytics', url: '#', icon: TrendingUp },
      { title: 'Reports', url: '#', icon: FileText },
    ],
    placement_coordinator: [
      { title: 'Job Placements', url: '#', icon: Briefcase },
      { title: 'Company Relations', url: '#', icon: Building2 },
      { title: 'Statistics', url: '#', icon: BarChart3 },
      { title: 'Students', url: '#', icon: GraduationCap },
    ],
  };

  return [
    ...baseItems,
    ...roleSpecificItems[role],
    { title: 'Sign Out', icon: LogOut, onClick: signOut },
  ];
};

const DashboardShell = ({ children }: DashboardShellProps) => {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const navigationItems = getNavigationItems(profile.role, signOut);
  const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sidebar-foreground">LIT Dashboard</span>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={item.onClick}
                        className="w-full"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {profile.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 items-center gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardShell;