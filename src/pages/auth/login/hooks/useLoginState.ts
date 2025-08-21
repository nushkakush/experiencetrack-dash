import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Logger } from '@/lib/logging/Logger';
import { ValidationUtils } from '@/utils/validation';

export const useLoginState = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Welcome back! You have been signed in successfully.");
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };



  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Password reset email sent! Please check your inbox.");
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    setResetEmail('');
  };

  return {
    email,
    password,
    showPassword,
    showForgotPassword,
    resetEmail,
    loading,
    setEmail,
    setPassword,
    setShowPassword,
    setShowForgotPassword,
    setResetEmail,
    handleSignIn,
    handleForgotPassword,
    handleBackToSignIn
  };
};
