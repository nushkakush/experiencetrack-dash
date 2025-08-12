import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cohortStudentsService } from '@/services/cohortStudents.service';
import { Logger } from '@/lib/logging/Logger';
import { supabase } from '@/integrations/supabase/client';
import { CohortStudent } from '@/types/cohort';

interface UseInvitationAcceptanceProps {
  token: string | undefined;
  student: CohortStudent | null;
  cohortName: string;
  isExistingUser: boolean;
}

export const useInvitationAcceptance = ({ 
  token, 
  student, 
  cohortName, 
  isExistingUser 
}: UseInvitationAcceptanceProps) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleAcceptInvitation = async () => {
    if (!student || !token) return;

    // Validate password
    if (!isExistingUser && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isExistingUser && password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setProcessing(true);
    try {
      let userId: string;

      if (isExistingUser) {
        // Existing user - just sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: student.email,
          password: password,
        });

        if (error) {
          toast.error("Invalid password");
          return;
        }

        userId = data.user.id;
      } else {
        // New user - create account
        const { data, error } = await supabase.auth.signUp({
          email: student.email,
          password: password,
          options: {
            data: {
              first_name: student.first_name,
              last_name: student.last_name,
              role: "student",
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        // Since they came from an invitation link, we can trust their email
        // Let's confirm their email automatically using our Edge Function
        if (data.user && !data.user.email_confirmed_at) {
          Logger.getInstance().info("Attempting to confirm email for user", { userId: data.user.id });
          try {
            const confirmResponse = await fetch(
              `https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/confirm-user-email`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4`
                },
                body: JSON.stringify({
                  userId: data.user.id
                })
              }
            );
            
            if (confirmResponse.ok) {
              Logger.getInstance().info("Email confirmed automatically");
            } else {
              const errorText = await confirmResponse.text();
              console.warn("Failed to auto-confirm email:", errorText);
            }
          } catch (error) {
            console.warn("Error confirming email:", error);
          }
        }

        if (error) {
          console.error("Signup error:", error);
          toast.error(error.message);
          return;
        }

        Logger.getInstance().info("User created successfully", { userId: data.user.id });
        userId = data.user!.id;
      }

      // Ensure user is properly authenticated before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("No active session found after authentication");
        toast.error("Authentication failed. Please try again.");
        return;
      }

      // Accept the invitation using Supabase client (authenticated)
      try {
              Logger.getInstance().info('Attempting to accept invitation', { token, userId });
        
        // Use the cohortStudentsService for better error handling
        const acceptResult = await cohortStudentsService.acceptInvitation(token, userId);
        
        if (!acceptResult.success) {
          console.error("Failed to accept invitation:", acceptResult.error);
          toast.error("Failed to join cohort. Please try again.");
          return;
        }

        Logger.getInstance().info('Successfully accepted invitation', { result: acceptResult.data });
        toast.success(`Welcome to ExperienceTrack! You have successfully joined ${cohortName || "the cohort"}.`);
        
        // Add a small delay to ensure the database update is complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        navigate("/dashboard");
      } catch (error) {
        console.error("Error accepting invitation:", error);
        toast.error("Failed to join cohort. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast.error("An error occurred while accepting the invitation");
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    handleAcceptInvitation
  };
};
