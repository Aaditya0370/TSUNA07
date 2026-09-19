import { useState, useEffect, useRef, useCallback } from 'react';

export type AudioProfile = 'broadcast' | 'crisp' | 'direct';

export interface UseLiveMediaOptions {
  initialMic?: boolean;
  initialCam?: boolean;
  audioProfile?: AudioProfile;
}

export interface UseLiveMediaReturn {
  // Mic state & controls
  isMicOn: boolean;
  isSpeaking: boolean;
  audioLevel: number; // 0 to 100
  micError: string | null;
  toggleMic: () => Promise<void>;
  startMic: () => Promise<void>;
  stopMic: () => void;

  // Studio Audio Enhancements (Voice Chat Exeptionally Good)
  audioProfile: AudioProfile;
  setAudioProfile: (profile: AudioProfile) => void;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDeviceId: string | null;
  setAudioDeviceId: (deviceId: string) => Promise<void>;
  isMonitoring: boolean;
  toggleMonitor: () => void;
  isPushToTalk: boolean;
  setIsPushToTalk: (ptt: boolean) => void;
  isPttPressed: boolean;
  setIsPttPressed: (pressed: boolean) => void;
  compressionReduction: number; // dB reduction for meter

  // Camera state & controls
  isCamOn: boolean;
  isMirrored: boolean;
  toggleMirror: () => void;
  camError: string | null;
  toggleCam: () => Promise<void>;
  startCam: () => Promise<void>;
  stopCam: () => void;

  // Screen share & External Display controls
  isScreenSharing: boolean;
  toggleScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  openExternalProjectorWindow: () => Window | null;
  isExternalWindowOpen: boolean;
  togglePictureInPicture: () => Promise<void>;
  isPictureInPicture: boolean;

  // Stream refs & elements
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mediaStream: MediaStream | null;
  screenStream: MediaStream | null;

  // Status info
  isLive: boolean;
  activeDeviceId: string | null;
  videoResolution: string;
}

export function useLiveMedia(options: UseLiveMediaOptions = {}): UseLiveMediaReturn {
  const { initialMic = false, initialCam = false, audioProfile: defaultProfile = 'broadcast' } = options;

  const [isMicOn, setIsMicOn] = useState<boolean>(initialMic);
  const [isCamOn, setIsCamOn] = useState<boolean>(initialCam);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [videoResolution, setVideoResolution] = useState<string>('1080p 60fps HD');
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // Audio Studio Settings
  const [audioProfile, setAudioProfileState] = useState<AudioProfile>(defaultProfile);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isPushToTalk, setIsPushToTalk] = useState<boolean>(false);
  const [isPttPressed, setIsPttPressed] = useState<boolean>(false);
  const [compressionReduction, setCompressionReduction] = useState<number>(0);

  // External Display & PiP
  const [isExternalWindowOpen, setIsExternalWindowOpen] = useState<boolean>(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState<boolean>(false);
  const externalWindowRef = useRef<Window | null>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const highpassNodeRef = useRef<BiquadFilterNode | null>(null);
  const presenceNodeRef = useRef<BiquadFilterNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const monitorGainNodeRef = useRef<GainNode | null>(null);

  const animFrameRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enumerate audio input devices
  const refreshAudioDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(mics);
        if (mics.length > 0 && !selectedAudioDeviceId) {
          setSelectedAudioDeviceId(mics[0].deviceId);
        }
      }
    } catch {
      // ignore
    }
  }, [selectedAudioDeviceId]);

  useEffect(() => {
    refreshAudioDevices();
  }, [refreshAudioDevices]);

  // --------------------------------------------------------------------------
  // MICROPHONE & EXCEPTIONAL STUDIO AUDIO DSP CHAIN
  // --------------------------------------------------------------------------
  const applyAudioProfile = useCallback((profile: AudioProfile) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const highpass = highpassNodeRef.current;
    const presence = presenceNodeRef.current;
    const compressor = compressorNodeRef.current;
    const masterGain = masterGainNodeRef.current;

    if (profile === 'broadcast') {
      // Warm, studio broadcast sound: 80Hz rumble cut, +3.2dB vocal clarity, transparent compression
      if (highpass) {
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(85, ctx.currentTime);
      }
      if (presence) {
        presence.type = 'peaking';
        presence.frequency.setValueAtTime(3400, ctx.currentTime);
        presence.gain.setValueAtTime(3.5, ctx.currentTime);
        presence.Q.setValueAtTime(1.1, ctx.currentTime);
      }
      if (compressor) {
        compressor.threshold.setValueAtTime(-24, ctx.currentTime);
        compressor.knee.setValueAtTime(12, ctx.currentTime);
        compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.18, ctx.currentTime);
      }
      if (masterGain) {
        masterGain.gain.setValueAtTime(1.2, ctx.currentTime);
      }
    } else if (profile === 'crisp') {
      // High-intelligibility dialogue with sharp presence and fast clamp
      if (highpass) {
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(120, ctx.currentTime);
      }
      if (presence) {
        presence.type = 'peaking';
        presence.frequency.setValueAtTime(4200, ctx.currentTime);
        presence.gain.setValueAtTime(4.5, ctx.currentTime);
        presence.Q.setValueAtTime(1.4, ctx.currentTime);
      }
      if (compressor) {
        compressor.threshold.setValueAtTime(-20, ctx.currentTime);
        compressor.knee.setValueAtTime(8, ctx.currentTime);
        compressor.ratio.setValueAtTime(6.0, ctx.currentTime);
        compressor.attack.setValueAtTime(0.002, ctx.currentTime);
        compressor.release.setValueAtTime(0.12, ctx.currentTime);
      }
      if (masterGain) {
        masterGain.gain.setValueAtTime(1.1, ctx.currentTime);
      }
    } else {
      // Direct raw audio (flat linear passthrough)
      if (highpass) {
        highpass.frequency.setValueAtTime(20, ctx.currentTime);
      }
      if (presence) {
        presence.gain.setValueAtTime(0, ctx.currentTime);
      }
      if (compressor) {
        compressor.threshold.setValueAtTime(0, ctx.currentTime);
        compressor.ratio.setValueAtTime(1, ctx.currentTime);
      }
      if (masterGain) {
        masterGain.gain.setValueAtTime(1.0, ctx.currentTime);
      }
    }
  }, []);

  const setAudioProfile = useCallback((profile: AudioProfile) => {
    setAudioProfileState(profile);
    applyAudioProfile(profile);
  }, [applyAudioProfile]);

  const stopMic = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      audioStreamRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }

    analyserRef.current = null;
    highpassNodeRef.current = null;
    presenceNodeRef.current = null;
    compressorNodeRef.current = null;
    masterGainNodeRef.current = null;
    monitorGainNodeRef.current = null;

    setIsMicOn(false);
    setIsSpeaking(false);
    setAudioLevel(0);
    setCompressionReduction(0);
  }, []);

  const startMic = useCallback(async (deviceIdOverride?: string) => {
    try {
      setMicError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Audio hardware access is not supported in this browser environment');
      }

      // If already active on the same device and no override, enable tracks
      if (!deviceIdOverride && audioStreamRef.current && audioStreamRef.current.active) {
        audioStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsMicOn(true);
        return;
      }

      // If re-starting with device switch, stop old track first
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const targetDeviceId = deviceIdOverride || selectedAudioDeviceId;

      // Studio-grade 48kHz audio constraints with advanced AEC and noise suppression
      const audioConstraints: MediaTrackConstraints = {
        channelCount: { ideal: 2 },
        sampleRate: { ideal: 48000 },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      if (targetDeviceId) {
        audioConstraints.deviceId = { exact: targetDeviceId };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints,
        });
      } catch (err) {
        console.warn('High-spec audio constraints failed, using fallback:', err);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: targetDeviceId ? { deviceId: { exact: targetDeviceId } } : true,
        });
      }

      audioStreamRef.current = stream;
      setIsMicOn(true);
      refreshAudioDevices();

      // Initialize Studio Web Audio Context
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 48000 });
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
        const unlock = () => {
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        window.addEventListener('touchstart', unlock, { once: true });
      }
      audioCtxRef.current = ctx;

      // 1. Source Node
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // 2. High-pass Rumble Filter (cuts <85Hz HVAC / desk thumps)
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(85, ctx.currentTime);
      highpassNodeRef.current = highpass;

      // 3. Presence Peaking EQ (3.4kHz vocal clarity boost)
      const presence = ctx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.setValueAtTime(3400, ctx.currentTime);
      presence.gain.setValueAtTime(3.5, ctx.currentTime);
      presence.Q.setValueAtTime(1.1, ctx.currentTime);
      presenceNodeRef.current = presence;

      // 4. Dynamics Studio Compressor (smooth broadcast volume without clipping)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(12, ctx.currentTime);
      compressor.ratio.setValueAtTime(4.5, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.18, ctx.currentTime);
      compressorNodeRef.current = compressor;

      // 5. Master Output Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(1.2, ctx.currentTime);
      masterGainNodeRef.current = masterGain;

      // 6. Analyser Node (64-bin FFT with smooth decay)
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // 7. Headphone Loopback Monitor (defaults to 0, enabled on toggle)
      const monitorGain = ctx.createGain();
      monitorGain.gain.setValueAtTime(isMonitoring ? 0.9 : 0, ctx.currentTime);
      monitorGainNodeRef.current = monitorGain;

      // Connect Chain: source -> highpass -> presence -> compressor -> masterGain -> analyser
      source.connect(highpass);
      highpass.connect(presence);
      presence.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(analyser);

      // Connect monitor to speaker destination safely (isolated by monitorGain)
      masterGain.connect(monitorGain);
      monitorGain.connect(ctx.destination);

      // Apply initial audio profile
      applyAudioProfile(audioProfile);

      // Setup audio track onended listener
      if (stream.getAudioTracks()[0]) {
        stream.getAudioTracks()[0].onended = () => {
          stopMic();
        };
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unable to access microphone. Please check system permissions.';
      console.warn('Microphone initialization error:', errorMsg);
      setMicError(errorMsg);
      setIsMicOn(false);
    }
  }, [selectedAudioDeviceId, isMonitoring, audioProfile, applyAudioProfile, refreshAudioDevices, stopMic]);

  const toggleMic = useCallback(async () => {
    if (audioStreamRef.current && audioStreamRef.current.active) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const nextEnabled = !audioTrack.enabled;
        audioTrack.enabled = nextEnabled;
        setIsMicOn(nextEnabled);
        if (!nextEnabled) {
          setIsSpeaking(false);
          setAudioLevel(0);
        }
        return;
      }
    }
    await startMic();
  }, [startMic]);

  // Set specific audio device
  const setAudioDeviceId = useCallback(
    async (deviceId: string) => {
      setSelectedAudioDeviceId(deviceId);
      if (isMicOn) {
        await startMic(deviceId);
      }
    },
    [isMicOn, startMic]
  );

  // Toggle headphone loopback monitor
  const toggleMonitor = useCallback(() => {
    setIsMonitoring((prev) => {
      const next = !prev;
      if (monitorGainNodeRef.current && audioCtxRef.current) {
        monitorGainNodeRef.current.gain.setValueAtTime(
          next ? 0.9 : 0,
          audioCtxRef.current.currentTime
        );
      }
      return next;
    });
  }, []);

  // Push-to-Talk spacebar / hotkey listener
  useEffect(() => {
    if (!isPushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsPttPressed(true);
        if (audioStreamRef.current?.getAudioTracks()[0]) {
          audioStreamRef.current.getAudioTracks()[0].enabled = true;
          setIsMicOn(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        setIsPttPressed(false);
        if (audioStreamRef.current?.getAudioTracks()[0]) {
          audioStreamRef.current.getAudioTracks()[0].enabled = false;
          setIsMicOn(false);
          setIsSpeaking(false);
          setAudioLevel(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk]);

  // --------------------------------------------------------------------------
  // AUDIO VISUALIZATION & SPECTRUM RENDER LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      const analyser = analyserRef.current;
      const canvas = canvasRef.current;
      const compressor = compressorNodeRef.current;

      if (compressor) {
        // Read compressor gain reduction (negative number in dB)
        try {
          const reduction = Math.abs(compressor.reduction);
          setCompressionReduction(Math.round(reduction * 10) / 10);
        } catch {
          // ignore
        }
      }

      if (analyser && isMicOn) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Compute average volume / RMS
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const level = Math.min(100, Math.round((avg / 255) * 160));
        setAudioLevel(level);

        // Noise gate / speaking threshold detection (> 12)
        if (level > 12) {
          setIsSpeaking(true);
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
          }
          speechTimeoutRef.current = setTimeout(() => {
            if (active) setIsSpeaking(false);
          }, 350);
        }

        // Draw live frequency / waveform onto canvas if attached
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const numBars = Math.min(bufferLength, 20);
            const barWidth = Math.max(2, width / numBars - 2);

            for (let i = 0; i < numBars; i++) {
              const val = dataArray[i];
              const percent = val / 255;
              const barHeight = Math.max(3, percent * height * 0.95);
              const x = i * (barWidth + 2);
              const y = height - barHeight;

              // Color gradient: emerald voice highlight into teal / cyan
              if (percent > 0.6) {
                ctx.fillStyle = '#34d399'; // bright emerald-400
              } else if (percent > 0.25) {
                ctx.fillStyle = '#10b981'; // emerald-500
              } else {
                ctx.fillStyle = '#065f46'; // dark emerald-800
              }

              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, 2);
              } else {
                ctx.rect(x, y, barWidth, barHeight);
              }
              ctx.fill();
            }
          }
        }
      } else {
        // Idle / Muted canvas rendering
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            ctx.strokeStyle = '#27272a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [isMicOn]);

  // --------------------------------------------------------------------------
  // CAMERA & VIDEO STREAM (LOW-LATENCY 1080P)
  // --------------------------------------------------------------------------
  const stopCam = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      videoStreamRef.current = null;
    }
    setMediaStream(null);
    setIsCamOn(false);

    if (videoRef.current && !isScreenSharing) {
      videoRef.current.srcObject = null;
    }
  }, [isScreenSharing]);

  const startCam = useCallback(async () => {
    try {
      setCamError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Video camera is not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 60, min: 24 },
          facingMode: 'user',
        },
      });

      videoStreamRef.current = stream;
      setMediaStream(stream);
      setIsCamOn(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          setVideoResolution(`${settings.width}x${settings.height} @ ${Math.round(settings.frameRate || 60)}fps`);
        }
        track.onended = () => {
          stopCam();
        };
      }

      if (videoRef.current && !isScreenSharing) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Unable to access camera. Please check camera permissions.';
      console.warn('Camera error:', errorMsg);
      setCamError(errorMsg);
      setIsCamOn(false);
    }
  }, [isScreenSharing, stopCam]);

  const toggleCam = useCallback(async () => {
    if (isCamOn) {
      stopCam();
    } else {
      await startCam();
    }
  }, [isCamOn, startCam, stopCam]);

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  // --------------------------------------------------------------------------
  // EXTERNAL SCREEN SHARING & PROJECTOR POP-OUT
  // --------------------------------------------------------------------------
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);

    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      try {
        externalWindowRef.current.postMessage({ type: 'SCREEN_SHARE_STOPPED' }, '*');
      } catch {
        // ignore
      }
    }

    // Revert videoRef back to camera if active
    if (isCamOn && videoStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = videoStreamRef.current;
      videoRef.current.play().catch(() => {});
    } else if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isCamOn]);

  const startScreenShare = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen sharing not supported on this browser platform');
      }

      // 60fps high-fidelity monitor capture with system audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 60, max: 60 },
          width: { ideal: 1920 },
        },
        audio: true,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => {});
      }

      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err: unknown) {
      console.warn('Screen share cancelled or error:', err);
      setIsScreenSharing(false);
    }
  }, [stopScreenShare]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  // Dedicated External Window Popout for Secondary Displays / Projectors
  const openExternalProjectorWindow = useCallback((): Window | null => {
    const currentStream = screenStreamRef.current || videoStreamRef.current;
    
    // Check if already open
    if (externalWindowRef.current && !externalWindowRef.current.closed) {
      externalWindowRef.current.focus();
      return externalWindowRef.current;
    }

    const popout = window.open(
      '',
      'tsuna_external_projector',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    );

    if (!popout) {
      console.warn('External popout window blocked by browser popup blocker');
      return null;
    }

    externalWindowRef.current = popout;
    setIsExternalWindowOpen(true);

    popout.document.title = 'Tsuna Display — External Screen Share & Projector';
    popout.document.body.style.margin = '0';
    popout.document.body.style.backgroundColor = '#000000';
    popout.document.body.style.overflow = 'hidden';
    popout.document.body.style.display = 'flex';
    popout.document.body.style.flexDirection = 'column';
    popout.document.body.style.height = '100vh';
    popout.document.body.style.fontFamily = 'monospace';

    popout.document.body.innerHTML = `
      <div id="topbar" style="position: absolute; top: 0; left: 0; right: 0; z-index: 50; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%); transition: opacity 0.2s;">
        <div style="display: flex; items-center; gap: 8px; color: #10b981; font-size: 12px; font-weight: bold;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px #10b981;"></span>
          TSUNA // EXTERNAL PROJECTOR FEED
        </div>
        <div style="display: flex; items-center; gap: 10px;">
          <button id="fsBtn" style="background: #18181b; color: #fff; border: 1px solid #3f3f46; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;">Full Screen Native</button>
          <button id="closeBtn" style="background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;">Exit Display</button>
        </div>
      </div>
      <video id="externalVideo" autoplay playsinline muted style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>
    `;

    const extVideo = popout.document.getElementById('externalVideo') as HTMLVideoElement;
    if (extVideo && currentStream) {
      extVideo.srcObject = currentStream;
      extVideo.play().catch(() => {});
    }

    const fsBtn = popout.document.getElementById('fsBtn');
    if (fsBtn) {
      fsBtn.onclick = () => {
        if (!popout.document.fullscreenElement) {
          popout.document.documentElement.requestFullscreen().catch(() => {});
        } else {
          popout.document.exitFullscreen().catch(() => {});
        }
      };
    }

    const closeBtn = popout.document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.onclick = () => {
        popout.close();
      };
    }

    popout.onbeforeunload = () => {
      setIsExternalWindowOpen(false);
      externalWindowRef.current = null;
    };

    return popout;
  }, []);

  // Native Picture-in-Picture Mode
  const togglePictureInPicture = useCallback(async () => {
    try {
      if (!document.pictureInPictureEnabled) {
        throw new Error('Picture-in-Picture not supported in this browser');
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPictureInPicture(false);
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
        setIsPictureInPicture(true);

        videoRef.current.addEventListener(
          'leavepictureinpicture',
          () => {
            setIsPictureInPicture(false);
          },
          { once: true }
        );
      }
    } catch (err) {
      console.warn('Picture in picture toggle error:', err);
    }
  }, []);

  // --------------------------------------------------------------------------
  // AUTO START & CLEANUP
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (initialMic) {
      startMic();
    }
    if (initialCam) {
      startCam();
    }

    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (externalWindowRef.current && !externalWindowRef.current.closed) {
        externalWindowRef.current.close();
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {
          // ignore
        }
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Re-attach video stream whenever videoRef element mounts or changes
  useEffect(() => {
    const currentStream = screenStreamRef.current || videoStreamRef.current;
    if (videoRef.current && currentStream) {
      videoRef.current.srcObject = currentStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isCamOn, isScreenSharing, mediaStream, screenStream]);

  return {
    isMicOn,
    isSpeaking,
    audioLevel,
    micError,
    toggleMic,
    startMic,
    stopMic,

    // Studio audio features
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
    setIsPttPressed,
    compressionReduction,

    // Camera
    isCamOn,
    isMirrored,
    toggleMirror,
    camError,
    toggleCam,
    startCam,
    stopCam,

    // Screen sharing & External Display
    isScreenSharing,
    toggleScreenShare,
    stopScreenShare,
    openExternalProjectorWindow,
    isExternalWindowOpen,
    togglePictureInPicture,
    isPictureInPicture,

    videoRef,
    canvasRef,
    mediaStream,
    screenStream,

    isLive: isCamOn || isMicOn || isScreenSharing,
    activeDeviceId,
    videoResolution,
  };
}
