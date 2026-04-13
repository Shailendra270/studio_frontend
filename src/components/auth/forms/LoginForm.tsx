import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

interface LoginFormProps {
  onSubmit: (values: { email: string; password: string }, actions: any) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{
        email: '',
        password: ''
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form>
          {/* Email input */}
          <div className="relative mb-5 sm:mb-6">
            <Field
              type="email"
              name="email"
              placeholder="Email"
              className={`w-full h-11 sm:h-10 px-4 rounded-2xl border-2 ${errors.email && touched.email ? 'border-red-500' : 'border-[#373737]'
                } bg-[#1B1B1B] text-white placeholder-[#707070] font-medium text-base lg:text-lg focus:outline-none focus:border-[#00BBFF] transition-colors`}
            />
            <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Password input */}
          {/* <div className="relative mb-5 sm:mb-6">
            <Field
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className={`w-full h-11 sm:h-10 px-4 pr-12 rounded-2xl border-2 text-center ${
                errors.password && touched.password ? 'border-red-500' : 'border-[#373737]'
              } bg-[#1B1B1B] text-white placeholder-[#707070] font-medium text-base lg:text-lg focus:outline-none focus:border-[#00BBFF] transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707070] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
          </div> */}
          <div className="relative mb-5 sm:mb-6">
            <div className="relative">
              {/* Wrap Field and button in a relative div to control their collective height */}
              <Field
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className={`w-full h-11 sm:h-10 px-4 pr-12 rounded-2xl border-2 ${errors.password && touched.password ? 'border-red-500' : 'border-[#373737]'
                  } bg-[#1B1B1B] text-white placeholder-[#707070] font-medium text-base lg:text-lg focus:outline-none focus:border-[#00BBFF] transition-colors`}
              // The placeholder text should not be centered here for the eye icon to work well.
              // We'll adjust its centering separately if needed.
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#707070] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Forgot password */}
          <div className="text-center mb-6 sm:mb-8 cursor-pointer">
            <a
              // href="#"
              className="text-white text-base font-medium underline hover:text-[#00BBFF] transition-colors"
            >
              Forgot password
            </a>
          </div>

          {/* Login buttons */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-2 sm:mb-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 h-11 sm:h-10 bg-zentag-gradient rounded-xl text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting || isLoading ? 'Signing in...' : 'Login'}
            </button>
            {/* <button
              type="button"
              onClick={() => navigate('/login-sso')}
              className="flex-1 h-11 sm:h-10 bg-[#1B1B1B] border-2 border-[#00BBFF] rounded-xl text-white font-semibold text-base hover:bg-[#00BBFF]/10 transition-colors"
            >
              Sign in with SSO
            </button> */}
          </div>

          {/* Or divider */}
          <div className="text-center mb-5 sm:mb-2">
            <span className="text-white text-base font-medium">or</span>
          </div>

          {/* Sign up button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="w-56 sm:w-60 h-11 sm:h-10 bg-white rounded-xl text-black font-semibold text-base hover:bg-gray-100 transition-colors"
            >
              Sign up with email
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;