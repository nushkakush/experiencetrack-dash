import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { cohortStudentsService } from "@/services/cohortStudents.service";
import { CohortStudent } from "@/types/cohort";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, UserPlus } from "lucide-react";

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [student, setStudent] = useState<CohortStudent | null>(null);
  const [cohortName, setCohortName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  
  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");

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
      setEmail(studentData.email);

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
    } catch (error: any) {
      console.error("Error loading invitation:", error);
      setError(error?.message || "Failed to load invitation details");
      setLoading(false);
    }
  };

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
          console.log("Attempting to confirm email for user:", data.user.id);
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
              console.log("Email confirmed automatically");
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

        console.log("User created successfully:", data.user);
        userId = data.user!.id;
      }

      // Accept the invitation using Supabase client (authenticated)
      try {
        console.log('Attempting to accept invitation with token:', token);
        console.log('User ID to link:', userId);
        
        // Direct Supabase client call
        const { data: updateData, error: acceptError } = await supabase
          .from('cohort_students')
          .update({
            invite_status: "accepted",
            accepted_at: new Date().toISOString(),
            user_id: userId
          })
          .eq('invitation_token', token)
          .select();

        if (acceptError) {
          console.error("Failed to accept invitation:", acceptError);
          console.error("Error details:", {
            code: acceptError.code,
            message: acceptError.message,
            details: acceptError.details,
            hint: acceptError.hint
          });
          toast.error("Failed to join cohort. Please try again.");
          return;
        }

        console.log('Successfully accepted invitation:', updateData);
        toast.success(`Welcome to ExperienceTrack! You have successfully joined ${cohortName || "the cohort"}.`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        {/* Theme Toggle in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        {/* Theme Toggle in top-right corner */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Invitation Error
            </CardTitle>
            <CardDescription>
              There was a problem with your invitation link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => navigate("/")} className="w-full">
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Theme Toggle in top-right corner */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Welcome to ExperienceTrack!</CardTitle>
          <CardDescription>
            You've been invited to join {cohortName || "a cohort"}. Please set up your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Name:</strong> {student.first_name} {student.last_name}</p>
              <p><strong>Email:</strong> {student.email}</p>
              {cohortName && <p><strong>Cohort:</strong> {cohortName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isExistingUser ? "Password" : "Create Password"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isExistingUser ? "Enter your password" : "Create a password"}
            />
          </div>

          {!isExistingUser && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
          )}

          <Button 
            onClick={handleAcceptInvitation} 
            disabled={processing || !password}
            className="w-full"
          >
            {processing ? (
              "Processing..."
            ) : isExistingUser ? (
              "Join Cohort"
            ) : (
              "Create Account & Join Cohort"
            )}
          </Button>

          {isExistingUser && (
            <p className="text-sm text-gray-600 text-center">
              You already have an account. Please enter your password to join this cohort.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
