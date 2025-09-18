import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, Users, Mail } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserTable, UserActions, SearchAndFilter } from './components';
import AddUserDialog from './components/AddUserDialog';
import { UserRole } from '@/types/auth';
import { UserStatus } from '@/types/userManagement';

const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'registered' | 'invited'>(
    'registered'
  );
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key
  const [isRefreshing, setIsRefreshing] = useState(false); // Local refresh state
  const [isExporting, setIsExporting] = useState(false); // Export loading state

  const {
    state,
    stats,
    statsLoading,
    loadUsers,
    forceRefreshUsers,
    loadStats,
    hasSelection,
    clearSelection,
    exportUsers,
    searchTerm,
    selectedRoles,
    selectedStatuses,
    dateRange,
    setSearchTerm,
    setSelectedRoles,
    setSelectedStatuses,
    setDateRange,
    clearFilters,
    toggleUserSelection,
    selectAllUsers,
    isAllSelected,
    deleteUser,
  } = useUserManagement();

  // Debug filter state changes
  useEffect(() => {
    console.log('🔍 [PAGE] Filter state changed:', {
      searchTerm,
      selectedRoles,
      selectedStatuses,
      dateRange
    });
  }, [searchTerm, selectedRoles, selectedStatuses, dateRange]);

  // Debug state changes
  console.log('🔄 [DEBUG] UserManagementPage render - state:', {
    totalUsers: state.users.length,
    invitedUsers: state.users.filter(u => u.status === 'invited').length,
    registeredUsers: state.users.filter(u => u.status !== 'invited').length,
    loading: state.loading,
    activeTab,
  });


  const handleRefresh = async () => {
    console.log('🔄 [DEBUG] handleRefresh called - refreshing users and stats');
    console.log('🔄 [DEBUG] Current state before refresh:', {
      usersCount: state.users.length,
      loading: state.loading,
      isRefreshing,
    });

    setIsRefreshing(true);
    try {
      await forceRefreshUsers();
      await loadStats();

      // Force re-render with a small delay to ensure state updates are processed
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
        console.log('🔄 [DEBUG] Force re-render triggered');
      }, 100);

      console.log('🔄 [DEBUG] Refresh completed successfully');
    } catch (error) {
      console.error('🔄 [DEBUG] Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportUsers('csv');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
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
      applications_manager: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      application_reviewer: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      litmus_test_reviewer:
        'bg-violet-500/10 text-violet-600 dark:text-violet-400',
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

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find users by name, email, role, status, or creation date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchAndFilter
            onSearchChange={setSearchTerm}
            onRoleFilterChange={setSelectedRoles}
            onStatusFilterChange={setSelectedStatuses}
            onDateRangeChange={setDateRange}
            onClearFilters={clearFilters}
            searchTerm={searchTerm}
            selectedRoles={selectedRoles}
            selectedStatuses={selectedStatuses}
            dateRange={dateRange}
            isLoading={state.loading}
          />
        </CardContent>
      </Card>

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
              <AddUserDialog
                onAdded={handleRefresh}
                onInvitationCreated={() => setActiveTab('invited')}
              />
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={state.loading || isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${state.loading || isRefreshing ? 'animate-spin' : ''}`}
                />
                {state.loading || isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExport}
                disabled={state.loading || isExporting}
              >
                <Download className='h-4 w-4 mr-2' />
                {isExporting ? 'Exporting...' : 'Export'}
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
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {state.users.filter(user => user.status !== 'invited').length}{' '}
                  registered users
                </div>
              </div>
              <UserTable
                key={`registered-${refreshKey}`}
                showOnlyRegistered={true}
                state={state}
                toggleUserSelection={toggleUserSelection}
                selectAllUsers={selectAllUsers}
                isAllSelected={isAllSelected}
                deleteUser={deleteUser}
              />
            </TabsContent>

            <TabsContent value='invited' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing{' '}
                  {state.users.filter(user => user.status === 'invited').length}{' '}
                  invited users
                </div>
              </div>
              <UserTable 
                key={`invited-${refreshKey}`} 
                showOnlyInvited={true}
                state={state}
                toggleUserSelection={toggleUserSelection}
                selectAllUsers={selectAllUsers}
                isAllSelected={isAllSelected}
                deleteUser={deleteUser}
              />
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
