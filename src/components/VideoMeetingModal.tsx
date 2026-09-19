import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  Users,
  Send,
  FlipHorizontal,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { useLiveMedia } from '../hooks/useLiveMedia';

interface VideoMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  sessionTitle: string;
}

export const VideoMeetingModal: React.FC<VideoMeetingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  sessionTitle,
}) => {
  const {
    isMicOn,
    isSpeaking,
    audioLevel,
    micError,
    toggleMic,
    isCamOn,
    isMirrored,
    toggleMirror,
    camError,
    toggleCam,
    isScreenSharing,
    toggleScreenShare,
    videoRef,
    canvasRef,
    mediaStream,
    screenStream,
    videoResolution,
    stopMic,
    stopCam,
    stopScreenShare,
  } = useLiveMedia({
    initialMic: false, // only activate when modal is open
    initialCam: false,
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    { sender: string; text: string; time: string }[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [callDuration, setCallDuration] = useState(0); // seconds

  // Auto start mic when modal opens, stop when modal closes
  useEffect(() => {
    if (isOpen) {
      toggleMic();
    } else {
      stopMic();
      stopCam();
      stopScreenShare();
    }
  }, [isOpen, toggleMic, stopMic, stopCam, stopScreenShare]);

  // Call duration timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Participants in the video session
  const participants = [
    {
      id: currentUser?.id || 'me',
      name: `${currentUser?.name || 'You'} (You)`,
      role: currentUser?.roleTitle || 'Builder',
      avatar: currentUser?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=TsunaCreator&backgroundColor=b6e3f4,c0aede,d1d4f9',
      isSpeaking: isMicOn && isSpeaking,
      isSelf: true,
      hasVideo: isCamOn || isScreenSharing,
    },
  ];

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Top Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-neutral-900 px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                {sessionTitle}
              </h2>
              <p className="text-[11px] font-mono text-neutral-400">
                Live Video Session • {formatTimer(callDuration)} • Real-Time WebRTC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              id="modal-toggle-chat-btn"
              className={`flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                isChatOpen
                  ? 'border-neutral-700 bg-neutral-900 text-white'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:text-white'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">In-Call Chat</span>
            </button>
            <button
              onClick={onClose}
              id="modal-close-header-btn"
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Error notification if any */}
        {(micError || camError) && (
          <div className="bg-amber-950/80 border-b border-amber-900/80 px-4 py-1.5 text-xs text-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>{camError || micError}</span>
            </div>
          </div>
        )}

        {/* Main Stage & Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video Grid */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className="grid h-full grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {participants.map((p) => (
                <div
                  key={p.id}
                  id={`modal-card-${p.id}`}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-black transition-all ${
                    p.isSpeaking
                      ? 'border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                      : 'border-neutral-900'
                  }`}
                >
                  {/* Video Surface */}
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-950 min-h-[180px]">
                    {p.isSelf ? (
                      <div className="relative h-full w-full">
                        <div
                          className={`absolute inset-0 h-full w-full transition-opacity duration-200 ${
                            isCamOn || isScreenSharing
                              ? 'opacity-100 pointer-events-auto'
                              : 'opacity-0 pointer-events-none'
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
                            id="modal-self-video"
                            className={`h-full w-full object-cover ${
                              isMirrored && !isScreenSharing ? 'scale-x-[-1]' : ''
                            }`}
                            onLoadedMetadata={(e) => {
                              e.currentTarget.play().catch(() => {});
                            }}
                          />
                          <div className="absolute top-2 left-2 flex items-center space-x-1 rounded bg-black/80 px-2 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-900/50">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{isScreenSharing ? 'SCREEN' : `LIVE ${videoResolution}`}</span>
                          </div>
                          {!isScreenSharing && (
                            <button
                              type="button"
                              onClick={toggleMirror}
                              className="absolute top-2 right-2 rounded bg-black/80 p-1 text-[9px] text-neutral-300 hover:text-white border border-neutral-800 cursor-pointer"
                              title="Flip camera"
                            >
                              <FlipHorizontal className="h-3 w-3" />
                            </button>
                          )}
                        </div>

                        {!(isCamOn || isScreenSharing) && (
                          <div className="flex h-full w-full flex-col items-center justify-center space-y-2">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 object-cover transition ${
                                p.isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-neutral-800'
                              }`}
                            />
                            <p className="text-xs font-medium text-neutral-300">{p.name}</p>
                            <p className="text-[10px] text-neutral-400">{p.role}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 object-cover transition ${
                            p.isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-neutral-800'
                          }`}
                        />
                        <p className="text-xs font-medium text-neutral-300">{p.name}</p>
                        <p className="text-[10px] text-neutral-400">{p.role}</p>
                      </div>
                    )}

                    {/* Speaking / Audio visualizer canvas for self */}
                    {p.isSelf && isMicOn && (
                      <div className="absolute top-3 right-3 rounded-lg bg-black/80 backdrop-blur-md px-2 py-1 border border-neutral-800 flex items-center space-x-1.5 z-20">
                        <canvas ref={canvasRef} width={60} height={16} className="w-15 h-4" />
                        <span className="text-[9px] font-mono text-emerald-400">{audioLevel}%</span>
                      </div>
                    )}
                  </div>

                  {/* Tile Bottom Info Bar */}
                  <div className="flex items-center justify-between border-t border-neutral-900/60 bg-black/80 px-3 py-2">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="truncate text-xs font-semibold text-white">{p.name}</span>
                      {p.isSelf && (
                        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] font-mono text-neutral-300">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {p.isSpeaking ? (
                        <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
                          <Mic className="h-3 w-3 animate-pulse" />
                          <span>LIVE</span>
                        </span>
                      ) : (
                        <MicOff className="h-3 w-3 text-neutral-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-Call Side Chat Drawer */}
          {isChatOpen && (
            <div className="w-80 border-l border-neutral-900 bg-black flex flex-col justify-between p-3 shrink-0">
              <div className="border-b border-neutral-900 pb-2">
                <h3 className="text-xs font-bold text-white">Live Call Chat</h3>
                <p className="text-[10px] text-neutral-400">Messages are synced with participants</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-3">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className="rounded-lg border border-neutral-900 bg-neutral-950 p-2">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span className="font-semibold text-neutral-300">{m.sender}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="text-xs text-white mt-1">{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 pt-2 border-t border-neutral-900">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type in-call comment..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-white p-1.5 text-black hover:bg-neutral-200 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Control Dock */}
        <div className="flex h-16 items-center justify-between border-t border-neutral-900 bg-black px-4 sm:px-6">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-400 font-mono">
            <span>Room: {sessionTitle.slice(0, 20)}...</span>
          </div>

          {/* Center Call Controls */}
          <div className="flex items-center space-x-3 mx-auto">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              id="modal-toggle-mic-btn"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${
                isMicOn
                  ? 'border-emerald-700 bg-neutral-900 text-emerald-400 hover:bg-neutral-800'
                  : 'border-rose-900/80 bg-rose-950/60 text-rose-400 hover:bg-rose-900'
              }`}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={toggleCam}
              id="modal-toggle-cam-btn"
              className={`flex h-10 px-3 items-center justify-center space-x-1.5 rounded-xl border transition cursor-pointer text-xs font-medium ${
                isCamOn
                  ? 'border-emerald-500 bg-emerald-500 text-black font-bold hover:bg-emerald-400'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
              title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              <span>{isCamOn ? 'Cam Live' : 'Cam'}</span>
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={toggleScreenShare}
              id="modal-toggle-screen-btn"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition cursor-pointer ${
                isScreenSharing
                  ? 'border-emerald-600 bg-emerald-950 text-emerald-400'
                  : 'border-neutral-900 bg-black text-neutral-400 hover:text-white'
              }`}
              title="Share Screen"
            >
              <Monitor className="h-4 w-4" />
            </button>

            {/* Leave / End Call */}
            <button
              onClick={onClose}
              id="modal-leave-btn"
              className="flex items-center space-x-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 active:scale-95 cursor-pointer shadow"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Leave</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center space-x-2 text-xs text-neutral-400">
            <span>{participants.length} Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
