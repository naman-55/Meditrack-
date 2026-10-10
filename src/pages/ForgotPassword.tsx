import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../api/auth';
import { HeartPulse, ArrowLeft, MailCheck, AlertCircle, KeyRound, ShieldAlert } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devResetInfo, setDevResetInfo] = useState<{ token: string; url: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevResetInfo(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await authService.forgotPassword(cleanEmail);
      setSuccessMsg(res.message || 'If an account exists for this email, password reset instructions have been sent.');
      if (res.devResetToken) {
        setDevResetInfo({ token: res.devResetToken, url: res.devResetUrl || `/reset-password?token=${res.devResetToken}` });
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process reset request at this time. Please try again.');
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
          Recover Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B]">
          Enter your registered email address and we'll send you secure password reset instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-[#DCE5EC] sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#071B49]">
                Email address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-[#DCE5EC] px-3.5 py-2.5 placeholder-slate-400 text-sm text-[#071B49] shadow-xs focus:border-[#00A884] focus:outline-none focus:ring-2 focus:ring-[#00A884]/20 transition-all"
                />
              </div>
            </div>

            {/* Development Mode Quick Reset Info */}
            {devResetInfo && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Development Preview Reset Token</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  In local development, email sending is intercepted. Your single-use reset token:
                </p>
                <div className="p-2 bg-white border border-amber-200 rounded-lg font-mono text-[11px] break-all select-all text-slate-800">
                  {devResetInfo.token}
                </div>
                <Link
                  to={devResetInfo.url}
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Open Reset Password Page</span>
                </Link>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2.5 text-sm text-teal-900 bg-teal-50 border border-teal-200 rounded-xl p-3.5">
                <MailCheck className="w-5 h-5 text-[#00A884] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

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
                {loading ? 'Sending instructions...' : 'Send reset instructions'}
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
        </div>
      </div>
    </div>
  );
}
