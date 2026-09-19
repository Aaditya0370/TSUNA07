import React from 'react';
import { ArrowRight, Sparkles, Terminal, Code2, Users2, Mic } from 'lucide-react';

interface LandingHeroProps {
  onEnter: () => void;
  onExploreCommunities: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnter,
  onExploreCommunities,
}) => {
  return (
    <div className="relative overflow-hidden border-b border-neutral-900 bg-black py-12 sm:py-16">
      {/* Subtle architectural background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center space-x-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs text-neutral-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[11px] tracking-wide text-neutral-300">
            TSUNA PLATFORM • FOR CREATORS & BUILDERS
          </span>
        </div>

        {/* Hero Title with dark fill + white outline/shadow treatment */}
        <h1 className="hero-outline-text text-5xl sm:text-7xl font-extrabold tracking-tight mb-4 select-none">
          TSUNA
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-3">
          Connecting people who create.
        </p>

        {/* Supporting Statement */}
        <p className="mx-auto max-w-2xl text-sm sm:text-base text-neutral-400 font-normal leading-relaxed mb-8">
          A social platform built around communities, collaboration, and creation — not just scrolling.
          People shouldn't just connect. They should build together.
        </p>

        {/* Primary & Secondary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onEnter}
            className="flex items-center space-x-2 rounded-lg bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-black transition hover:bg-neutral-200 active:scale-95 shadow-lg"
          >
            <span>Enter Tsuna</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onExploreCommunities}
            className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-950 px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:text-white active:scale-95"
          >
            <Users2 className="h-4 w-4 text-neutral-400" />
            <span>Explore Communities</span>
          </button>
        </div>

        {/* The 5-stage loop pillars */}
        <div className="mt-12 grid grid-cols-5 gap-2 border-t border-neutral-900 pt-6 max-w-3xl mx-auto">
          {[
            { step: '01', title: 'CONNECT', desc: 'Find your tribe' },
            { step: '02', title: 'COMMUNICATE', desc: 'Voice & group chat' },
            { step: '03', title: 'SHARE', desc: 'Code, files & art' },
            { step: '04', title: 'COLLABORATE', desc: 'Live jams & sprint' },
            { step: '05', title: 'BUILD', desc: 'Ship production software' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <span className="font-mono text-[10px] text-neutral-400 block">{item.step}</span>
              <p className="text-[11px] font-bold tracking-tight text-white mt-0.5">{item.title}</p>
              <p className="text-[10px] text-neutral-400 hidden sm:block mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
