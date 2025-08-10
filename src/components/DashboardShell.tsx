import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  LogOut,
  UsersRound
} from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';

interface NavigationItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  onClick?: () => void;
}

interface DashboardShellProps {
  children: React.ReactNode;
}

const getNavigationItems = (role: UserRole, navigate: (path: string) => void): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { title: 'Dashboard', onClick: () => navigate('/dashboard'), icon: Home },
  ];

  const roleSpecificItems: Record<UserRole, NavigationItem[]> = {
    student: [
      { title: 'My Programs', url: '#', icon: BookOpen },
      { title: 'Assignments', url: '#', icon: FileText },
      { title: 'Progress', url: '#', icon: TrendingUp },
    ],
    super_admin: [
      { title: 'Cohorts', onClick: () => navigate('/cohorts'), icon: UsersRound },
      { title: 'User Management', url: '#', icon: Users },
      { title: 'System Settings', url: '#', icon: Settings },
      { title: 'Analytics', url: '#', icon: BarChart3 },
      { title: 'Reports', url: '#', icon: FileText },
    ],
    program_manager: [
      { title: 'Cohorts', onClick: () => navigate('/cohorts'), icon: UsersRound },
      { title: 'Programs', url: '#', icon: BookOpen },
      { title: 'Students', url: '#', icon: GraduationCap },
      { title: 'Schedule', url: '#', icon: FileText },
      { title: 'Analytics', url: '#', icon: BarChart3 },
    ],
    fee_collector: [
      { title: 'Cohorts', onClick: () => navigate('/cohorts'), icon: UsersRound },
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
  ];
};

const DashboardShell = ({ children }: DashboardShellProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const navigationItems = getNavigationItems(profile.role, navigate);
  const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                LIT Dashboard
              </span>
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
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 items-center justify-between gap-2 border-b border-border bg-background px-4">
            <SidebarTrigger />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 z-50 bg-popover" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {profile.role.replace('_', ' ')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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