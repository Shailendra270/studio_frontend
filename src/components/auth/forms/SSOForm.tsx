import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

interface SSOFormProps {
  onSubmit: (values: { email: string }, actions: any) => void;
  onSSOLogin: (provider: string) => void;
  isLoading?: boolean;
}

const SSOForm: React.FC<SSOFormProps> = ({ onSubmit, onSSOLogin, isLoading = false }) => {
  const navigate = useNavigate();
  
  const ssoProviders = [
    { name: 'Google', icon: '🔍' },
    { name: 'Microsoft', icon: '🔷' },
    { name: 'GitHub', icon: '🐙' },
    { name: 'LinkedIn', icon: '💼' }
  ];

  return (
    <div>
      {/* SSO Options */}
      {/* <div className="space-y-4 mb-6 sm:mb-8">
        {ssoProviders.map((provider) => (
          <button
            key={provider.name}
            type="button"
            onClick={() => onSSOLogin(provider.name)}
            disabled={isLoading}
            className="w-full h-11 sm:h-12 bg-[#1B1B1B] border-2 border-[#373737] rounded-2xl text-white font-semibold text-base hover:border-[#00BBFF] hover:bg-[#00BBFF]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <span className="text-xl">{provider.icon}</span>
            Continue with {provider.name}
          </button>
        ))}
      </div> */}

      {/* Email form for SSO */}
      <Formik
        initialValues={{
          email: ''
        }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <Form className="mb-6 sm:mb-8">
            <div className="relative mb-5 sm:mb-6">
              <Field
                type="email"
                name="email"
                placeholder="Email"
                className={`w-full h-11 sm:h-12 px-4 rounded-2xl border-2 ${
                  errors.email && touched.email ? 'border-red-500' : 'border-[#373737]'
                } bg-[#1B1B1B] text-white placeholder-[#707070] font-medium text-base lg:text-lg focus:outline-none focus:border-[#00BBFF] transition-colors`}
              />
              <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-11 sm:h-12 bg-zentag-gradient rounded-2xl text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting || isLoading ? 'Signing in...' : 'SSO Login'}
            </button>
          </Form>
        )}
      </Formik>

        {/* Or divider */}
      <div className="text-center mb-5 sm:mb-6">
        <span className="text-white text-base font-medium">or</span>
      </div>

      {/* Alternative options */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="text-center mb-6 sm:mb-8 cursor-pointer">
            <a
              // href="#"
              className="text-white text-base font-medium underline hover:text-[#00BBFF] transition-colors"
              onClick={() => navigate('/login')}
            >
              Back to login options
            </a>
          </div>
      </div>
    </div>
  );
};

export default SSOForm;