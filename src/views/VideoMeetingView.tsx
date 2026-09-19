import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  Send,
  Radio,
  Volume2,
  FlipHorizontal,
  AlertCircle,
  Sparkles,
  Tv,
  PictureInPicture2,
  Sliders,
  Headphones,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { User } from '../types';
import { useLiveMedia, AudioProfile } from '../hooks/useLiveMedia';

interface VideoMeetingViewProps {
  currentUser: User | null;
  sessionTitle: string;
  onLeave: () => void;
}

export const VideoMeetingView: React.FC<VideoMeetingViewProps> = ({
  currentUser,
  sessionTitle,
  onLeave,
}) => {
  const {
    isMicOn,
    isSpeaking,
    audioLevel,
    micError,
    toggleMic,
    startMic,
    isCamOn,
    isMirrored,
    toggleMirror,
    camError,
    toggleCam,
    startCam,
    isScreenSharing,
    toggleScreenShare,
    openExternalProjectorWindow,
    isExternalWindowOpen,
    togglePictureInPicture,
    isPictureInPicture,
    audioProfile,
    setAudioProfile,
    audioDevices,
    selectedAudioDeviceId,
    setAudioDeviceId,
    isMonitoring,
    toggleMonitor,
    isPushToTalk,
    setIsPushToTalk,
    isPttPressed,
    compressionReduction,
    videoRef,
    canvasRef,
    mediaStream,
    screenStream,
    videoResolution,
  } = useLiveMedia({
    initialMic: true,
    initialCam: false,
    audioProfile: 'broadcast',
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [callDuration, setCallDuration] = useState(0); // seconds

  // Duration ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const participants = [
    {
      id: currentUser?.id || 'me',
      name: `${currentUser?.name || 'You'} (You)`,
      role: currentUser?.roleTitle || 'Builder',
      avatar:
        currentUser?.avatar ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
          currentUser?.username || 'you'
        )}`,
      isSpeaking: isMicOn && isSpeaking,
      isSelf: true,
      hasVideo: isCamOn || isScreenSharing,
    },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: currentUser?.name || 'You',
        text: inputText.trim(),
        time: 'Just now',
      },
    ]);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Session Header */}
      <header className="h-14 border-b border-neutral-900 bg-neutral-950 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={onLeave}
            id="meeting-leave-btn"
            className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Leave Session</span>
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
              {sessionTitle || 'Live Studio Collaborative Room'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2 font-mono text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-lg">
            <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" />
            <span>{formatDuration(callDuration)}</span>
          </div>

          <button
            onClick={onLeave}
            id="meeting-end-btn"
            className="flex items-center space-x-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-bold text-white transition cursor-pointer shadow-sm"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">End & Leave</span>
          </button>
        </div>
      </header>

      {/* Permission & Error Alerts */}
      {(micError || camError) && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              {camError && micError
                ? 'Camera & Microphone access: Please check browser permissions and click Retry.'
                : camError || micError}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {micError && (
              <button
                onClick={() => startMic()}
                className="rounded bg-amber-900/60 hover:bg-amber-900 px-2 py-0.5 text-[11px] font-semibold text-amber-100 transition"
              >
                Retry Mic
              </button>
            )}
            {camError && (
              <button
                onClick={() => startCam()}
                className="rounded bg-amber-900/60 hover:bg-amber-900 px-2 py-0.5 text-[11px] font-semibold text-amber-100 transition"
              >
                Retry Cam
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video & Audio Grid */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 auto-rows-fr max-w-5xl mx-auto w-full flex-1 mb-6">
            {participants.map((p) => (
              <div
                key={p.id}
                id={`participant-card-${p.id}`}
                className={`relative rounded-2xl border bg-neutral-950 p-4 flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px] transition-all overflow-hidden ${
                  p.isSpeaking
                    ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/60'
                    : 'border-neutral-800'
                }`}
              >
                {/* Real video element for self: always mounted so videoRef and stream binding are instant */}
                {p.isSelf && (
                  <div
                    className={`absolute inset-0 h-full w-full bg-black overflow-hidden transition-opacity duration-200 ${
                      isCamOn || isScreenSharing
                        ? 'opacity-100 z-10 pointer-events-auto'
                        : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <video
                      ref={(el) => {
                        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                        const activeStream = screenStream || mediaStream;
                        if (el && activeStream && el.srcObject !== activeStream) {
                          el.srcObject = activeStream;
                          el.muted = true;
                          el.playsInline = true;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      id="self-video-stream"
                      className={`h-full w-full object-cover transition-transform duration-200 ${
                        isMirrored && !isScreenSharing ? 'scale-x-[-1]' : ''
                      }`}
                      onLoadedMetadata={(e) => {
                        e.currentTarget.play().catch(() => {});
                      }}
                    />

                    {/* Top overlay badge for Camera/Screen details */}
                    <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
                      <span className="flex items-center space-x-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-900/60 shadow">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{isScreenSharing ? 'SCREEN SHARE' : `LIVE ${videoResolution}`}</span>
                      </span>

                      {!isScreenSharing && (
                        <button
                          type="button"
                          onClick={toggleMirror}
                          id="meeting-flip-camera-btn"
                          className="flex items-center space-x-1 rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 text-[10px] text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                          title="Mirror camera view"
                        >
                          <FlipHorizontal className="h-3 w-3" />
                          <span className="hidden sm:inline">Flip</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Avatar and participant display when video is off */}
                <div className="flex flex-col items-center space-y-3 z-0">
                  <div className="relative">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 object-cover transition-all ${
                        p.isSpeaking
                          ? 'border-emerald-400 ring-4 ring-emerald-500/30'
                          : 'border-neutral-800'
                      }`}
                    />
                    {p.isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-black border-2 border-neutral-950 animate-pulse shadow-md">
                        <Mic className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white flex items-center justify-center space-x-1.5">
                      <span>{p.name}</span>
                      {p.isSelf && isMicOn && isSpeaking && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {p.role}
                    </span>
                  </div>
                </div>

                {/* Speaker indicator badge in bottom-left */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-2 rounded-lg bg-black/80 backdrop-blur-md px-2.5 py-1 text-[11px] text-white border border-neutral-800">
                  {p.isSelf ? (
                    isMicOn ? (
                      <div className="flex items-center space-x-1.5">
                        <Mic className={`h-3.5 w-3.5 ${p.isSpeaking ? 'text-emerald-400 animate-pulse' : 'text-emerald-500/80'}`} />
                        {/* Real-time mini audio level VU meter */}
                        <div className="flex items-end space-x-0.5 h-3">
                          <span
                            className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                            style={{ height: `${Math.max(20, audioLevel)}%` }}
                          />
                          <span
                            className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                            style={{ height: `${Math.max(15, audioLevel * 0.8)}%` }}
                          />
                          <span
                            className="w-1 bg-emerald-400 rounded-sm transition-all duration-75"
                            style={{ height: `${Math.max(10, audioLevel * 0.6)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <MicOff className="h-3.5 w-3.5 text-neutral-500" />
                    )
                  ) : p.isSpeaking ? (
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-neutral-500" />
                  )}
                  <span className="truncate max-w-[130px] font-medium">{p.name}</span>
                </div>

                {/* Video status icon in bottom-right */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center space-x-1.5 rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 text-[10px] text-neutral-400 border border-neutral-800 font-mono">
                  {p.isSelf ? (
                    isCamOn || isScreenSharing ? (
                      <span className="flex items-center space-x-1 text-emerald-400">
                        <Video className="h-3 w-3" />
                        <span className="hidden sm:inline">{isScreenSharing ? 'Screen ON' : 'Cam ON'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-neutral-500">
                        <VideoOff className="h-3 w-3" />
                        <span className="hidden sm:inline">Cam OFF</span>
                      </span>
                    )
                  ) : (
                    <span className="flex items-center space-x-1 text-neutral-500">
                      <VideoOff className="h-3 w-3" />
                      <span className="hidden sm:inline">Cam OFF</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Dock Control Bar */}
          <div className="mx-auto max-w-2xl w-full rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-md p-3 flex items-center justify-between shadow-2xl">
            {/* Real-time Audio Wave Visualizer & Live Meter */}
            <div className="hidden sm:flex items-center space-x-2.5 pl-2">
              <div className="relative flex items-center">
                <canvas
                  ref={canvasRef}
                  width={80}
                  height={24}
                  className="rounded bg-black/40 px-1 border border-neutral-900"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-neutral-400 uppercase flex items-center space-x-1">
                  {isMicOn ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 font-bold">MIC LIVE</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
                      <span>MUTED</span>
                    </>
                  )}
                </span>
                {isMicOn && (
                  <span className="text-[9px] font-mono text-neutral-500">
                    {audioLevel > 0 ? `${audioLevel}% vol` : 'Listening...'}
                  </span>
                )}
              </div>
            </div>

            {/* Media Control Buttons */}
            <div className="flex items-center space-x-2 mx-auto sm:mx-0">
              {/* Microphone Toggle */}
              <button
                type="button"
                onClick={toggleMic}
                id="meeting-mic-toggle-btn"
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer ${
                  isMicOn
                    ? 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                }`}
                title={isMicOn ? 'Mute Microphone (Live Active)' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic className="h-5 w-5 text-emerald-400" /> : <MicOff className="h-5 w-5" />}
                {isMicOn && audioLevel > 15 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* Camera Toggle */}
              <button
                type="button"
                onClick={toggleCam}
                id="meeting-cam-toggle-btn"
                className={`flex h-11 px-3.5 items-center justify-center space-x-1.5 rounded-xl transition cursor-pointer font-medium text-xs ${
                  isCamOn
                    ? 'bg-emerald-500 text-black font-bold hover:bg-emerald-400 shadow-md'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
                }`}
                title={isCamOn ? 'Stop Camera' : 'Start Camera (Live Real-Time)'}
              >
                {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                <span className="hidden sm:inline">{isCamOn ? 'Cam Live' : 'Cam'}</span>
              </button>

              {/* Screen Share */}
              <button
                type="button"
                onClick={toggleScreenShare}
                id="meeting-screen-toggle-btn"
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer ${
                  isScreenSharing
                    ? 'bg-emerald-500 text-black font-bold shadow-md'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor className="h-5 w-5" />
              </button>

              {/* External Screen Share & Projector Window */}
              <button
                type="button"
                onClick={openExternalProjectorWindow}
                id="meeting-external-projector-btn"
                className={`relative flex h-11 px-3 items-center justify-center space-x-1.5 rounded-xl transition cursor-pointer font-medium text-xs border ${
                  isExternalWindowOpen
                    ? 'bg-emerald-500 text-black border-emerald-400 font-bold shadow-md'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border-neutral-700'
                }`}
                title="Pop out to External Display or Projector in dedicated 60fps window"
              >
                <Tv className="h-4 w-4" />
                <span className="hidden md:inline">
                  {isExternalWindowOpen ? 'Projector ON' : 'External Display'}
                </span>
                {isExternalWindowOpen && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* Picture in Picture */}
              <button
                type="button"
                onClick={togglePictureInPicture}
                id="meeting-pip-btn"
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer border ${
                  isPictureInPicture
                    ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border-neutral-700'
                }`}
                title="Pop video into floating desktop Picture-in-Picture"
              >
                <PictureInPicture2 className="h-4 w-4" />
              </button>

              {/* Audio Studio Settings & DSP */}
              <button
                type="button"
                onClick={() => setIsAudioSettingsOpen(!isAudioSettingsOpen)}
                id="meeting-audio-studio-btn"
                className={`flex h-11 px-3 items-center justify-center space-x-1.5 rounded-xl transition cursor-pointer font-medium text-xs border ${
                  isAudioSettingsOpen
                    ? 'bg-emerald-500 text-black font-bold border-emerald-400'
                    : 'bg-neutral-800 text-emerald-400 hover:text-emerald-300 border-neutral-700 hover:bg-neutral-700'
                }`}
                title="Studio Voice DSP: Broadcast Compression, EQ, Mic Monitor & PTT"
              >
                <Sliders className="h-4 w-4" />
                <span className="hidden md:inline font-mono">Voice Studio</span>
              </button>

              {/* Live In-Room Chat */}
              <button
                type="button"
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  if (!isChatOpen) setIsParticipantsOpen(false);
                }}
                id="meeting-chat-toggle-btn"
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer border ${
                  isChatOpen
                    ? 'bg-neutral-700 text-white border-neutral-600'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border-neutral-700'
                }`}
                title="Toggle Live Chat"
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* Participants */}
              <button
                type="button"
                onClick={() => {
                  setIsParticipantsOpen(!isParticipantsOpen);
                  if (!isParticipantsOpen) setIsChatOpen(false);
                }}
                id="meeting-participants-toggle-btn"
                className={`flex h-11 w-11 items-center justify-center rounded-xl transition cursor-pointer border ${
                  isParticipantsOpen
                    ? 'bg-neutral-700 text-white border-neutral-600'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border-neutral-700'
                }`}
                title="Toggle Participants"
              >
                <Users className="h-5 w-5" />
              </button>

              {/* Leave Session */}
              <button
                type="button"
                onClick={onLeave}
                id="meeting-leave-dock-btn"
                className="flex h-11 px-4 items-center justify-center space-x-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition cursor-pointer shadow"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Leave</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Drawer: Live Session Chat or Participants */}
        {(isChatOpen || isParticipantsOpen) && (
          <div className="w-80 border-l border-neutral-900 bg-neutral-950 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            {isChatOpen && (
              <>
                <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <span>In-Room Chat</span>
                  </span>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className="text-left space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span className="font-bold text-neutral-300">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-xs text-neutral-200 bg-neutral-900 rounded-lg p-2.5 border border-neutral-800">
                        {msg.text}
                      </p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-900 flex space-x-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 rounded-lg border border-neutral-800 bg-black px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-500 p-2 text-black hover:bg-emerald-400 transition cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            )}

            {isParticipantsOpen && (
              <>
                <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center space-x-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    <span>Participants ({participants.length})</span>
                  </span>
                  <button
                    onClick={() => setIsParticipantsOpen(false)}
                    className="text-neutral-500 hover:text-white text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-left">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="h-8 w-8 rounded-full border border-neutral-800 object-cover"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">{p.name}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{p.role}</div>
                        </div>
                      </div>
                      {p.isSpeaking ? (
                        <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      ) : (
                        <MicOff className="h-3.5 w-3.5 text-neutral-600" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* AUDIO STUDIO DSP & HARDWARE MODAL */}
      {isAudioSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Voice Chat Studio DSP</h3>
                  <p className="text-[11px] text-neutral-400">
                    Broadcast-grade 48kHz processing, dynamics compression & hardware
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioSettingsOpen(false)}
                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Vocal Audio Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'broadcast',
                    title: 'Broadcast Studio',
                    desc: '80Hz rumble cut, +3.5dB vocal presence EQ, dynamics compressor leveller.',
                  },
                  {
                    id: 'crisp',
                    title: 'Crisp Voice',
                    desc: '120Hz highpass, 4.2kHz presence, fast dialogue compressor.',
                  },
                  {
                    id: 'direct',
                    title: 'Direct Hi-Fi',
                    desc: 'Uncompressed flat 48kHz audio without active DSP coloring.',
                  },
                ].map((prof) => (
                  <button
                    key={prof.id}
                    type="button"
                    onClick={() => setAudioProfile(prof.id as AudioProfile)}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer flex flex-col justify-between ${
                      audioProfile === prof.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-neutral-800 bg-black/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">{prof.title}</span>
                        {audioProfile === prof.id && (
                          <Check className="h-3 w-3 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed font-mono">
                        {prof.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Hardware Device */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block">
                Microphone Hardware Device
              </label>
              <select
                value={selectedAudioDeviceId || ''}
                onChange={(e) => setAudioDeviceId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-black px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                {audioDevices.length === 0 ? (
                  <option value="">Default System Microphone</option>
                ) : (
                  audioDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Microphone ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Advanced Controls: Headphone Soundcheck & Push to Talk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Headphone Loopback Monitor */}
              <div
                onClick={toggleMonitor}
                className={`rounded-xl border p-3 cursor-pointer transition flex items-start space-x-3 ${
                  isMonitoring
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-neutral-800 bg-black/40 hover:border-neutral-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isMonitoring ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Headphones className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Mic Sound Check</span>
                    <span className={`text-[10px] font-mono ${isMonitoring ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
                      {isMonitoring ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                    Hear your voice in headphones to check levels & room acoustics.
                  </p>
                </div>
              </div>

              {/* Push-to-Talk Mode */}
              <div
                onClick={() => setIsPushToTalk(!isPushToTalk)}
                className={`rounded-xl border p-3 cursor-pointer transition flex items-start space-x-3 ${
                  isPushToTalk
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-neutral-800 bg-black/40 hover:border-neutral-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isPushToTalk ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
                  <Radio className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Push-to-Talk (PTT)</span>
                    <span className={`text-[10px] font-mono ${isPushToTalk ? 'text-emerald-400 font-bold' : 'text-neutral-500'}`}>
                      {isPushToTalk ? 'ENABLED' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                    Hold [Spacebar] anytime to transmit audio without background noise.
                  </p>
                </div>
              </div>
            </div>

            {/* Real-Time DSP Telemetry Bar */}
            <div className="rounded-xl border border-neutral-800 bg-black/80 p-3 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-neutral-400">
                <span>VU Level</span>
                <span className="text-emerald-400 font-bold">{audioLevel}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-400">
                <span>Compressor Gain Reduction:</span>
                <span className="text-indigo-400 font-semibold">
                  {compressionReduction > 0 ? `-${compressionReduction} dB` : '0.0 dB (Transparent)'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-900">
              <button
                type="button"
                onClick={() => setIsAudioSettingsOpen(false)}
                className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
