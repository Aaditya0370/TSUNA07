import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  Flame,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';
import { signInWithGoogle, saveUserToFirestore } from '../services/firebase';

interface AuthViewProps {
  currentUser: User | null;
  onAuthSuccess: (user: User) => void;
  onNavigate: (tab: string) => void;
}

type AuthTab = 'register' | 'email-otp' | 'google';

export const AuthView: React.FC<AuthViewProps> = ({
  currentUser,
  onAuthSuccess,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('register');

  // Form states for Registration
  const [regName, setRegName] = useState(currentUser?.name || '');
  const [regUsername, setRegUsername] = useState(currentUser?.username || '');
  const [regRole, setRegRole] = useState(currentUser?.roleTitle || '');
  const [regBio, setRegBio] = useState(currentUser?.bio || '');
  const [regEmail, setRegEmail] = useState(currentUser?.email || '');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Form states for Brevo Email OTP
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Google sign in loading
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name);
      setRegUsername(currentUser.username);
      setRegRole(currentUser.roleTitle || '');
      setRegBio(currentUser.bio || '');
      setRegEmail(currentUser.email || '');
    }
  }, [currentUser]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('Please choose a username / handle');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const payload = {
        name: regName.trim(),
        username: regUsername.trim().toLowerCase().replace(/[@\s]+/g, '_'),
        roleTitle: regRole.trim() || 'Independent Creator',
        bio: regBio.trim() || 'Creator on Tsuna',
        email: regEmail.trim() || undefined,
        avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(regUsername.trim())}`,
      };

      const res = await api.register(payload);
      if (res && res.user) {
        localStorage.setItem('tsuna_user_profile', JSON.stringify(res.user));
        await saveUserToFirestore(res.user);

        setSuccessMsg('Registration complete! Your profile is saved and retained forever.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onNavigate('profile');
        }, 700);
      } else {
        throw new Error('Registration did not return a user profile');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register account. Please try again.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendEmailOtp(otpEmail.trim());
      setOtpSent(true);
      setCountdown(60);
      setSuccessMsg(res.message || 'Passcode dispatched via Brevo transactional mailer!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send passcode. Ensure Brevo API key is active.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit verification code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyEmailOtp(otpEmail.trim(), otpCode.trim(), regName.trim() || undefined);
      if (res.success && res.user) {
        localStorage.setItem('tsuna_user_profile', JSON.stringify(res.user));
        await saveUserToFirestore(res.user);

        setSuccessMsg('Verification successful! Welcome to Tsuna.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onNavigate('home');
        }, 700);
      } else {
        throw new Error(res.message || 'Invalid verification passcode');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Check the code or request a new one.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (!result || !result.user) throw new Error('Google sign-in was cancelled');

      const userPayload = result.user;

      localStorage.setItem('tsuna_user_profile', JSON.stringify(userPayload));
      await saveUserToFirestore(userPayload);

      setSuccessMsg(`Welcome, ${userPayload.name}! Connected with Google.`);
      setTimeout(() => {
        onAuthSuccess(userPayload);
        onNavigate('home');
      }, 700);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMsg(err.message || 'Google authentication failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Workspace</span>
          </button>

          <span className="text-xs font-mono text-neutral-500">
            TSUNA // AUTH_GATEWAY
          </span>
        </div>

        {/* Page Container */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="border-b border-neutral-900 pb-6 text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Creator Identity & Access
                </h1>
                <p className="text-xs text-neutral-400">
                  Configure your profile once. Stored durably in Firestore.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 grid grid-cols-3 gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-1">
            <button
              type="button"
              onClick={() => handleTabChange('register')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg py-2 text-xs font-medium transition ${
                activeTab === 'register'
                  ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Profile Setup</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('email-otp')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg py-2 text-xs font-medium transition ${
                activeTab === 'email-otp'
                  ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Passcode</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('google')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg py-2 text-xs font-medium transition ${
                activeTab === 'google'
                  ? 'bg-neutral-800 text-white shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>Google Account</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mt-5 flex items-start space-x-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-5 flex items-start space-x-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: ONE-TIME REGISTRATION */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="mt-6 space-y-4 text-left">
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
                  <ShieldCheck className="h-4 w-4" />
                  <span>One-Time Permanent Registration</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Enter your info once. Your handle and profile are synchronized to Firestore and retained indefinitely.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Username / Handle *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-500">@</span>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="satoshin"
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-7 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Role / Craft Title
                  </label>
                  <input
                    type="text"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    placeholder="e.g. Creative Developer / 3D Artist"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                  Bio / Creative Focus
                </label>
                <textarea
                  rows={3}
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="What are you building or exploring on Tsuna?"
                  className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReg || !regName.trim() || !regUsername.trim()}
                className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmittingReg ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Profile to Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Registration & Enter Workspace</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: BREVO EMAIL OTP */}
          {activeTab === 'email-otp' && (
            <div className="mt-6 text-left space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
                      <Mail className="h-4 w-4" />
                      <span>Passwordless Email Verification</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Receive a secure 6-digit one-time passcode delivered via Brevo transactional mailer.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="creator@domain.com"
                      className="w-full rounded-xl border border-neutral-800 bg-black px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingOtp || !otpEmail.trim()}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending Passcode via Brevo...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Send 6-Digit Passcode</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
                    <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
                      <Lock className="h-4 w-4" />
                      <span>Enter Passcode for {otpEmail}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Check your inbox or spam folder for your 6-digit verification code.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5">
                      6-Digit Passcode
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-center tracking-[0.5em] font-mono text-lg rounded-xl border border-neutral-800 bg-black py-2.5 text-white placeholder-neutral-700 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-black hover:bg-emerald-400 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying Passcode...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Confirm & Sign In</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs text-neutral-500">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="hover:text-neutral-300 transition underline"
                    >
                      Use different email
                    </button>
                    {countdown > 0 ? (
                      <span>Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-emerald-400 hover:text-emerald-300 transition underline"
                      >
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: GOOGLE AUTH */}
          {activeTab === 'google' && (
            <div className="mt-6 text-left space-y-4">
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
                  <Flame className="h-4 w-4" />
                  <span>Google Account Integration</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Authenticate instantly with your Google account. Connects directly to Firebase Auth and saves your profile to Firestore.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center space-x-3 rounded-xl border border-neutral-700 bg-neutral-900 py-3.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer shadow-sm"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
