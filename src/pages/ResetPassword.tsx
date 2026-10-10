import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '../api/auth';
import { 
  HeartPulse, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'expired' | 'missing' | 'idle'>('idle');
  const [associatedEmail, setAssociatedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const rawToken = searchParams.get('token');
    if (!rawToken) {
      setTokenStatus('missing');
      return;
    }

    setToken(rawToken);
    verifyToken(rawToken);
  }, [searchParams]);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      setVerifying(true);
      setError('');
      const res = await authService.verifyResetToken(tokenToVerify);
      if (res.valid) {
        setTokenStatus('valid');
        if (res.email) setAssociatedEmail(res.email);
      } else {
        if (res.error && res.error.toLowerCase().includes('expired')) {
          setTokenStatus('expired');
        } else {
          setTokenStatus('invalid');
        }
        setError(res.error || 'Invalid or expired password reset token.');
      }
    } catch (err: any) {
      setTokenStatus('invalid');
      setError(err.message || 'Invalid or expired password reset token.');
    } finally {
      setVerifying(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanToken = token.trim();
    if (!cleanToken) {
      setError('A valid reset token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    try {
      setLoading(true);
      await authService.resetPasswordWithToken(cleanToken, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#00A884] flex items-center justify-center shadow-lg shadow-teal-500/20">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#071B49]">
          Set New Account Password
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Choose a secure, resilient password for your MediTrack personal health record.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#DCE5EC] sm:rounded-2xl sm:px-10">
          
          {/* Verification Loading State */}
          {verifying && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#00A884] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#071B49]">Verifying cryptographic token...</p>
              <p className="text-xs text-[#64748B]">Ensuring token authenticity and unexpired status.</p>
            </div>
          )}

          {/* Missing Token State */}
          {!verifying && tokenStatus === 'missing' && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#071B49]">Reset Token Missing</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  No recovery token was detected in your URL. Please use the link sent to your email or request a new one.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/forgot-password"
                  className="w-full py-2.5 px-4 bg-[#00A884] hover:bg-[#009272] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Request Password Reset Link
                </Link>
                <Link
                  to="/login"
                  className="w-full py-2 px-4 text-xs font-semibold text-[#64748B] hover:text-[#071B49] transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Invalid or Expired Token State */}
          {!verifying && (tokenStatus === 'invalid' || tokenStatus === 'expired') && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-[#EF476F] flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#071B49]">
                  {tokenStatus === 'expired' ? 'Reset Link Expired' : 'Invalid Reset Token'}
                </h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  {tokenStatus === 'expired' 
                    ? 'This password reset link has exceeded its validity period (30 minutes). For security, tokens are single-use and time-bounded.'
                    : 'The reset token is invalid, corrupted, or has already been consumed. Please request a new link.'}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/forgot-password"
                  className="w-full py-2.5 px-4 bg-[#00A884] hover:bg-[#009272] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Request New Reset Link
                </Link>
                <Link
                  to="/login"
                  className="w-full py-2 px-4 text-xs font-semibold text-[#64748B] hover:text-[#071B49] transition-colors"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Success State */}
          {!verifying && success && (
            <div className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 text-[#00A884] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#071B49]">Password Successfully Updated</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  Your credentials have been securely updated. All existing sessions across any other devices have been revoked.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-2.5 px-4 bg-[#00A884] hover:bg-[#009272] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Sign In with New Password
                </button>
              </div>
            </div>
          )}

          {/* Valid Token Reset Form */}
          {!verifying && tokenStatus === 'valid' && !success && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {associatedEmail && (
                <div className="p-3 bg-slate-50 border border-[#DCE5EC] rounded-xl text-xs text-[#071B49]">
                  <span className="text-[#64748B]">Resetting password for: </span>
                  <span className="font-bold text-[#071B49]">{associatedEmail}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-[#071B49]">
                  New Password
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-[#DCE5EC] px-3.5 py-2.5 pr-10 placeholder-slate-400 text-sm text-[#071B49] shadow-xs focus:border-[#00A884] focus:outline-none focus:ring-2 focus:ring-[#00A884]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#071B49]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`flex-1 rounded-full transition-all ${
                            strength >= lvl
                              ? strength <= 2
                                ? 'bg-red-500'
                                : strength <= 3
                                ? 'bg-amber-500'
                                : 'bg-[#00A884]'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#64748B]">
                      {strength <= 2 && 'Weak password'}
                      {strength === 3 && 'Moderate password'}
                      {strength >= 4 && 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-[#071B49]">
                  Confirm New Password
                </label>
                <div className="mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-[#DCE5EC] px-3.5 py-2.5 placeholder-slate-400 text-sm text-[#071B49] shadow-xs focus:border-[#00A884] focus:outline-none focus:ring-2 focus:ring-[#00A884]/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-[#00A884] py-2.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-[#009272] focus:outline-none focus:ring-2 focus:ring-[#00A884] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Updating password...' : 'Update Password & Revoke Sessions'}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
