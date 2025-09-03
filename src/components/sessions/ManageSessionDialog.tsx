import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Settings, 
  FileText, 
  Clock, 
  MapPin, 
  Calendar,
  Edit3,
  Trash2,
  User
} from 'lucide-react';
import { SessionMentorAssignmentDialog } from '@/components/sessionMentor';
import { MentorAssignmentDisplay } from '@/components/sessionMentor/MentorAssignmentDisplay';
import { SessionService } from '@/domains/sessions/services/SessionService';
import { SessionMentorService } from '@/services/sessionMentor.service';
import type { Session } from '@/domains/sessions/types';
import type { SessionMentorAssignmentWithMentor } from '@/types/sessionMentorAssignment';
import { cn } from '@/lib/utils';

interface ManageSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  cohortEpicId: string;
  onSessionUpdate?: () => void;
  onSessionDelete?: (sessionId: string) => void;
}

type SidebarSection = 'overview' | 'mentors' | 'settings' | 'details';

export const ManageSessionDialog: React.FC<ManageSessionDialogProps> = ({
  isOpen,
  onClose,
  session,
  cohortEpicId,
  onSessionUpdate,
  onSessionDelete,
}) => {
  const [activeSection, setActiveSection] = useState<SidebarSection>('overview');
  const [isMentorAssignmentOpen, setIsMentorAssignmentOpen] = useState(false);
  const [mentorAssignments, setMentorAssignments] = useState<SessionMentorAssignmentWithMentor[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Load mentor assignments when session changes
  useEffect(() => {
    if (session && isOpen) {
      loadMentorAssignments();
    }
  }, [session, isOpen]);

  const loadMentorAssignments = async () => {
    if (!session) return;
    
    setLoadingAssignments(true);
    try {
      const result = await SessionMentorService.getSessionMentorAssignments(session.id);
      if (result.success) {
        setMentorAssignments(result.data || []);
      }
    } catch (error) {
      console.error('Error loading mentor assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const handleMentorAssignmentChange = async () => {
    await loadMentorAssignments();
    onSessionUpdate?.();
  };

  if (!session) return null;

  const sessionConfig = SessionService.getSessionTypeConfig(session.session_type);

  const sidebarItems = [
    {
      id: 'overview' as SidebarSection,
      label: 'Overview',
      icon: FileText,
      description: 'Session details and information'
    },
    {
      id: 'mentors' as SidebarSection,
      label: 'Assign Mentors',
      icon: Users,
      description: 'Manage mentor assignments',
      badge: mentorAssignments.length > 0 ? mentorAssignments.length.toString() : undefined
    },
    {
      id: 'settings' as SidebarSection,
      label: 'Settings',
      icon: Settings,
      description: 'Session configuration'
    },
    {
      id: 'details' as SidebarSection,
      label: 'Details',
      icon: Calendar,
      description: 'Advanced session details'
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-lg',
                sessionConfig.color
              )}>
                <sessionConfig.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{session.title}</h3>
                <p className="text-sm text-muted-foreground">{sessionConfig.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Session Date</span>
                </div>
                <p className="text-sm font-medium">
                  {new Date(session.session_date).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Session Number</span>
                </div>
                <p className="text-sm font-medium">#{session.session_number}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Status</span>
                </div>
                <Badge variant="secondary">{session.status}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>Session Type</span>
                </div>
                <Badge className={sessionConfig.color}>
                  {sessionConfig.label}
                </Badge>
              </div>
            </div>

            {(session.start_time || session.end_time) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Timing</span>
                </div>
                <p className="text-sm font-medium">
                  {session.start_time && new Date(session.start_time).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                  {session.start_time && session.end_time && ' – '}
                  {session.end_time && new Date(session.end_time).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            )}

            {session.challenge_title && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Challenge</span>
                </div>
                <p className="text-sm font-medium">{session.challenge_title}</p>
              </div>
            )}
          </div>
        );

      case 'mentors':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Mentor Assignments</h3>
                <p className="text-sm text-muted-foreground">
                  Manage {sessionConfig.roleLabel.toLowerCase()}s for this session
                </p>
              </div>
              <Button
                onClick={() => setIsMentorAssignmentOpen(true)}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Assign {sessionConfig.roleLabel}
              </Button>
            </div>

            {loadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : mentorAssignments.length > 0 ? (
              <div className="space-y-4">
                <MentorAssignmentDisplay 
                  assignments={mentorAssignments}
                  showRoleBadges={true}
                  compact={false}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h4 className="text-lg font-medium mb-2">No {sessionConfig.roleLabel}s Assigned</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This session doesn't have any {sessionConfig.roleLabel.toLowerCase()}s assigned yet.
                </p>
                <Button
                  onClick={() => setIsMentorAssignmentOpen(true)}
                  variant="outline"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign {sessionConfig.roleLabel}
                </Button>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Session Settings</h3>
              <p className="text-sm text-muted-foreground">Configure session parameters</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Edit3 className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Edit Session Title</p>
                    <p className="text-sm text-muted-foreground">Change the session name</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Session Timing</p>
                    <p className="text-sm text-muted-foreground">Set start and end times</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Delete Session</p>
                    <p className="text-sm text-muted-foreground">Permanently remove this session</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (onSessionDelete) {
                      onSessionDelete(session.id);
                      onClose();
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Session Details</h3>
              <p className="text-sm text-muted-foreground">Advanced session information</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Session ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{session.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cohort ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{session.cohort_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Epic ID</p>
                  <p className="text-xs text-muted-foreground font-mono">{session.epic_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {session.created_at ? new Date(session.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {session.cbl_challenge_id && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-amber-600" />
                    <p className="font-medium text-amber-800">CBL Challenge</p>
                  </div>
                  <p className="text-sm text-amber-700">Challenge ID: {session.cbl_challenge_id}</p>
                  {session.original_cbl && (
                    <p className="text-xs text-amber-600 mt-1">Original CBL Session</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-md',
                sessionConfig.color
              )}>
                <sessionConfig.icon className="h-5 w-5" />
              </div>
              Manage Session: {session.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/30 p-4">
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors',
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge 
                            variant={activeSection === item.id ? "secondary" : "outline"}
                            className="ml-2 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs opacity-75 truncate">{item.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {renderContent()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Mentor Assignment Dialog */}
      {session && (
        <SessionMentorAssignmentDialog
          isOpen={isMentorAssignmentOpen}
          onClose={() => setIsMentorAssignmentOpen(false)}
          sessionId={session.id}
          sessionTitle={session.title}
          sessionType={session.session_type}
          cohortEpicId={cohortEpicId}
          onAssignmentsChange={handleMentorAssignmentChange}
        />
      )}
    </>
  );
};
