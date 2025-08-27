import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Activity,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { UserProfile } from '@/types/userManagement';
import { UserRole } from '@/types/auth';
import { format } from 'date-fns';

interface UserDetailsDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const { updateUser } = useUserManagement();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role,
    status: user.status,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUser(user.user_id, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      status: user.status,
    });
    setIsEditing(false);
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      student: 'bg-blue-100 text-blue-800',
      super_admin: 'bg-red-100 text-red-800',
      program_manager: 'bg-green-100 text-green-800',
      fee_collector: 'bg-yellow-100 text-yellow-800',
      partnerships_head: 'bg-purple-100 text-purple-800',
      placement_coordinator: 'bg-indigo-100 text-indigo-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            {isEditing ? 'Edit User' : 'User Details'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update user information and permissions'
              : 'View and manage user account details'}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='first_name'>First Name</Label>
                  {isEditing ? (
                    <Input
                      id='first_name'
                      value={formData.first_name}
                      onChange={e =>
                        handleInputChange('first_name', e.target.value)
                      }
                      placeholder='Enter first name'
                    />
                  ) : (
                    <div className='text-sm text-muted-foreground'>
                      {user.first_name || 'Not provided'}
                    </div>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='last_name'>Last Name</Label>
                  {isEditing ? (
                    <Input
                      id='last_name'
                      value={formData.last_name}
                      onChange={e =>
                        handleInputChange('last_name', e.target.value)
                      }
                      placeholder='Enter last name'
                    />
                  ) : (
                    <div className='text-sm text-muted-foreground'>
                      {user.last_name || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <div className='text-sm text-muted-foreground'>
                    {user.email || 'Not provided'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role and Status */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Role & Status</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='role'>Role</Label>
                  {isEditing ? (
                    <Select
                      value={formData.role}
                      onValueChange={value => handleInputChange('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='student'>Student</SelectItem>
                        <SelectItem value='program_manager'>
                          Program Manager
                        </SelectItem>
                        <SelectItem value='fee_collector'>
                          Fee Collector
                        </SelectItem>
                        <SelectItem value='partnerships_head'>
                          Partnerships Head
                        </SelectItem>
                        <SelectItem value='placement_coordinator'>
                          Placement Coordinator
                        </SelectItem>
                        <SelectItem value='equipment_manager'>
                          Equipment Manager
                        </SelectItem>
                        <SelectItem value='super_admin'>Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant='secondary'
                      className={getRoleColor(user.role)}
                    >
                      {user.role.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Status</Label>
                  {isEditing ? (
                    <Select
                      value={formData.status}
                      onValueChange={value =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='active'>Active</SelectItem>
                        <SelectItem value='inactive'>Inactive</SelectItem>
                        <SelectItem value='suspended'>Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant='secondary'
                      className={getStatusColor(user.status)}
                    >
                      {user.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Account Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Created</Label>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      {format(new Date(user.created_at), 'PPP')}
                    </div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label>Last Updated</Label>
                  <div className='flex items-center gap-2'>
                    <Activity className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      {format(new Date(user.updated_at), 'PPP')}
                    </div>
                  </div>
                </div>
              </div>
              {user.last_login && (
                <div className='space-y-2'>
                  <Label>Last Login</Label>
                  <div className='flex items-center gap-2'>
                    <Activity className='h-4 w-4 text-muted-foreground' />
                    <div className='text-sm text-muted-foreground'>
                      {format(new Date(user.last_login), 'PPP p')}
                    </div>
                  </div>
                </div>
              )}
              <div className='space-y-2'>
                <Label>Login Count</Label>
                <div className='text-sm text-muted-foreground'>
                  {user.login_count} login(s)
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant='outline'
                onClick={handleCancel}
                disabled={loading}
              >
                <X className='h-4 w-4 mr-2' />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className='h-4 w-4 mr-2' />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant='outline' onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className='h-4 w-4 mr-2' />
                Edit User
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
