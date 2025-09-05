import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Logo } from '@/components/ui/logo';
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
  UsersRound,
  Calendar,
  CreditCard,
  Menu,
  Package,
  Clock,
  MessageSquare,
  Palette,
  Zap,
  Route,
  CheckCircle,
  TestTube,
} from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlag } from '@/lib/feature-flags/useFeatureFlag';
import {
  useEquipmentPermissions,
  EquipmentPermissions,
} from '@/domains/equipment/hooks/useEquipmentPermissions';
import { AvatarService } from '@/services/avatar.service';
import { cn } from '@/lib/utils';

interface NavigationItem {
  title: string;
  url?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
}

interface DashboardShellProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

const getNavigationItems = (
  role: UserRole,
  navigate: (path: string) => void,
  showStudentPaymentDashboard: boolean = false,
  equipmentPermissions?: EquipmentPermissions
): NavigationItem[] => {
  const baseItems: NavigationItem[] = [
    { title: 'Dashboard', onClick: () => navigate('/dashboard'), icon: Home },
  ];

  const roleSpecificItems: Record<UserRole, NavigationItem[]> = {
    student: [
      {
        title: 'Attendance',
        onClick: () => navigate('/dashboard'),
        icon: Calendar,
      },
      ...(showStudentPaymentDashboard
        ? [
            {
              title: 'Fee Payment',
              onClick: () => navigate('/dashboard/fee-payment'),
              icon: CreditCard,
            },
          ]
        : []),
    ],
    super_admin: [
      {
        title: 'Cohorts',
        onClick: () => navigate('/cohorts'),
        icon: UsersRound,
      },
      ...(equipmentPermissions?.canAccessInventory
        ? [
            {
              title: 'Equipment Inventory',
              onClick: () => navigate('/equipment-inventory'),
              icon: Package,
            },
          ]
        : []),
      ...(equipmentPermissions?.canViewBorrowingHistory
        ? [
            {
              title: 'Borrowing History',
              onClick: () => navigate('/borrowing-history'),
              icon: Clock,
            },
          ]
        : []),
      {
        title: 'Mentor Management',
        onClick: () => navigate('/mentor-management'),
        icon: Users,
      },
      {
        title: 'Experience Design',
        onClick: () => navigate('/experience-design-management'),
        icon: Palette,
      },
      {
        title: 'Epics',
        onClick: () => navigate('/epics'),
        icon: Zap,
      },
      {
        title: 'Epic Learning Paths',
        onClick: () => navigate('/epic-learning-paths'),
        icon: Route,
      },
      {
        title: 'User Management',
        onClick: () => navigate('/user-management'),
        icon: Users,
      },
    ],
    program_manager: [
      {
        title: 'Attendance Dashboard',
        onClick: () => navigate('/cohorts'),
        icon: Calendar,
      },
    ],
    fee_collector: [
      {
        title: 'Fee Collection Dashboard',
        onClick: () => navigate('/cohorts'),
        icon: DollarSign,
      },
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
    equipment_manager: [
      {
        title: 'Equipment Inventory',
        onClick: () => navigate('/equipment-inventory'),
        icon: Package,
      },
      {
        title: 'Borrowing History',
        onClick: () => navigate('/borrowing-history'),
        icon: Clock,
      },
    ],
    mentor_manager: [
      {
        title: 'Mentor Management',
        onClick: () => navigate('/mentor-management'),
        icon: Users,
      },
    ],
    experience_designer: [
      {
        title: 'Experience Design',
        onClick: () => navigate('/experience-design-management'),
        icon: Palette,
      },
      {
        title: 'Epics',
        onClick: () => navigate('/epics'),
        icon: Zap,
      },
      {
        title: 'Epic Learning Paths',
        onClick: () => navigate('/epic-learning-paths'),
        icon: Route,
      },
    ],
    applications_manager: [
      {
        title: 'Cohorts',
        onClick: () => navigate('/cohorts'),
        icon: UsersRound,
      },
      {
        title: 'Applications Management',
        onClick: () => navigate('/dashboard'),
        icon: FileText,
      },
    ],
    application_reviewer: [
      {
        title: 'Cohorts',
        onClick: () => navigate('/cohorts'),
        icon: UsersRound,
      },
      {
        title: 'Application Review',
        onClick: () => navigate('/dashboard'),
        icon: CheckCircle,
      },
    ],
    litmus_test_reviewer: [
      {
        title: 'Cohorts',
        onClick: () => navigate('/cohorts'),
        icon: UsersRound,
      },
      {
        title: 'LITMUS Test Review',
        onClick: () => navigate('/dashboard'),
        icon: TestTube,
      },
    ],
  };

  if (role === 'student') {
    return roleSpecificItems[role];
  }

  return [...baseItems, ...roleSpecificItems[role]];
};

const DashboardShell = ({
  children,
  hideSidebar = false,
}: DashboardShellProps) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const { isEnabled: showStudentPaymentDashboard } = useFeatureFlag(
    'student-payment-dashboard',
    {
      defaultValue: false,
    }
  );

  const equipmentPermissions = useEquipmentPermissions();

  if (!profile) return null;

  const navigationItems = getNavigationItems(
    profile.role,
    navigate,
    showStudentPaymentDashboard,
    equipmentPermissions
  );
  const userInitials =
    `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className='h-screen w-screen flex bg-background overflow-hidden'>
      {!hideSidebar && (
        <div
          className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-sidebar border-r border-border flex-shrink-0 flex flex-col h-full transition-all duration-300 overflow-hidden`}
        >
          <div className='p-4 border-b border-border flex-shrink-0'>
            <Logo size='md' showText={false} />
          </div>

          <div className='p-4 flex-1 overflow-y-auto'>
            <div className='space-y-2'>
              <h3 className='text-sm font-medium text-muted-foreground mb-3 text-left'>
                Navigation
              </h3>
              {navigationItems.map(item => (
                <button
                  key={item.title}
                  onClick={item.onClick}
                  className='w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-left justify-start'
                >
                  <item.icon className='h-4 w-4' />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className='flex-1 flex flex-col h-full overflow-hidden'>
        <header className='h-16 border-b border-border bg-background px-6 flex items-center justify-between flex-shrink-0'>
          <div className='flex items-center gap-4'>
            {!hideSidebar && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={handleSidebarToggle}
              >
                <Menu className='h-4 w-4' />
              </Button>
            )}
            {hideSidebar && <Logo size='sm' showText={false} />}
          </div>

          <div className='flex items-center gap-2'>
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-8 w-8 rounded-full'
                >
                  <Avatar className='h-8 w-8'>
                    {profile.avatar_url ? (
                      <AvatarImage
                        src={AvatarService.getAvatarUrl(
                          AvatarService.getFileNameFromUrl(profile.avatar_url),
                          { width: 32, height: 32, quality: 80 }
                        )}
                        alt={`${profile.first_name} ${profile.last_name}`}
                      />
                    ) : null}
                    <AvatarFallback className='text-xs bg-primary text-primary-foreground'>
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-56 z-[9999] bg-popover'
                align='end'
                forceMount
              >
                <DropdownMenuLabel className='font-normal'>
                  <div className='flex flex-col space-y-1'>
                    <p className='text-sm font-medium leading-none'>
                      {profile.first_name} {profile.last_name}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground'>
                      {profile.email}
                    </p>
                    <p className='text-xs leading-none text-muted-foreground capitalize'>
                      {profile.role.replace('_', ' ')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className='mr-2 h-4 w-4' />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className='flex-1 p-6 w-full overflow-y-auto'>{children}</main>
      </div>
    </div>
  );
};

export default DashboardShell;
