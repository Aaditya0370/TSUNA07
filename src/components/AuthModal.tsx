import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  KeyRound,
  RotateCcw,
  ArrowRight,
  LogOut,
  Edit3,
} from 'lucide-react';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  saveUserToFirestore,
} from '../services/firebase';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess: (user: User) => void;
  onSignOutSuccess: () => void;
  onNavigateToProfile?: () => void;
}

type AuthTab = 'register' | 'brevo_otp' | 'google';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOutSuccess,
  onNavigateToProfile,
}) => {
  // If user is already registered, default to showing their profile status. Otherwise 'register'
  const isRegistered = !!currentUser && !currentUser.isDemo;
  const [activeTab, setActiveTab] = useState<AuthTab>('register');

  // Registration fields
  const [regName, setRegName] = useState(currentUser?.name || '');
  const [regUsername, setRegUsername] = useState(currentUser?.username || '');
  const [regRole, setRegRole] = useState(currentUser?.roleTitle || '');
  const [regBio, setRegBio] = useState(currentUser?.bio || '');
  const [regEmail, setRegEmail] = useState(currentUser?.email || '');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Brevo Email OTP state
  const [otpStep, setOtpStep] = useState<'input_email' | 'verify_code'>('input_email');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpDisplayName, setOtpDisplayName] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Google sign in loading
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setRegName(currentUser.name);
      setRegUsername(currentUser.username);
      setRegRole(currentUser.roleTitle || '');
      setRegBio(currentUser.bio || '');
      setRegEmail(currentUser.email || '');
    }
  }, [currentUser]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  // Clear messages on tab switch
  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // 1. One-Time Registration Handler (Retained Forever)
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
        // Retain forever in localStorage
        localStorage.setItem('tsuna_user_profile', JSON.stringify(res.user));
        // Retain forever in Firestore
        await saveUserToFirestore(res.user);

        setSuccessMsg('Registration complete! Your profile is saved and retained forever.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 600);
      } else {
        throw new Error('Could not complete registration');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  // 2. Brevo Email OTP: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(otpEmail.trim())) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await api.sendEmailOtp(otpEmail.trim());
      setSuccessMsg(`Verification code sent to ${otpEmail.trim()}! Check your inbox.`);
      if (res.codePreview) setPreviewCode(res.codePreview);
      setOtpStep('verify_code');
      setCountdown(60);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code. Check your network or API status.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // 2. Brevo Email OTP: Verify Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit code sent to your email');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await api.verifyEmailOtp(otpEmail.trim(), otpCode.trim(), otpDisplayName.trim());
      if (res.user) {
        // Save in localStorage & Firestore
        localStorage.setItem('tsuna_user_profile', JSON.stringify(res.user));
        await saveUserToFirestore(res.user);

        setSuccessMsg('Email verified successfully! Profile connected.');
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // 3. Google Sign-In (Firebase)
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
      await api.syncFirebaseUser(userPayload);

      setSuccessMsg(`Welcome, ${userPayload.name}! Connected with Google.`);
      setTimeout(() => {
        onAuthSuccess(userPayload);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      localStorage.removeItem('tsuna_user_profile');
      await signOutUser();
      await api.logout();
      onSignOutSuccess();
      setSuccessMsg('Signed out successfully.');
      setTimeout(() => onClose(), 500);
    } catch (err: any) {
      setErrorMsg('Failed to sign out: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-emerald-400 mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold">
              Tsuna Identity & Persistence
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isRegistered ? 'Your Builder Profile' : 'Register Your Profile'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            {isRegistered
              ? 'Your profile is permanently stored. You can update your details anytime.'
              : 'Fill this up once for registration. Your posts, projects, and identity will retain forever.'}
          </p>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 flex items-start space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* If already registered: Show Profile Card */}
        {isRegistered && currentUser && activeTab === 'register' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    currentUser.avatar ||
                    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(currentUser.username)}`
                  }
                  alt={currentUser.name}
                  className="h-12 w-12 rounded-xl object-cover border border-neutral-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white truncate">{currentUser.name}</h3>
                    <span className="flex items-center space-x-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      <span>Retained</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 font-mono">@{currentUser.username}</p>
                  <p className="text-xs text-neutral-300 mt-0.5 truncate">{currentUser.roleTitle}</p>
                </div>
              </div>

              {currentUser.bio && (
                <p className="text-xs text-neutral-400 bg-black/40 p-2.5 rounded-lg border border-neutral-900">
                  {currentUser.bio}
                </p>
              )}

              {currentUser.email && (
                <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
                  <Mail className="h-3 w-3 text-neutral-400" />
                  <span>{currentUser.email}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {onNavigateToProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToProfile();
                  }}
                  className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-neutral-800 transition"
                >
                  <Edit3 className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Edit Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 hover:border-red-800/50 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs for registration / login options */}
            <div className="flex rounded-xl border border-neutral-800 bg-neutral-900/50 p-1 mb-5">
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeTab === 'register'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserIcon className="h-3 w-3" />
                <span>Profile Setup</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('brevo_otp')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeTab === 'brevo_otp'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Mail className="h-3 w-3" />
                <span>Email OTP</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('google')}
                className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium rounded-lg transition ${
                  activeTab === 'google'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                <span>Google</span>
              </button>
            </div>

            {/* TAB 1: One-time Profile Registration */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Aaditya"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Username / Handle <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-neutral-500 font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.replace(/[@\s]/g, ''))}
                      placeholder="adigamerz"
                      className="w-full rounded-xl border border-neutral-800 bg-black pl-7 pr-3 py-2 text-xs text-white font-mono placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Craft / Role Title
                  </label>
                  <input
                    type="text"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    placeholder="e.g., Software Engineer & Creative Technologist"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Bio / About You
                  </label>
                  <textarea
                    rows={2}
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    placeholder="Building collaborative software, WebGPU shaders, and creative tech..."
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    id="submit-registration-btn"
                    className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                  >
                    <span>{isSubmittingReg ? 'Saving Forever...' : 'Complete Registration & Enter'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center mt-2 font-mono">
                    Retained forever in Firestore & database. You can edit anytime.
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: Brevo Email OTP */}
            {activeTab === 'brevo_otp' && (
              <div className="space-y-4">
                {otpStep === 'input_email' ? (
                  <form onSubmit={handleSendOtp} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                      />
                      <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                        A 6-digit verification code will be sent via Brevo.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isSendingOtp ? 'Sending Code...' : 'Send Verification OTP'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-neutral-300">
                          6-Digit Code sent to {otpEmail}
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpStep('input_email')}
                          className="text-[11px] text-emerald-400 hover:underline"
                        >
                          Change email
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-center text-lg font-mono tracking-widest text-white placeholder-neutral-700 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={otpDisplayName}
                        onChange={(e) => setOtpDisplayName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full rounded-xl border border-neutral-800 bg-black px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                      />
                    </div>

                    {previewCode && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
                        <span className="font-mono font-semibold">Dev OTP Code: {previewCode}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || otpCode.length !== 6}
                        className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>{isVerifyingOtp ? 'Verifying...' : 'Verify & Log In'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={countdown > 0 || isSendingOtp}
                        className="flex items-center space-x-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-xs text-neutral-400 hover:text-white disabled:opacity-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>{countdown > 0 ? `${countdown}s` : 'Resend'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: Google Sign-in */}
            {activeTab === 'google' && (
              <div className="space-y-4 text-center py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Account Authentication</h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                    Sign in with Google via Firebase Auth popup. Your profile and posts will be linked forever.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full flex items-center justify-center space-x-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-black transition hover:bg-neutral-200 active:scale-95 disabled:opacity-50 shadow-sm"
                >
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
                  <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
