import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { FormInput } from '../components/FormInput';
import { ShoppingBasket } from 'lucide-react';

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

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Invalid email address')
    .refine((email) => {
      // Check against fake email patterns
      return !fakeEmailPatterns.some(pattern => pattern.test(email));
    }, {
      message: 'Please use a valid email address (test/fake emails are not allowed)'
    })
    .refine((email) => {
      // Ensure email has proper format with domain
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center mb-8">
          <ShoppingBasket className="h-12 w-12 text-green-600 mb-2" />
          <h2 className="text-3xl font-bold text-gray-900">Join Grocery Share</h2>
          <p className="text-gray-600 mt-2">Create your account to start sharing</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
            placeholder="••••••••"
          />

          <div className="flex items-start">
            <input
              type="checkbox"
              {...register('acceptedTerms')}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
            />
            <label className="ml-2 block text-sm text-gray-700">
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
            <p className="text-sm text-red-600 mt-1">{errors.acceptedTerms.message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
