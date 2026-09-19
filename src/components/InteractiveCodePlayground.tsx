import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sliders, Code2, Sparkles, Copy, Check, Eye } from 'lucide-react';
import { sounds } from '../utils/audio';

interface InteractiveCodePlaygroundProps {
  initialCode?: string;
  initialLanguage?: string;
  creatorName?: string;
  title?: string;
}

export const InteractiveCodePlayground: React.FC<InteractiveCodePlaygroundProps> = ({
  initialCode = `// WebGPU / Real-time Particle Simulation
// Ping-pong buffer compute pipeline
const PARTICLE_COUNT = 2000;
const SIMULATION_SPEED = 1.2;

function renderFlow(ctx, time, params) {
  // Curl noise particle field
  ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
  ctx.fillRect(0, 0, width, height);
}`,
  initialLanguage = 'typescript',
  creatorName = 'Creator',
  title = 'Interactive WebGPU Simulation Stage',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<'canvas' | 'code'>('canvas');
  const [particleDensity, setParticleDensity] = useState<number>(120);
  const [flowSpeed, setFlowSpeed] = useState<number>(1.5);
  const [palette, setPalette] = useState<'emerald' | 'cyan' | 'violet' | 'amber'>('emerald');
  const [copied, setCopied] = useState(false);
  const [fps, setFps] = useState(60);

  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hueOffset: number;
    }>
  >([]);

  // Initialize particles
  const initParticles = (width: number, height: number, count: number) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        hueOffset: Math.random() * 30 - 15,
      });
    }
    particlesRef.current = list;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const height = (canvas.height = 340);
    initParticles(width, height, particleDensity);
  }, [particleDensity]);

  // Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Soft trails
      ctx.fillStyle = 'rgba(8, 8, 8, 0.18)';
      ctx.fillRect(0, 0, width, height);

      // Color base
      let baseHue = 155; // emerald
      if (palette === 'cyan') baseHue = 190;
      if (palette === 'violet') baseHue = 270;
      if (palette === 'amber') baseHue = 38;

      const particles = particlesRef.current;
      const t = time * 0.001 * flowSpeed;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isRunning) {
          // Vector field math simulating compute curl noise
          const angle =
            Math.sin(p.x * 0.005 + t) * Math.cos(p.y * 0.005 + t) * Math.PI * 2;
          p.vx += Math.cos(angle) * 0.08 * flowSpeed;
          p.vy += Math.sin(angle) * 0.08 * flowSpeed;

          // Damping
          p.vx *= 0.96;
          p.vy *= 0.96;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${baseHue + p.hueOffset}, 85%, 60%, ${p.alpha})`;
        ctx.fill();

        // Connect nearby particles with luminous lines
        for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `hsla(${baseHue}, 80%, 65%, ${(1 - dist / 60) * 0.25})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // FPS counter
      frameCount++;
      if (time - lastFpsUpdate >= 500) {
        setFps(Math.round((frameCount * 1000) / (time - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = time;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, flowSpeed, palette]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText?.(initialCode);
    setCopied(true);
    sounds.playTap();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    sounds.playTap();
    const canvas = canvasRef.current;
    if (canvas) {
      initParticles(canvas.width, canvas.height, particleDensity);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-900 px-4 py-3 bg-neutral-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-medium text-neutral-300">
            {title}
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
            {fps} FPS
          </span>
        </div>

        {/* Tab switcher: Canvas vs Source Code */}
        <div className="flex items-center space-x-1 rounded-lg bg-neutral-950 p-1 border border-neutral-800">
          <button
            onClick={() => {
              setActiveTab('canvas');
              sounds.playTap();
            }}
            className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'canvas'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Interactive Stage</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('code');
              sounds.playTap();
            }}
            className={`flex items-center space-x-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              activeTab === 'code'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Code2 className="h-3 w-3" />
            <span>Shader / Source</span>
          </button>
        </div>
      </div>

      {/* Main viewport */}
      {activeTab === 'canvas' ? (
        <div className="relative w-full bg-neutral-950 flex flex-col">
          <canvas
            ref={canvasRef}
            className="w-full h-[320px] block cursor-crosshair"
            onClick={() => {
              sounds.playBlip();
              // Spawn burst at click position
              const canvas = canvasRef.current;
              if (!canvas) return;
              const rect = canvas.getBoundingClientRect();
              const burstCount = 15;
              for (let b = 0; b < burstCount; b++) {
                particlesRef.current.push({
                  x: canvas.width / 2 + (Math.random() - 0.5) * 60,
                  y: canvas.height / 2 + (Math.random() - 0.5) * 60,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  size: Math.random() * 3 + 1,
                  alpha: 1,
                  hueOffset: Math.random() * 40 - 20,
                });
              }
              if (particlesRef.current.length > 250) {
                particlesRef.current.splice(0, burstCount);
              }
            }}
          />

          {/* Interactive Controller Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-900 bg-neutral-950/95 px-4 py-3 text-xs">
            {/* Play/Pause & Reset */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsRunning(!isRunning);
                  sounds.playTap();
                }}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 font-medium transition ${
                  isRunning
                    ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Freeze</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                title="Reset simulation field"
                className="rounded-lg border border-neutral-800 p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Parameter sliders */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
              <div className="flex items-center space-x-2">
                <span>Density:</span>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={particleDensity}
                  onChange={(e) => setParticleDensity(Number(e.target.value))}
                  className="h-1.5 w-20 accent-emerald-400 rounded-lg cursor-pointer bg-neutral-800"
                />
                <span className="font-mono text-neutral-300">{particleDensity}</span>
              </div>

              <div className="flex items-center space-x-2">
                <span>Speed:</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.5"
                  step="0.1"
                  value={flowSpeed}
                  onChange={(e) => setFlowSpeed(Number(e.target.value))}
                  className="h-1.5 w-16 accent-emerald-400 rounded-lg cursor-pointer bg-neutral-800"
                />
                <span className="font-mono text-neutral-300">{flowSpeed}x</span>
              </div>

              {/* Palette selector */}
              <div className="flex items-center space-x-1">
                <span>Palette:</span>
                {(['emerald', 'cyan', 'violet', 'amber'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPalette(p);
                      sounds.playTap();
                    }}
                    className={`h-4 w-4 rounded-full border transition ${
                      palette === p ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    } ${
                      p === 'emerald'
                        ? 'bg-emerald-400 border-emerald-300'
                        : p === 'cyan'
                        ? 'bg-cyan-400 border-cyan-300'
                        : p === 'violet'
                        ? 'bg-violet-400 border-violet-300'
                        : 'bg-amber-400 border-amber-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative bg-neutral-950 p-4 font-mono text-xs text-neutral-300 overflow-x-auto max-h-[380px]">
          <div className="absolute top-3 right-3">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-white transition"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <pre className="text-neutral-300 leading-relaxed font-mono">
            <code>{initialCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
