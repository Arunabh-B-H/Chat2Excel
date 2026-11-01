import React, { useState, useEffect } from 'react';
import API from '../services/api';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email: email.trim() });
      setSuccessMsg(res.data.message);
      setOtp(''); // Strict: empty input requiring user to check their email
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'No account found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword
      });
      alert(res.data.message || 'Password reset successfully! You can now log in.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
        >
          ×
        </button>

        <h3 className="text-xl font-bold text-slate-800 mb-1">
          {step === 1 ? 'Password Recovery' : 'Enter 6-Digit Code'}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {step === 1
            ? 'Enter your registered email address to receive a recovery code.'
            : `Enter the code sent to ${email} and your new password.`}
        </p>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Verifying Account...' : 'Send Recovery Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Recovery Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 text-sm text-center tracking-widest font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Wrong email? Click here to change
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
