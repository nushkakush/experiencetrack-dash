import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardShell from '@/components/DashboardShell';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ProgramCalendarView,
  ProgramHeader,
  PlanSessionModal,
} from '@/components/programs';
import { EpicMasterAssignment } from '@/components/epicMaster';
import { ManageSessionDialog } from '@/components/sessions';
import { DeleteSessionDialog } from '@/components/ui/sessions';
import { EditChallengeNameDialog } from '@/components/ui/EditChallengeNameDialog';
import { useProgramData } from '@/hooks/programs';
import {
  sessionPlanningService,
  SessionType,
  PlannedSession,
} from '@/services/sessionPlanningService';
import { CBLBoundaryService } from '@/services/cblBoundaryService';
import { cblService } from '@/services/cblService';
import { cohortSettingsService } from '@/services/cohortSettingsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CohortProgramPage: React.FC = () => {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPlanSessionModalOpen, setIsPlanSessionModalOpen] = useState(false);
  const [planningSession, setPlanningSession] = useState<{
    date: Date;
    sessionNumber: number;
  } | null>(null);
  const [isPlanningSession, setIsPlanningSession] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{
    session: PlannedSession;
    sessionNumber: number;
  } | null>(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
  const [isEditChallengeDialogOpen, setIsEditChallengeDialogOpen] =
    useState(false);
  const [challengeToEdit, setChallengeToEdit] = useState<{
    id: string;
    currentTitle: string;
  } | null>(null);
  const [isManageSessionDialogOpen, setIsManageSessionDialogOpen] = useState(false);
  const [sessionToManage, setSessionToManage] = useState<PlannedSession | null>(null);

  const [plannedSessions, setPlannedSessions] = useState<PlannedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { user } = useAuth();

  const {
    cohort,
    epics,
    selectedEpic,
    setSelectedEpic,
    epicMasterAssignment,
    sessionMentorAssignments,
    loading,
    error,
    refetchEpics,
    refetchEpicMasterAssignment,
    loadSessionMentorAssignments,
    refetchSessionMentorAssignments,
  } = useProgramData(cohortId);

  // Fetch planned sessions when epic changes
  useEffect(() => {
    if (cohortId && selectedEpic) {
      fetchPlannedSessions();
    }
  }, [cohortId, selectedEpic]);

  // Refresh challenge titles when sessions are loaded
  useEffect(() => {
    if (plannedSessions.length > 0) {
      refreshChallengeTitles();
    }
  }, [plannedSessions.length]);

  const fetchPlannedSessions = async () => {
    if (!cohortId || !selectedEpic) return;

    setLoadingSessions(true);
    try {
      const result = await sessionPlanningService.getPlannedSessions(
        cohortId,
        selectedEpic
      );
      if (result.success) {
        const sessions = result.data || [];
        setPlannedSessions(sessions);
        
        // Load session mentor assignments for these sessions
        const sessionIds = sessions.map(s => s.id);
        await loadSessionMentorAssignments(sessionIds);
      } else {
        console.error('Failed to fetch planned sessions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching planned sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Function to refresh challenge titles for existing sessions
  const refreshChallengeTitles = async () => {
    try {
      // Get all unique challenge IDs from current sessions
      const challengeIds = [
        ...new Set(
          plannedSessions
            .filter(session => session.cbl_challenge_id)
            .map(session => session.cbl_challenge_id)
        ),
      ];

      // Fetch challenge titles for each unique challenge ID
      const challengeTitles = new Map();
      for (const challengeId of challengeIds) {
        const { data: challenge, error } = await supabase
          .from('cbl_challenges')
          .select('id, title')
          .eq('id', challengeId)
          .single();

        if (!error && challenge) {
          challengeTitles.set(challengeId, challenge.title);
        }
      }

      // Update local state with challenge titles
      setPlannedSessions(prev =>
        prev.map(session => {
          if (
            session.cbl_challenge_id &&
            challengeTitles.has(session.cbl_challenge_id)
          ) {
            return {
              ...session,
              challenge_title: challengeTitles.get(session.cbl_challenge_id),
            };
          }
          return session;
        })
      );
    } catch (error) {
      console.error('Error refreshing challenge titles:', error);
    }
  };

  const handleEpicChange = (epicId: string) => {
    setSelectedEpic(epicId);
  };

  const handleEpicActiveChanged = async () => {
    await refetchEpics();
  };

  const handleManageSession = (session: PlannedSession) => {
    setSessionToManage(session);
    setIsManageSessionDialogOpen(true);
  };

  const handleSessionUpdate = async () => {
    // Refresh session mentor assignments and session data
    const sessionIds = plannedSessions.map(s => s.id);
    await refetchSessionMentorAssignments(sessionIds);
    await fetchPlannedSessions();
  };

  const handlePlanSession = (date: Date, sessionNumber: number) => {
    setPlanningSession({ date, sessionNumber });
    setIsPlanSessionModalOpen(true);
  };

  const handleConfirmPlanSession = async (
    sessionType: SessionType,
    title: string,
    startTime?: string,
    endTime?: string
  ) => {
    if (!planningSession || !user) return;

    setIsPlanningSession(true);
    try {
      if (sessionType === 'cbl') {
        // Handle CBL challenge creation (no time overrides for CBL)
        const result = await cblService.createCBLChallengeWithSessions(
          {
            cohort_id: cohortId,
            epic_id: selectedEpic,
            title: title,
            created_by: user.id,
          },
          planningSession.date,
          cohort.sessions_per_day
        );

        if (result.success) {
          toast.success(
            `CBL Challenge "${title}" created successfully with all 5 sessions!`
          );
          handleClosePlanSessionModal();
          await fetchPlannedSessions();
        } else {
          toast.error(result.error || 'Failed to create CBL challenge');
        }
      } else if (sessionType === 'mock_challenge') {
        // Check authentication before creating mock challenge
        if (!user) {
          toast.error('You must be logged in to create mock challenges');
          return;
        }

        // Check if user has proper role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          toast.error('User profile not found. Please contact support.');
          return;
        }

        const allowedRoles = [
          'super_admin',
          'program_manager',
          'mentor_manager',
        ];
        if (!allowedRoles.includes(profile.role)) {
          toast.error(
            'Insufficient permissions. Only super admins, program managers, and mentor managers can create mock challenges.'
          );
          return;
        }

        // Handle Mock Challenge creation (no time overrides for Mock Challenge)
        const result = await cblService.createMockChallengeWithSessions(
          {
            cohort_id: cohortId,
            epic_id: selectedEpic,
            title: title,
            created_by: user.id,
          },
          planningSession.date,
          cohort.sessions_per_day
        );

        if (result.success) {
          toast.success(
            `Mock Challenge "${title}" created successfully with all 2 sessions!`
          );
          handleClosePlanSessionModal();
          await fetchPlannedSessions();
        } else {
          toast.error(result.error || 'Failed to create Mock Challenge');
        }
      } else {
        // Handle regular session creation
        const sessionDate =
          planningSession.date.getFullYear() +
          '-' +
          String(planningSession.date.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(planningSession.date.getDate()).padStart(2, '0');

        // Check if session is already planned
        const checkResult =
          await sessionPlanningService.isSessionAlreadyPlanned(
            cohortId,
            selectedEpic,
            sessionDate,
            planningSession.sessionNumber
          );

        if (checkResult.success && checkResult.isPlanned) {
          toast.error(
            'A session is already planned for this date and session number'
          );
          return;
        }

        // Use the title the user entered
        const finalTitle = title;

        // Check if this is an individual CBL session within a challenge boundary
        let cblChallengeId: string | undefined;
        const isIndividualCBL = ['learn', 'innovate', 'transform'].includes(
          sessionType
        );

        if (isIndividualCBL) {
          console.log(
            `🔍 Creating individual CBL session "${title}" of type "${sessionType}"`
          );
          // Detect CBL boundaries to find the challenge ID
          const boundaries = await CBLBoundaryService.detectCBLVisualBoundaries(
            plannedSessions as any,
            cohortId,
            selectedEpic
          );
          const currentDate = new Date(
            planningSession.date.getFullYear(),
            planningSession.date.getMonth(),
            planningSession.date.getDate()
          );

          console.log(`🔍 Available boundaries:`, boundaries);
          console.log(
            `🔍 Current date: ${currentDate.toISOString().split('T')[0]}`
          );

          const containingBoundary = boundaries.find(b => {
            if (!b.cblStartDate || !b.cblEndDate) return false;
            const startDate = new Date(
              b.cblStartDate.getFullYear(),
              b.cblStartDate.getMonth(),
              b.cblStartDate.getDate()
            );
            const endDate = new Date(
              b.cblEndDate.getFullYear(),
              b.cblEndDate.getMonth(),
              b.cblEndDate.getDate()
            );
            return currentDate >= startDate && currentDate <= endDate;
          });

          console.log(`🔍 Containing boundary:`, containingBoundary);

          if (containingBoundary && containingBoundary.cblChallengeId) {
            cblChallengeId = containingBoundary.cblChallengeId;
            console.log(
              `✅ Setting cblChallengeId to: ${cblChallengeId} from boundary`
            );
          } else {
            console.log(
              `❌ No containing boundary found or no challenge ID in boundary`
            );
            console.log(`🔍 Boundary details:`, containingBoundary);
          }
        }

        // Convert times to UTC if provided, otherwise use cohort defaults
        const toUtcIso = (
          baseDate: Date,
          hhmm?: string
        ): string | undefined => {
          if (!hhmm) return undefined;
          const [hh, mm] = hhmm.split(':').map(Number);
          // Create a local date with the specified time
          const local = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            hh || 0,
            mm || 0,
            0,
            0
          );
          // Convert to UTC for storage, but preserve the date by using UTC methods
          const utc = new Date(
            Date.UTC(
              local.getFullYear(),
              local.getMonth(),
              local.getDate(),
              local.getHours(),
              local.getMinutes(),
              local.getSeconds()
            )
          );
          return utc.toISOString();
        };

        // Use provided times or fall back to cohort defaults
        let finalStartTime: string | undefined;
        let finalEndTime: string | undefined;

        if (startTime && endTime) {
          // Use provided times
          finalStartTime = toUtcIso(planningSession.date, startTime);
          finalEndTime = toUtcIso(planningSession.date, endTime);
        } else {
          // Fall back to cohort defaults
          const defaults =
            await cohortSettingsService.getDefaultSessionTimes(cohortId);
          const slotDefaults = defaults.find(
            d => d.sessionNumber === planningSession.sessionNumber
          );
          finalStartTime = toUtcIso(planningSession.date, slotDefaults?.start);
          finalEndTime = toUtcIso(planningSession.date, slotDefaults?.end);
        }

        // Create the planned session
        const result = await sessionPlanningService.createPlannedSession({
          cohort_id: cohortId,
          epic_id: selectedEpic,
          session_date: sessionDate,
          session_number: planningSession.sessionNumber,
          session_type: sessionType,
          title: finalTitle,
          created_by: user.id,
          start_time: finalStartTime,
          end_time: finalEndTime,
          cbl_challenge_id: cblChallengeId, // Link to CBL challenge if within boundary
          original_cbl: false, // Individual sessions are not original CBL sessions
        });

        if (result.success && result.data) {
          // Determine success message based on session type
          const isIndividualCBL2 = ['learn', 'innovate', 'transform'].includes(
            sessionType
          );
          const successMessage =
            isIndividualCBL2 && cblChallengeId
              ? `Individual ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} session added to CBL challenge`
              : `Session "${title}" planned successfully!`;

          toast.success(successMessage);
          handleClosePlanSessionModal();

          // Optimistically add the new session to local state
          setPlannedSessions(prev => [...prev, result.data]);

          // If this is a CBL session, refresh the sessions to ensure challenge_title is populated
          if (cblChallengeId) {
            setTimeout(async () => {
              await fetchPlannedSessions();
            }, 100);
          }
        } else {
          toast.error(result.error || 'Failed to plan session');
        }
      }
    } catch (error) {
      console.error('Failed to plan session:', error);
      toast.error('Failed to plan session. Please try again.');
    } finally {
      setIsPlanningSession(false);
    }
  };

  const handleClosePlanSessionModal = () => {
    setIsPlanSessionModalOpen(false);
    setPlanningSession(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    // This is a regular planned session deletion
    const session = plannedSessions.find(s => s.id === sessionId);
    if (session) {
      // Find the session number by looking at the session data
      const sessionNumber = session.session_number || 1;
      setSessionToDelete({ session, sessionNumber });
      setIsDeleteDialogOpen(true);
    }
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;

    setIsDeletingSession(true);
    try {
      const session = sessionToDelete.session;
      const sessionType = session.session_type;
      const isCBLSession = [
        'cbl',
        'challenge_intro',
        'learn',
        'innovate',
        'transform',
        'reflection',
      ].includes(sessionType);

      let result;

      if (isCBLSession && session.original_cbl) {
        // This is an original CBL session - delete the entire challenge group
        result = await sessionPlanningService.deleteCBLChallengeGroup(
          session.id
        );
      } else {
        // Individual CBL session or regular session - delete only this session
        result = await sessionPlanningService.deletePlannedSession(session.id);
      }

      if (result.success) {
        if (isCBLSession && session.original_cbl) {
          // Original CBL session - remove all sessions with the same cbl_challenge_id
          setPlannedSessions(prev =>
            prev.filter(s => s.cbl_challenge_id !== session.cbl_challenge_id)
          );
          toast.success(
            `CBL Challenge deleted successfully (${result.deletedCount || 'multiple'} sessions removed)`
          );
        } else {
          // Individual session or regular session - remove only this session
          setPlannedSessions(prev => prev.filter(s => s.id !== session.id));
          toast.success(`Session "${session.title}" deleted successfully`);
        }
        handleCloseDeleteDialog();
      } else {
        toast.error(result.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session. Please try again.');
    } finally {
      setIsDeletingSession(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className='space-y-6'>
          <Skeleton className='h-10 w-24' />
          <div>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-48' />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-32 w-full' />
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !cohort) {
    return (
      <DashboardShell>
        <div className='space-y-6'>
          <div className='text-center py-8'>
            <h1 className='text-2xl font-bold mb-4'>
              {error ? 'Error Loading Cohort' : 'Cohort Not Found'}
            </h1>
            <p className='text-muted-foreground'>
              {error || 'The requested cohort could not be found.'}
            </p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className='space-y-6'>
        {/* Program Header with Epic Selection */}
        <ProgramHeader
          cohort={cohort}
          epics={epics}
          selectedEpic={selectedEpic}
          onEpicChange={handleEpicChange}
          onEpicActiveChanged={handleEpicActiveChanged}
        />

        {/* Epic Master Assignment */}
        {selectedEpic && (
          <EpicMasterAssignment
            cohortEpicId={selectedEpic}
            epicName={epics.find(epic => epic.id === selectedEpic)?.epic?.name || epics.find(epic => epic.id === selectedEpic)?.name || 'Unknown Epic'}
            assignment={epicMasterAssignment}
            loading={loading}
            onAssignmentChange={refetchEpicMasterAssignment}
          />
        )}

        {/* Program Calendar View */}
        {cohortId && selectedEpic && (
          <ProgramCalendarView
            cohortId={cohortId}
            epicId={selectedEpic}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            sessionsPerDay={cohort.sessions_per_day}
            onPlanSession={handlePlanSession}
            onDeleteSession={handleDeleteSession}
            onMoveSession={async (sessionId, newDate, newSessionNumber) => {
              try {
                console.log(
                  `🔄 Attempting to move session ${sessionId} to slot ${newSessionNumber} on ${newDate.toDateString()}`
                );

                // Find the session being moved
                const sessionToMove = plannedSessions.find(
                  s => s.id === sessionId
                );
                if (!sessionToMove) {
                  console.error('❌ Session to move not found:', sessionId);
                  toast.error('Session not found');
                  return;
                }

                console.log(
                  `📋 Moving session: "${sessionToMove.title}" from slot ${sessionToMove.session_number} to slot ${newSessionNumber}`
                );

                // Format date to YYYY-MM-DD
                const sessionDate =
                  newDate.getFullYear() +
                  '-' +
                  String(newDate.getMonth() + 1).padStart(2, '0') +
                  '-' +
                  String(newDate.getDate()).padStart(2, '0');

                // Check if the target slot is already occupied by another regular session
                console.log(
                  `🔍 Checking if slot ${newSessionNumber} is occupied by another regular session...`
                );
                const existingSession = plannedSessions.find(
                  s =>
                    s.session_date === sessionDate &&
                    s.session_number === newSessionNumber &&
                    s.id !== sessionId // This ensures we don't block the session from moving to its own slot
                );

                if (existingSession) {
                  console.log(
                    `❌ Slot ${newSessionNumber} is occupied by another session: "${existingSession.title}"`
                  );
                  toast.error(
                    `Cannot move session - slot ${newSessionNumber} is already occupied by "${existingSession.title}"`
                  );
                  return;
                }

                console.log(
                  `✅ Slot ${newSessionNumber} is available for move`
                );

                // Get the default times for the new session slot
                const defaults =
                  await cohortSettingsService.getDefaultSessionTimes(cohortId);
                const slotDefaults = defaults.find(
                  d => d.sessionNumber === newSessionNumber
                );

                // Convert times to UTC if available
                const toUtcIso = (
                  baseDate: Date,
                  hhmm?: string
                ): string | undefined => {
                  if (!hhmm) return undefined;
                  const [hh, mm] = hhmm.split(':').map(Number);
                  const local = new Date(
                    baseDate.getFullYear(),
                    baseDate.getMonth(),
                    baseDate.getDate(),
                    hh || 0,
                    mm || 0,
                    0,
                    0
                  );
                  // Convert to UTC for storage, but preserve the date by using UTC methods
                  const utc = new Date(
                    Date.UTC(
                      local.getFullYear(),
                      local.getMonth(),
                      local.getDate(),
                      local.getHours(),
                      local.getMinutes(),
                      local.getSeconds()
                    )
                  );
                  return utc.toISOString();
                };

                const newStartTime = toUtcIso(newDate, slotDefaults?.start);
                const newEndTime = toUtcIso(newDate, slotDefaults?.end);

                console.log(
                  `⏰ Updating session times to slot ${newSessionNumber} defaults:`,
                  {
                    start: slotDefaults?.start,
                    end: slotDefaults?.end,
                    newStartTime,
                    newEndTime,
                  }
                );

                // Store previous state for potential rollback
                const previousSessions = [...plannedSessions];

                // Optimistically update local state immediately
                const updatedSessions = plannedSessions.map(session =>
                  session.id === sessionId
                    ? {
                        ...session,
                        session_date: sessionDate,
                        session_number: newSessionNumber,
                        start_time: newStartTime,
                        end_time: newEndTime,
                      }
                    : session
                );
                setPlannedSessions(updatedSessions);

                // Make API call in background
                console.log(`🚀 Making API call to update session...`);
                const result =
                  await sessionPlanningService.updatePlannedSession(sessionId, {
                    session_date: sessionDate,
                    session_number: newSessionNumber,
                    start_time: newStartTime,
                    end_time: newEndTime,
                  });

                if (result.success) {
                  console.log(
                    `✅ Session moved successfully with updated times`
                  );
                  toast.success(
                    `Session moved to slot ${newSessionNumber} with updated times`
                  );
                  // No need to refetch - we already updated optimistically
                } else {
                  console.error(`❌ API call failed:`, result.error);
                  // Revert optimistic update on error
                  setPlannedSessions(previousSessions);
                  toast.error(result.error || 'Failed to move session');
                }
              } catch (err) {
                console.error('💥 Move session failed with error:', err);
                // Revert optimistic update on error - refetch to ensure consistency
                await fetchPlannedSessions();
                toast.error('Failed to move session');
              }
            }}
            onUpdateSession={async (sessionId, updates) => {
              try {
                const result =
                  await sessionPlanningService.updatePlannedSession(
                    sessionId,
                    updates
                  );
                if (result.success) {
                  // Update local state
                  setPlannedSessions(prev =>
                    prev.map(session =>
                      session.id === sessionId
                        ? { ...session, ...updates }
                        : session
                    )
                  );
                  toast.success('Session title updated successfully');
                } else {
                  toast.error(result.error || 'Failed to update session title');
                }
              } catch (error) {
                console.error('Failed to update session title:', error);
                toast.error('Failed to update session title');
              }
            }}
            onEditChallenge={(challengeId, currentTitle) => {
              setChallengeToEdit({ id: challengeId, currentTitle });
              setIsEditChallengeDialogOpen(true);
            }}
            onSessionClick={handleManageSession}
            plannedSessions={plannedSessions}
            sessionMentorAssignments={sessionMentorAssignments}
            loadingSessions={loadingSessions}
            programCode={cohort.cohort_id}
          />
        )}

        {/* Plan Session Modal */}
        <PlanSessionModal
          isOpen={isPlanSessionModalOpen}
          onClose={handleClosePlanSessionModal}
          onConfirm={handleConfirmPlanSession}
          selectedDate={planningSession?.date || new Date()}
          sessionNumber={planningSession?.sessionNumber || 1}
          cohortId={cohortId}
          epicId={selectedEpic}
          sessionsPerDay={cohort.sessions_per_day}
          userId={user?.id || ''}
          plannedSessions={plannedSessions}
        />

        {/* Delete Session Dialog */}
        <DeleteSessionDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          session={sessionToDelete?.session || null}
          sessionNumber={sessionToDelete?.sessionNumber || 1}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeletingSession}
        />

        {/* Manage Session Dialog */}
        <ManageSessionDialog
          isOpen={isManageSessionDialogOpen}
          onClose={() => {
            setIsManageSessionDialogOpen(false);
            setSessionToManage(null);
          }}
          session={sessionToManage}
          cohortEpicId={selectedEpic}
          onSessionUpdate={handleSessionUpdate}
          onSessionDelete={handleDeleteSession}
        />

        {/* Edit Challenge Name Dialog */}
        <EditChallengeNameDialog
          isOpen={isEditChallengeDialogOpen}
          onClose={() => {
            setIsEditChallengeDialogOpen(false);
            setChallengeToEdit(null);
          }}
          onSave={async newTitle => {
            if (!challengeToEdit) return;

            try {
              const result = await cblService.updateCBLChallengeTitle(
                challengeToEdit.id,
                newTitle
              );

              if (result.success) {
                // Update local state - update challenge_title for all sessions with this challenge ID
                setPlannedSessions(prev =>
                  prev.map(session =>
                    session.cbl_challenge_id === challengeToEdit.id
                      ? { ...session, challenge_title: newTitle }
                      : session
                  )
                );
                toast.success('Challenge name updated successfully');
              } else {
                toast.error(result.error || 'Failed to update challenge name');
              }
            } catch (error) {
              console.error('Failed to update challenge name:', error);
              toast.error('Failed to update challenge name');
            }
          }}
          currentTitle={challengeToEdit?.currentTitle || ''}
          challengeId={challengeToEdit?.id || ''}
        />
      </div>
    </DashboardShell>
  );
};

export default CohortProgramPage;
