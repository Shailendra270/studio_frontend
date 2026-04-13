import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('User email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .required('Password is required'),
  agreeToTerms: Yup.boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
});

interface SignupFormProps {
  onSubmit: (values: { name: string; email: string; password: string; agreeToTerms: boolean }, actions: any) => void;
  isLoading?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, isLoading = false }) => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <Formik
      initialValues={{
        name: '',
        email: '',
        password: '',
        agreeToTerms: false
      }}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form>
          {/* Full Name input */}
          <div className="relative mb-5 sm:mb-6">
            <Field
              type="text"
              name="name"
              placeholder="Full Name"
              className={`w-full h-11 sm:h-12 px-4 rounded-2xl border-2 ${
                errors.name && touched.name ? 'border-red-500' : 'border-[#373737]'
              } bg-[#1B1B1B] text-white placeholder-[#707070] font-medium text-base lg:text-lg focus:outline-none focus:border-[#00BBFF] transition-colors`}
            />
            <ErrorMessage name="name" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Email input */}
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

          {/* Password input */}
          <div className="relative mb-5 sm:mb-6">
            <div className="relative">
            <Field
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className={`w-full h-11 sm:h-10 px-4 pr-12 rounded-2xl border-2 ${
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
            </div>
            <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Terms and conditions */}
          <div className="mb-6 sm:mb-8">
            <label className="flex items-start gap-3 text-white text-sm cursor-pointer">
              <Field
                type="checkbox"
                name="agreeToTerms"
                className={`w-4 h-4 mt-0.5 rounded border-2 ${
                  errors.agreeToTerms && touched.agreeToTerms ? 'border-red-500' : 'border-[#373737]'
                } bg-[#1B1B1B] text-[#00BBFF] focus:ring-[#00BBFF] focus:ring-2`}
              />
              <span>
                By signup you agree to our{' '}
                <a className="text-[#00BBFF] underline hover:text-[#00BBFF]/80 transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="text-[#00BBFF] underline hover:text-[#00BBFF]/80 transition-colors">
                  Privacy Policy
                </a>
              </span>
            </label>
            <ErrorMessage name="agreeToTerms" component="div" className="text-red-500 text-sm mt-1" />
          </div>

          {/* Sign up button */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 h-11 sm:h-12 bg-zentag-gradient rounded-2xl text-white font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting || isLoading ? 'Creating account...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 h-11 sm:h-12 bg-[#1B1B1B] border-2 border-[#00BBFF] rounded-2xl text-white font-semibold text-base hover:bg-[#00BBFF]/10 transition-colors"
            >
              Login
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SignupForm;