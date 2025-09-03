import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserRole } from '@/types/auth';
import { userInvitationService } from '@/services/userInvitation.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logging';
import { ValidationUtils } from '@/utils/validation';

interface AddUserDialogProps {
  onAdded?: () => void;
  onInvitationCreated?: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] =
  [
    {
      value: 'program_manager',
      label: 'Program Manager',
      description: 'Manage cohorts, attendance, and student progress',
    },
    {
      value: 'fee_collector',
      label: 'Fee Collector',
      description: 'Handle fee collection and payment management',
    },
    {
      value: 'partnerships_head',
      label: 'Partnerships Head',
      description: 'Manage partnerships and external relationships',
    },
    {
      value: 'placement_coordinator',
      label: 'Placement Coordinator',
      description: 'Coordinate student placements and career services',
    },
    {
      value: 'equipment_manager',
      label: 'Equipment Manager',
      description: 'Manage equipment inventory and student borrowing',
    },
    {
      value: 'mentor_manager',
      label: 'Mentor Manager',
      description: 'Manage mentors and mentorship programs',
    },
    {
      value: 'experience_designer',
      label: 'Experience Designer',
      description: 'Design and optimize user experiences across the platform',
    },
    {
      value: 'super_admin',
      label: 'Super Admin',
      description: 'Full system access and user management',
    },
  ];

export default function AddUserDialog({
  onAdded,
  onInvitationCreated,
}: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: '' as UserRole,
    send_invite: true,
  });

  const handleSubmit = async () => {
    if (!form.email.trim() || !form.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate email domain
    if (!ValidationUtils.isValidSignupEmail(form.email)) {
      toast.error(ValidationUtils.getEmailDomainError());
      return;
    }

    setLoading(true);
    try {
      // Create invitation
      const invitationResult = await userInvitationService.createInvitation(
        {
          email: form.email,
          first_name: form.first_name || undefined,
          last_name: form.last_name || undefined,
          role: form.role,
        },
        profile?.user_id || ''
      );

      if (!invitationResult.success || !invitationResult.data) {
        throw new Error(
          invitationResult.error || 'Failed to create invitation'
        );
      }

      // Send invitation email if requested
      if (form.send_invite) {
        try {
          const emailResult = await userInvitationService.sendInvitationEmail(
            invitationResult.data.id,
            form.email,
            form.first_name || '',
            form.last_name || '',
            form.role
          );

          if (emailResult.success) {
            if (emailResult.data?.emailSent) {
              toast.success('User invited and invitation email sent!');
            } else {
              toast.success(
                'User invited successfully! Invitation URL generated.'
              );
              logger.info('User invitation URL generated', {
                url: emailResult.data?.invitationUrl,
              });
            }
          } else {
            toast.error('User invited, but failed to prepare invitation.');
          }
        } catch (inviteError) {
          logger.error('Invitation email error', { error: inviteError });
          toast.error('User invited, but failed to send invitation email.');
        }
      } else {
        toast.success('User invited successfully!');
      }

      // Call onAdded callback to refresh the user list
      if (onAdded) {
        console.log('🔄 [DEBUG] AddUserDialog: Calling onAdded callback');
        // Add a small delay to ensure the database transaction is complete
        setTimeout(() => {
          console.log('🔄 [DEBUG] AddUserDialog: Executing onAdded callback');
          onAdded();
        }, 500); // Increased delay for better reliability
      }

      // Call onInvitationCreated callback to switch to invited users tab
      if (onInvitationCreated) {
        setTimeout(() => {
          console.log(
            '🔄 [DEBUG] AddUserDialog: Switching to invited users tab'
          );
          onInvitationCreated();
        }, 600);
      }

      setOpen(false);
    } catch (error) {
      console.error('Error creating user invitation:', error);
      toast.error('Failed to create user invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setForm({
          email: '',
          first_name: '',
          last_name: '',
          role: '' as UserRole,
          send_invite: true,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Invite a new user to join the system. They will receive an email
            invitation to set up their account.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='email' className='text-sm font-medium'>
              Email *
            </Label>
            <Input
              id='email'
              type='email'
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder='user@example.com'
              className='w-full'
            />
            <p className='text-xs text-muted-foreground'>
              {ValidationUtils.getLitschoolDomainMessage()}
            </p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='first_name' className='text-sm font-medium'>
                First Name
              </Label>
              <Input
                id='first_name'
                value={form.first_name}
                onChange={e => setForm({ ...form, first_name: e.target.value })}
                placeholder='John'
                className='w-full'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='last_name' className='text-sm font-medium'>
                Last Name
              </Label>
              <Input
                id='last_name'
                value={form.last_name}
                onChange={e => setForm({ ...form, last_name: e.target.value })}
                placeholder='Doe'
                className='w-full'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='role' className='text-sm font-medium'>
              Role *
            </Label>
            <Select
              value={form.role}
              onValueChange={value =>
                setForm({ ...form, role: value as UserRole })
              }
            >
              <SelectTrigger className='w-full text-left'>
                <SelectValue placeholder='Select a role' />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <div className='font-medium'>{role.label}</div>
                      <div className='text-sm text-muted-foreground'>
                        {role.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center space-x-3 pt-2'>
            <Checkbox
              id='send_invite'
              checked={form.send_invite}
              onCheckedChange={checked =>
                setForm({ ...form, send_invite: checked as boolean })
              }
            />
            <Label
              htmlFor='send_invite'
              className='text-sm text-muted-foreground'
            >
              Send invitation email immediately
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type='submit' onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
