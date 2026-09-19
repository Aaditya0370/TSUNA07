import React, { useState, useEffect } from 'react';
import {
  User,
  Post,
  Flow,
  Community,
} from '../types';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Share2,
  MessageSquare,
  UserPlus,
  UserCheck,
  ExternalLink,
  Code2,
  Clock,
  Sparkles,
  Heart,
  Bookmark,
  Layers,
  Send,
  Eye,
  Check,
  Copy,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { api } from '../services/api';
import { signInWithGoogle } from '../services/firebase';

interface CreatorLandingViewProps {
  handle: string;
  currentUser: User | null;
  onCurrentUserUpdated: (user: User) => void;
  onNavigate: (tab: string, param?: string) => void;
  onOpenShareModal: (item: any) => void;
}

export const CreatorLandingView: React.FC<CreatorLandingViewProps> = ({
  handle,
  currentUser,
  onCurrentUserUpdated,
  onNavigate,
  onOpenShareModal,
}) => {
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [handleExists, setHandleExists] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState<string | undefined>(undefined);
  const [isDeviceOwner, setIsDeviceOwner] = useState(false);

  // Active showcase tab
  const [activeTab, setActiveTab] = useState<'works' | 'flows' | 'communities' | 'about'>('works');

  // Device verification modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'otp'>('google');
  const [otpEmailInput, setOtpEmailInput] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Share link feedback
  const [copiedLandingLink, setCopiedLandingLink] = useState(false);

  useEffect(() => {
    loadLandingData();
  }, [handle, currentUser?.id]);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const loadLandingData = async () => {
    setLoading(true);
    try {
      const data = await api.getUserByHandle(handle);
      if (data.exists && data.user) {
        setHandleExists(true);
        setProfileUser(data.user);
        setMaskedEmail(data.maskedEmail);
        setPosts(data.posts || []);
        setFlows(data.flows || []);
        setCommunities(data.communities || []);

        const isOwner = Boolean(
          currentUser &&
            (currentUser.id === data.user.id ||
              currentUser.username.toLowerCase() === handle.toLowerCase())
        );
        setIsDeviceOwner(isOwner);
      } else {
        setHandleExists(false);
        setProfileUser(null);
        setIsDeviceOwner(false);
      }
    } catch (err) {
      console.error('Failed to load creator landing page:', err);
      setHandleExists(false);
    } finally {
      setLoading(false);
    }
  };

  // Follow / Unfollow creator
  const handleToggleFollow = async () => {
    if (!profileUser) return;
    try {
      const res = await api.toggleFollowUser(profileUser.id);
      setProfileUser({
        ...profileUser,
        isFollowing: res.isFollowing,
        followersCount: res.followersCount,
      });
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  // Copy creator profile URL
  const handleCopyLandingLink = () => {
    const url = `${window.location.origin}/@${profileUser?.username || handle}`;
    navigator.clipboard.writeText(url);
    setCopiedLandingLink(true);
    setTimeout(() => setCopiedLandingLink(false), 2500);
  };

  // 1. Google Authentication for Device Verification
  const handleGoogleVerify = async () => {
    setIsGoogleSigningIn(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const { user: fbUserProfile, firebaseUser } = await signInWithGoogle();
      const res = await api.verifyDeviceGoogle(handle, {
        uid: firebaseUser.uid,
        email: firebaseUser.email || fbUserProfile.email || '',
        name: firebaseUser.displayName || fbUserProfile.name || handle,
        photoURL: firebaseUser.photoURL || fbUserProfile.avatar,
      });

      onCurrentUserUpdated(res.user);
      setIsDeviceOwner(true);
      setProfileUser(res.user);
      setAuthSuccess(`Device verified! Logged in as @${res.user.username}`);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setAuthSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Google verification error:', err);
      setAuthError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  // 2. Email OTP for Device Verification
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSendingOtp(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await api.sendDeviceOtp(handle, otpEmailInput.trim() || undefined);
      setOtpSent(true);
      setOtpCountdown(60);
      setAuthSuccess(res.message);
    } catch (err: any) {
      console.error('Failed to send device OTP:', err);
      setAuthError(err.message || 'Failed to dispatch verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput.trim()) return;

    setIsVerifyingOtp(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const res = await api.verifyDeviceOtp(
        handle,
        otpCodeInput.trim(),
        otpEmailInput.trim() || undefined
      );

      onCurrentUserUpdated(res.user);
      setIsDeviceOwner(true);
      setProfileUser(res.user);
      setAuthSuccess(res.message);
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setAuthSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to verify device OTP:', err);
      setAuthError(err.message || 'Invalid verification code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center space-y-3 text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          <span className="text-xs font-mono tracking-wider">RESOLVING CREATOR LANDING FOR @{handle.toUpperCase()}...</span>
        </div>
      </div>
    );
  }

  // Case: Handle is unclaimed
  if (!handleExists) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900 text-emerald-400 shadow-xl">
          <Sparkles className="h-8 w-8" />
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-400">
            Available Handle
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            @{handle} is ready to be claimed
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-2 leading-relaxed">
            No creator has established this landing page yet. Claim it now on this device to publish code, host technical flows, and lead collectives.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => {
              setIsAuthModalOpen(true);
              setAuthMethod('google');
            }}
            className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-neutral-200 transition shadow-lg active:scale-95"
          >
            <span>Claim with Google Auth</span>
          </button>
          <button
            onClick={() => {
              setIsAuthModalOpen(true);
              setAuthMethod('otp');
            }}
            className="flex w-full sm:w-auto items-center justify-center space-x-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-bold text-neutral-200 hover:text-white hover:border-neutral-700 transition active:scale-95"
          >
            <Mail className="h-4 w-4 text-emerald-400" />
            <span>Claim via Email OTP</span>
          </button>
        </div>

        {/* Auth modal when claiming */}
        {renderAuthModal()}
      </div>
    );
  }

  function renderAuthModal() {
    if (!isAuthModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
        <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Verify Device for @{handle}
              </h3>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            You are connecting to @{handle} from this device. Please authenticate with Google or your one-time verification code (OTP).
          </p>

          {/* Tab selector */}
          <div className="flex rounded-xl border border-neutral-900 bg-neutral-900/60 p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('google');
                setAuthError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                authMethod === 'google'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Google Auth
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('otp');
                setAuthError(null);
              }}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                authMethod === 'otp'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Email OTP
            </button>
          </div>

          {authError && (
            <div className="flex items-center space-x-2 rounded-xl border border-rose-900/60 bg-rose-950/40 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="flex items-center space-x-2 rounded-xl border border-emerald-800/80 bg-emerald-950/40 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authMethod === 'google' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 text-xs text-neutral-400 text-center">
                Sign in with your Google Account to automatically verify this device and claim ownership of this landing page.
              </div>

              <button
                type="button"
                onClick={handleGoogleVerify}
                disabled={isGoogleSigningIn}
                className="flex w-full items-center justify-center space-x-3 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-50 py-3 text-xs font-bold text-black transition shadow-lg active:scale-95"
              >
                {isGoogleSigningIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Verifying with Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Authenticate via Google</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      placeholder={maskedEmail || 'your-email@domain.com'}
                      value={otpEmailInput}
                      onChange={(e) => setOtpEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
                    />
                    {maskedEmail && (
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Registered email on file: <span className="font-mono text-neutral-300">{maskedEmail}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={isSendingOtp}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2.5 text-xs font-bold text-black transition shadow-lg"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Send 6-Digit Verification Code</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-neutral-300">
                        Enter 6-Digit Code
                      </label>
                      {otpCountdown > 0 ? (
                        <span className="text-[11px] text-neutral-500 font-mono">
                          Resend in {otpCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          className="text-[11px] text-emerald-400 hover:underline"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCodeInput}
                      onChange={(e) => setOtpCodeInput(e.target.value)}
                      className="w-full text-center tracking-[8px] font-mono text-xl rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-emerald-400 placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCodeInput.trim().length !== 6}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2.5 text-xs font-bold text-black transition shadow-lg"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-black" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Verify &amp; Establish Session</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Toast Notification */}
      {copiedLandingLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-neutral-900/95 px-4 py-2.5 text-xs font-medium text-emerald-300 shadow-2xl backdrop-blur">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Landing URL copied! (https://tsuna.dev/@{profileUser?.username})</span>
        </div>
      )}

      {/* Different Device Banner / Verification Callout */}
      {!isDeviceOwner ? (
        <div className="rounded-2xl border border-amber-900/50 bg-gradient-to-r from-amber-950/30 via-neutral-950 to-neutral-950 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-800/80 bg-amber-900/40 text-amber-300">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white">
                  Viewing @{profileUser?.username}&apos;s Landing Page on this Device
                </span>
                <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800/60">
                  Visitor Mode
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Is this your account? Sign in on this device using Google Authentication or your registered Email OTP to manage your portfolio, publish technical flows, and view private messages.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setAuthMethod('google');
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-white hover:bg-neutral-200 px-3.5 py-2 text-xs font-bold text-black transition active:scale-95 shadow-md"
            >
              <span>Google Sign-In</span>
            </button>
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setAuthMethod('otp');
              }}
              className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:border-neutral-700 px-3.5 py-2 text-xs font-medium text-neutral-200 transition active:scale-95"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-400" />
              <span>Email OTP</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-emerald-950/20 via-neutral-950 to-neutral-950 p-3.5 px-4 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4" />
            <span>Owner Mode Verified: You are authenticated as @{profileUser?.username} on this device.</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('create-post')}
              className="text-neutral-300 hover:text-white flex items-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Publish Work</span>
            </button>
            <button
              onClick={() => onNavigate('flows')}
              className="text-neutral-300 hover:text-white flex items-center space-x-1"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Record Flow</span>
            </button>
          </div>
        </div>
      )}

      {/* Creator Hero Header Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
        {/* Banner */}
        <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 overflow-hidden">
          <img
            src={profileUser?.banner || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1400&auto=format&fit=crop&q=80'}
            alt="Creator Banner"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
        </div>

        {/* Profile Info Row */}
        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-6">
            {/* Avatar & Badges */}
            <div className="flex items-end space-x-4">
              <div className="relative">
                <img
                  src={profileUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                  alt={profileUser?.name}
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-4 border-neutral-950 shadow-2xl bg-neutral-900"
                />
                <span
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-neutral-950 ${
                    profileUser?.isOnline ? 'bg-emerald-400' : 'bg-neutral-600'
                  }`}
                  title={profileUser?.isOnline ? 'Active Now' : 'Offline'}
                />
              </div>

              <div className="mb-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                    {profileUser?.name}
                  </h1>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-neutral-400 font-mono mt-0.5">
                  <span className="text-emerald-400 font-semibold">@{profileUser?.username}</span>
                  <span>•</span>
                  <span>{profileUser?.roleTitle || 'Independent Creator'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Follow, Message, Share */}
            <div className="flex items-center space-x-2.5">
              {!isDeviceOwner && (
                <>
                  <button
                    onClick={handleToggleFollow}
                    className={`flex items-center space-x-1.5 rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 shadow-md ${
                      profileUser?.isFollowing
                        ? 'border border-emerald-700/80 bg-emerald-950/40 text-emerald-300'
                        : 'bg-white text-black hover:bg-neutral-200'
                    }`}
                  >
                    {profileUser?.isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onNavigate('chat')}
                    className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition active:scale-95"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <span>Message</span>
                  </button>
                </>
              )}

              <button
                onClick={handleCopyLandingLink}
                className="flex items-center space-x-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 px-3.5 py-2 text-xs font-semibold text-neutral-200 transition active:scale-95"
                title="Copy Creator Landing Link"
              >
                <Share2 className="h-4 w-4 text-neutral-400" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Bio & Skills */}
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-neutral-300 max-w-3xl leading-relaxed">
              {profileUser?.bio || 'Collaborative creator and creative technologist on Tsuna.'}
            </p>

            {profileUser?.skills && profileUser.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profileUser.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] font-mono text-neutral-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stat counters strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-900">
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 text-center">
              <span className="block text-lg font-bold text-white font-mono">
                {profileUser?.followersCount || 100}
              </span>
              <span className="text-[11px] text-neutral-400">Followers</span>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 text-center">
              <span className="block text-lg font-bold text-white font-mono">
                {posts.length}
              </span>
              <span className="text-[11px] text-neutral-400">Works &amp; Builds</span>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 text-center">
              <span className="block text-lg font-bold text-emerald-400 font-mono">
                {flows.length}
              </span>
              <span className="text-[11px] text-neutral-400">Technical Flows</span>
            </div>
            <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-3 text-center">
              <span className="block text-lg font-bold text-white font-mono">
                {communities.length}
              </span>
              <span className="text-[11px] text-neutral-400">Collectives</span>
            </div>
          </div>
        </div>
      </div>

      {/* Showcase Content Tabs */}
      <div className="space-y-4">
        <div className="flex border-b border-neutral-900 space-x-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('works')}
            className={`pb-3 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'works'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Creations &amp; Code ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('flows')}
            className={`pb-3 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'flows'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="h-4 w-4 text-emerald-400" />
            <span>Technical Flows ({flows.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('communities')}
            className={`pb-3 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'communities'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Collectives ({communities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 transition border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'about'
                ? 'border-emerald-400 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>About &amp; Tech Stack</span>
          </button>
        </div>

        {/* Tab 1: Works & Code */}
        {activeTab === 'works' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-12 text-center text-neutral-400">
                <Code2 className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-sm font-medium text-white">No creations published yet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Works and code snippets authored by @{profileUser?.username} will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-neutral-800/80 bg-neutral-950 p-5 space-y-3.5 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span className="text-emerald-400 uppercase tracking-wider">{post.communityName || post.tags?.[0] || 'Build'}</span>
                      <span>{post.createdAt}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>

                    {post.codeSnippet && (
                      <div className="rounded-xl border border-neutral-900 bg-black p-3 font-mono text-xs text-emerald-300 overflow-x-auto max-h-36">
                        <code>{post.codeSnippet.code.slice(0, 180)}...</code>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs text-neutral-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Heart className="h-3.5 w-3.5 text-rose-500" />
                          <span>{post.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>{post.commentsCount}</span>
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          onOpenShareModal({
                            type: 'post',
                            title: post.title,
                            description: post.content,
                            id: post.id,
                          })
                        }
                        className="hover:text-white"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Technical Flows */}
        {activeTab === 'flows' && (
          <div className="space-y-4">
            {flows.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-12 text-center text-neutral-400">
                <Clock className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-sm font-medium text-white">No technical flows published yet</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Bite-sized micro-walkthroughs (&lt; 4 mins) created by @{profileUser?.username} will show here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    onClick={() => onNavigate('flows')}
                    className="cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-3 hover:border-emerald-500/60 transition group"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{flow.duration}</span>
                      </span>
                      <span className="text-neutral-500 uppercase">{flow.type.replace('_', ' ')}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                      {flow.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {flow.content || flow.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs text-neutral-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Heart className={`h-3.5 w-3.5 ${flow.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{flow.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Bookmark className={`h-3.5 w-3.5 ${flow.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                          <span>{flow.savesCount || 0}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span>{flow.views}</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-emerald-400 font-medium group-hover:underline">
                        View Walkthrough &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Collectives / Communities */}
        {activeTab === 'communities' && (
          <div className="space-y-4">
            {communities.length === 0 ? (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-12 text-center text-neutral-400">
                <Layers className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                <p className="text-sm font-medium text-white">No communities joined yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {communities.map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() => onNavigate('community-detail', comm.id)}
                    className="cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-950 p-5 space-y-3 hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={comm.avatar}
                        alt={comm.name}
                        className="h-10 w-10 rounded-xl object-cover border border-neutral-800"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white">{comm.name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {comm.membersCount} members • {comm.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {comm.tagline || comm.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: About & Tech Stack */}
        {activeTab === 'about' && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Technical Overview</h3>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                {profileUser?.bio || 'Independent builder and creative technologist on Tsuna.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Core Stack &amp; Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {(profileUser?.skills || ['TypeScript', 'WebGPU', 'Creative Tech']).map((s) => (
                  <span
                    key={s}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-mono text-emerald-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-900 pt-4">
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Device Authentication Status
              </h4>
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/40 p-4 text-xs space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-neutral-300">Device State:</span>
                  <span className={isDeviceOwner ? 'text-emerald-400' : 'text-amber-400'}>
                    {isDeviceOwner ? 'Authorized Owner Device' : 'Visitor Device (Read-Only)'}
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px]">
                  Tsuna protects creator profiles with Google Firebase Auth and Brevo Transactional Email OTP across different devices.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth verification modal */}
      {renderAuthModal()}
    </div>
  );
};
