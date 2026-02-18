import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';

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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
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
  password: z.string().min(6, 'Password must be at least 6 characters'),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms of Use and Privacy Policy'
  })
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.register(data);
      login(response.token, response.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="BaskMate" className="h-16 md:h-20 w-auto mb-4 animate-scale-in" />
          <div className="w-12 h-0.5 bg-green-500 rounded-full mt-1 mb-3" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-700">Create Account</h2>
          <p className="text-gray-400 mt-0.5 text-xs md:text-sm">Join BaskMate to start sharing</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            />

            <FormInput
              label="Password"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="Min 6 characters"
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                {...register('acceptedTerms')}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-0.5"
              />
              <label className="ml-2.5 block text-xs text-gray-600">
                I agree to the{' '}
                <a href="/terms" className="text-green-600 hover:text-green-700 font-medium" target="_blank" rel="noopener noreferrer">
                  Terms of Use
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-green-600 hover:text-green-700 font-medium" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-xs text-red-600 mt-1">{errors.acceptedTerms.message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium active:scale-[0.98]"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
