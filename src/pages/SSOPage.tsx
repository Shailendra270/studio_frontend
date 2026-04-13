import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AuthLayout from '../components/auth/AuthLayout';
import AuthFormContainer from '../components/auth/AuthFormContainer';
import SSOForm from '../components/auth/forms/SSOForm';
import { ssoLogin } from '../api/auth';

const SSOPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Set page title for SEO
    document.title = 'SSO Login - Studio AI';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'SSO login to Studio.ai using SSO providers.');
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("userId")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSSOLogin = async (provider: string) => {
    setIsLoading(true);
    try {
      const res = await ssoLogin(provider);
      if (res.status) {
        toast.success(res.message);
        localStorage.setItem("userId", res.userId);
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'SSO login failed');
      }
    } catch (err) {
      console.error('SSO login error:', err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (values: { email: string }, { setSubmitting }: any) => {
    setIsLoading(true);
    try {
      const res = await ssoLogin('Email', values.email);
      if (res.status) {
        toast.success(res.message);
        localStorage.setItem("userId", res.userId);
        navigate('/dashboard');
      } else {
        toast.error(res.message || 'SSO login failed');
      }
    } catch (err) {
      console.error('SSO email login error:', err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthFormContainer subtitle="Welcome to Studio AI Creative platform">
        {/* SSO Form */}
        <SSOForm 
          onSubmit={handleEmailSubmit} 
          onSSOLogin={handleSSOLogin}
          isLoading={isLoading} 
        />
      </AuthFormContainer>
    </AuthLayout>
  );
};

export default SSOPage;