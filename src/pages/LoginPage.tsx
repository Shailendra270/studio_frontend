import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import AuthFormContainer from '../components/auth/AuthFormContainer';
import LoginForm from '../components/auth/forms/LoginForm';
import { useAppDispatch, useAppSelector } from '../store';
import { loginUser, clearError, clearAllUserData } from '../store/slices/authSlice';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    // Set page title for SEO
    document.title = 'Login - Studio AI';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Sign in to Studio.ai to access your video editing projects and create amazing content.');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Show auth error only once: prefer message from redirect (sessionStorage), else Redux error
  useEffect(() => {
    const authError = sessionStorage.getItem('authError');
    if (authError) {
      sessionStorage.removeItem('authError');
      dispatch(clearError());
      setInlineError(authError);
      return;
    }
    if (error && !isLoading) {
      setInlineError(error);
      dispatch(clearError());
    }
  }, [error, isLoading, dispatch]);

  const handleSubmit = async (values: { email: string; password: string }, { setSubmitting }: any) => {
    setIsSubmitting(true);
    setInlineError(null);
    try {
      // Clear any existing user data and assets before logging in
      await dispatch(clearAllUserData()).unwrap();
      
      // Then login with the new credentials
      const result = await dispatch(loginUser(values)).unwrap();
      if (result.status) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      const raw = String(error?.message || 'Login failed');
      const lower = raw.toLowerCase();

      // Friendly mapping for common auth cases
      if (lower.includes('suspended')) {
        setInlineError('This organization has been suspended. Please reach out to your administrator.');
      } else if (lower.includes('deactivated') || lower.includes('access has been deactivated')) {
        setInlineError('Your account is inactive. Please reach out to your organization admin.');
      } else if (lower.includes('incorrect email or password')) {
        setInlineError('Incorrect email or password. Please try again.');
      } else if (lower.includes('cannot read properties') || lower.includes('undefined')) {
        // Hide internal error details behind a friendly message
        setInlineError('Something went wrong while signing you in. Please try again or contact your administrator.');
      } else {
        setInlineError(raw);
      }
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthFormContainer subtitle="Welcome to Studio AI Creative platform">
        {inlineError && (
          <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-200">
            {inlineError}
          </div>
        )}
        <LoginForm onSubmit={handleSubmit} isLoading={isLoading || isSubmitting} />
      </AuthFormContainer>
    </AuthLayout>
  );
};

export default LoginPage;
