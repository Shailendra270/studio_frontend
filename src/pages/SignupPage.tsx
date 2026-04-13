import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import AuthFormContainer from '../components/auth/AuthFormContainer';
import SignupForm from '../components/auth/forms/SignupForm';
import { useAppDispatch, useAppSelector } from '../store';
import { signupUser, clearError } from '../store/slices/authSlice';

const SignupPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    // Set page title for SEO
    document.title = 'SignUp - Studio AI';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Create your Studio.ai account and start editing videos like a professional. Join thousands of creators worldwide.');
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors on component mount
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, []);

  // Handle Redux errors by showing inline banner instead of toast
  useEffect(() => {
    if (error && !isLoading) {
      setInlineError(error);
      dispatch(clearError());
    }
  }, [error, isLoading, dispatch]);

  const handleSubmit = async (values: { 
    name: string; 
    email: string; 
    password: string; 
    agreeToTerms: boolean 
  }, { setSubmitting }: any) => {
    setIsSubmitting(true);
    setInlineError(null);
    try {
      const result = await dispatch(signupUser(values)).unwrap();
      if (result.status) {
        navigate('/login');
      }
    } catch (error: any) {
      const raw = String(error?.message || 'Signup failed');
      setInlineError(raw);
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <AuthFormContainer subtitle="Create your Studio AI account">
        {inlineError && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {inlineError}
          </div>
        )}
        <SignupForm onSubmit={handleSubmit} isLoading={isLoading || isSubmitting} />
      </AuthFormContainer>
    </AuthLayout>
  );
};

export default SignupPage;
