import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Download, RefreshCw, Users, Mail } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable, UserFilters, UserActions } from './components';
import AddUserDialog from './components/AddUserDialog';
import { UserRole } from '@/types/auth';
import { UserStatus } from '@/types/userManagement';

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registered' | 'invited'>(
    'registered'
  );

  const {
    state,
    stats,
    statsLoading,
    loadUsers,
    loadStats,
    setFilters,
    hasSelection,
    clearSelection,
  } = useUserManagement();

  const handleSearch = (searchTerm: string) => {
    setFilters({ search: searchTerm });
  };

  const handleRefresh = () => {
    loadUsers();
    loadStats();
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      student: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      super_admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
      program_manager: 'bg-green-500/10 text-green-600 dark:text-green-400',
      fee_collector: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      partnerships_head:
        'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      placement_coordinator:
        'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    };
    return colors[role] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  const getStatusColor = (status: UserStatus) => {
    const colors = {
      active: 'bg-green-500/10 text-green-600 dark:text-green-400',
      inactive: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
      suspended: 'bg-red-500/10 text-red-600 dark:text-red-400',
      invited: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>User Management</h1>
        <p className='text-muted-foreground'>
          Manage system users, roles, and permissions
        </p>
      </div>

      {/* Users by Role - Individual Cards */}
      {stats && (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {Object.entries(stats.usersByRole)
            .filter(([role]) => role !== 'student') // Exclude student role
            .map(([role, count]) => (
              <Card key={role}>
                <CardContent className='pt-6'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold'>{count}</div>
                    <Badge
                      variant='secondary'
                      className={getRoleColor(role as UserRole)}
                    >
                      {role.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Bulk Actions */}
      {hasSelection && <UserActions />}

      {/* User Tables with Tabs */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Manage registered users and pending invitations
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              {hasSelection && (
                <Button variant='outline' size='sm' onClick={clearSelection}>
                  Clear Selection
                </Button>
              )}
              <AddUserDialog onAdded={handleRefresh} />
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={state.loading}
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Refresh
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  // TODO: Implement export functionality
                  console.log('Export users');
                }}
              >
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={value =>
              setActiveTab(value as 'registered' | 'invited')
            }
          >
            <TabsList className='w-auto'>
              <TabsTrigger
                value='registered'
                className='flex items-center gap-2'
              >
                <Users className='h-4 w-4' />
                Registered Users
              </TabsTrigger>
              <TabsTrigger value='invited' className='flex items-center gap-2'>
                <Mail className='h-4 w-4' />
                Invited Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value='registered' className='space-y-4'>
              {/* Search and Filters */}
              <div className='flex items-center gap-4'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by name, email, or role...'
                    className='pl-10'
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
                <UserFilters />
              </div>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {state.users.filter(user => user.status !== 'invited').length}{' '}
                  registered users
                </div>
              </div>
              <UserTable showOnlyRegistered={true} />
            </TabsContent>

            <TabsContent value='invited' className='space-y-4'>
              {/* Search and Filters */}
              <div className='flex items-center gap-4'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search by name, email, or role...'
                    className='pl-10'
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
                <UserFilters />
              </div>

              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {state.users.filter(user => user.status === 'invited').length}{' '}
                  invited users
                </div>
              </div>
              <UserTable showOnlyInvited={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Display */}
      {state.error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center gap-2 text-red-800'>
              <div className='text-sm font-medium'>Error:</div>
              <div className='text-sm'>{state.error}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagementPage;
