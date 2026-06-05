import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Za-z]/, 'Must contain a letter').regex(/[0-9]/, 'Must contain a number'),
});

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setError('');
    try {
      await authApi.register(data);
      setEmail(data.email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed.');
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card success-card">
          <div className="success-icon">📧</div>
          <h2>Check Your Email!</h2>
          <p>We sent a 6-digit OTP to <strong>{email}</strong>.</p>
          <p>Enter it to verify your account and get started.</p>
          <button className="btn-primary btn-full" onClick={() => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}>
            Enter OTP →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account 🚀</h1>
        <p className="auth-subtitle">Discover government schemes in minutes — free forever</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" {...register('name')} placeholder="Ravi Kumar" />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" {...register('email')} placeholder="you@example.com" />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" {...register('password')} placeholder="Min 8 chars, 1 letter + 1 number" />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <div className="divider">or</div>
        <button className="btn-google btn-full" onClick={() => authApi.googleLogin()}>
          Continue with Google
        </button>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
