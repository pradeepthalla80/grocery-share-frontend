import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { ShoppingBasket, Check, X } from 'lucide-react';

// Block fake/test email patterns
const fakeEmailPatterns = [
  /^test@test\./i,
  /^test\d*@/i,
  /^fake@/i,
  /^dummy@/i,
  /^example@/i,
  /^noreply@/i,
  /^temp@/i,
  /@test\./i,
  /@example\./i,
  /@fake\./i
];

// Strong password validation for App Store requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character (!@#$%^&*)');

const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email address')
    .refine((email) => {
      return !fakeEmailPatterns.some(pattern => pattern.test(email));
    }, {
      message: 'Please use a valid email address (test/fake emails are not allowed)'
    })
    .refine((email) => {
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const domain = parts[1];
      return domain.includes('.') && domain.split('.').length >= 2;
    }, {
      message: 'Please use a valid email address with a proper domain'
    }),
  password: passwordSchema,
  confirmPassword: z.string(),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Use and Privacy Policy'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^a-zA-Z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  
  return {
    checks,
    strength: passed <= 2 ? 'weak' : passed === 3 ? 'medium' : passed === 4 ? 'good' : 'strong',
    score: passed
  };
};

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptedTerms: false
    }
  });

  const password = watch('password', '');
  const passwordStrength = checkPasswordStrength(password);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.register({
        name: data.name,
        email: data.email,
        password: data.password,
        acceptedTerms: data.acceptedTerms
      });
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <div className="flex flex-col items-center mb-6">
          <ShoppingBasket className="h-12 w-12 text-green-600 mb-2" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Join Grocery Share</h2>
          <p className="text-gray-600 mt-2 text-sm sm:text-base text-center">Create your account to start sharing</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="Full Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            placeholder="John Doe"
          />

          <FormInput
            label="Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
            placeholder="you@example.com"
            autoComplete="email"
          />

          <div>
            <FormInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getStrengthColor(passwordStrength.strength)}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600 capitalize min-w-[60px]">
                    {passwordStrength.strength}
                  </span>
                </div>
                
                {/* Password Requirements Checklist */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      {passwordStrength.checks.length ? (
                        <Check className="h-3 w-3 text-green-600 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={passwordStrength.checks.length ? 'text-green-700' : 'text-gray-600'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {passwordStrength.checks.uppercase ? (
                        <Check className="h-3 w-3 text-green-600 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={passwordStrength.checks.uppercase ? 'text-green-700' : 'text-gray-600'}>
                        One uppercase letter (A-Z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {passwordStrength.checks.lowercase ? (
                        <Check className="h-3 w-3 text-green-600 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={passwordStrength.checks.lowercase ? 'text-green-700' : 'text-gray-600'}>
                        One lowercase letter (a-z)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {passwordStrength.checks.number ? (
                        <Check className="h-3 w-3 text-green-600 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={passwordStrength.checks.number ? 'text-green-700' : 'text-gray-600'}>
                        One number (0-9)
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {passwordStrength.checks.special ? (
                        <Check className="h-3 w-3 text-green-600 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={passwordStrength.checks.special ? 'text-green-700' : 'text-gray-600'}>
                        One special character (!@#$%^&*)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <FormInput
            label="Confirm Password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('acceptedTerms')}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
            />
            <label className="ml-2 block text-xs sm:text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-green-600 hover:text-green-700 font-medium" target="_blank">
                Terms of Use
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-green-600 hover:text-green-700 font-medium" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptedTerms && (
            <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.acceptedTerms.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
            Sign in
          </Link>
        </p>

        {/* Security Notice for App Store Compliance */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            🔒 Your account is secured with industry-standard encryption. 
            Your password is never stored in plain text.
          </p>
        </div>
      </div>
    </div>
  );
};
