import { useState, useEffect } from 'react';
import { CohortStudent } from '@/types/cohort';

interface UseInvitationLoadingProps {
  token: string | undefined;
}

export const useInvitationLoading = ({ token }: UseInvitationLoadingProps) => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<CohortStudent | null>(null);
  const [cohortName, setCohortName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Use direct API call to bypass service authentication issues
      const response = await fetch(
        `https://ghmpaghyasyllfvamfna.supabase.co/rest/v1/cohort_students?select=*&invitation_token=eq.${token}`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || data.length === 0) {
        setError("Invalid or expired invitation link");
        setLoading(false);
        return;
      }

      const studentData = data[0];
      
      // Check if invitation has expired
      if (studentData.invitation_expires_at && new Date() > new Date(studentData.invitation_expires_at)) {
        setError("This invitation has expired. Please contact your program coordinator for a new invitation.");
        setLoading(false);
        return;
      }

      // Check if already accepted
      if (studentData.invite_status === 'accepted') {
        setError("This invitation has already been accepted.");
        setLoading(false);
        return;
      }

      setStudent(studentData);

      // Fetch cohort name
      try {
        const cohortResponse = await fetch(
          `https://ghmpaghyasyllfvamfna.supabase.co/rest/v1/cohorts?select=name&id=eq.${studentData.cohort_id}`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (cohortResponse.ok) {
          const cohortData = await cohortResponse.json();
          if (cohortData && cohortData.length > 0) {
            setCohortName(cohortData[0].name);
          }
        }
      } catch (error) {
        console.error("Error fetching cohort name:", error);
        // Don't fail the invitation if we can't get the cohort name
      }

      // Check if user already exists - we'll handle this differently
      // For now, we'll assume new user and let the signup process handle it
      setIsExistingUser(false);
      
      setLoading(false);
    } catch (error: unknown) {
      console.error("Error loading invitation:", error);
      setError(error?.message || "Failed to load invitation details");
      setLoading(false);
    }
  };

  return {
    loading,
    student,
    cohortName,
    error,
    isExistingUser
  };
};
