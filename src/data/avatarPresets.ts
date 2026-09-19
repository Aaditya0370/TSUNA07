export type AvatarCategory = 'cartoon' | 'anime' | 'doodle';

export interface AvatarPreset {
  id: string;
  name: string;
  category: AvatarCategory;
  url: string;
  description?: string;
}

export const AVATAR_CATEGORIES: { id: AvatarCategory; label: string; description: string }[] = [
  { id: 'cartoon', label: 'Cartoon', description: 'Expressive, colorful cartoon characters & retro adventurer avatars' },
  { id: 'anime', label: 'Anime', description: 'Illustrated anime & manga character styles with vibrant hair & expressions' },
  { id: 'doodle', label: 'Doodle', description: 'Playful hand-drawn sketches, quirky scribbles & line-art portraits' },
];

export const AVATAR_PRESETS: AvatarPreset[] = [
  // 🎨 Cartoon Avatars (Adventurer, Fun Emoji, Big Smile)
  {
    id: 'cartoon_astro',
    name: 'Astro Cadet',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=AstroCadet&backgroundColor=b6e3f4,c0aede,d1d4f9',
    description: 'Brave celestial space explorer',
  },
  {
    id: 'cartoon_pixel_ranger',
    name: 'Pixel Ranger',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=PixelRanger&backgroundColor=ffd5dc,ffdfbf',
    description: 'Techno adventurer traversing retro worlds',
  },
  {
    id: 'cartoon_cyber_scout',
    name: 'Cyber Scout',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CyberScout&backgroundColor=c0aede,d1d4f9',
    description: 'Curious hacker navigating neon grids',
  },
  {
    id: 'cartoon_neon_spark',
    name: 'Neon Spark',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=NeonSpark&backgroundColor=b6e3f4',
    description: 'High-energy playful emoji avatar',
  },
  {
    id: 'cartoon_retro_hero',
    name: 'Retro Hero',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=RetroHero&backgroundColor=ffd5dc',
    description: 'Classic arcade protagonist ready for adventure',
  },
  {
    id: 'cartoon_glitch_kid',
    name: 'Glitch Kid',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=GlitchKid&backgroundColor=d1d4f9',
    description: 'Creative explorer with experimental energy',
  },
  {
    id: 'cartoon_sunny_smile',
    name: 'Sunny Pulse',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=SunnyPulse&backgroundColor=ffdfbf',
    description: 'Warm and cheerful friendly character',
  },
  {
    id: 'cartoon_cosmic_wanderer',
    name: 'Cosmic Wanderer',
    category: 'cartoon',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CosmicWanderer&backgroundColor=b6e3f4',
    description: 'Intergalactic voyager mapping distant stars',
  },

  // ⚔️ Anime Avatars (Lorelei, Avataaars)
  {
    id: 'anime_shinobi',
    name: 'Neo Shinobi',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=NeoShinobi&backgroundColor=1e1e2e,2e1e3e',
    description: 'Stealth shader architect from Tokyo Neo',
  },
  {
    id: 'anime_kitsune',
    name: 'Cyber Kitsune',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=CyberKitsune&backgroundColor=313244,181825',
    description: 'Spirit guardian of digital frequencies',
  },
  {
    id: 'anime_mecha_pilot',
    name: 'Mecha Pilot',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=MechaPilot&backgroundColor=11111b',
    description: 'Elite pilot interfacing directly via WebGPU neural link',
  },
  {
    id: 'anime_star_voyager',
    name: 'Star Voyager',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=StarVoyager&backgroundColor=1e1e2e',
    description: 'Astral cartographer of computational systems',
  },
  {
    id: 'anime_arcane_coder',
    name: 'Arcane Coder',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ArcaneCoder&backgroundColor=181825',
    description: 'Compiler alchemist synthesizing type-safe spells',
  },
  {
    id: 'anime_valkyrie',
    name: 'Techno Valkyrie',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=TechnoValkyrie&backgroundColor=313244',
    description: 'Guardian of open protocol architectures',
  },
  {
    id: 'anime_shadow_runner',
    name: 'Shadow Runner',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ShadowRunner&backgroundColor=11111b',
    description: 'Night market cryptographer and distributed hacker',
  },
  {
    id: 'anime_lunar_sage',
    name: 'Lunar Sage',
    category: 'anime',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=LunarSage&backgroundColor=1e1e2e',
    description: 'Contemplative synthesizer of procedural audio waves',
  },

  // ✏️ Doodle Avatars (Croodles, Bottts, Notionists)
  {
    id: 'doodle_thinker',
    name: 'Sketchy Thinker',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/croodles/svg?seed=SketchyThinker&backgroundColor=ffffff',
    description: 'Minimalist hand-drawn thinker with pen & ink vibe',
  },
  {
    id: 'doodle_scribble_bot',
    name: 'Scribble Bot',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ScribbleBot&backgroundColor=d1d4f9',
    description: 'Friendly robotic companion drawn with quirky lines',
  },
  {
    id: 'doodle_zen_monk',
    name: 'Zen Scribble',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/croodles/svg?seed=ZenScribble&backgroundColor=ffffff',
    description: 'Peaceful doodle art character in mindful focus',
  },
  {
    id: 'doodle_ink_rebel',
    name: 'Ink Blot Rebel',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/croodles/svg?seed=InkRebel&backgroundColor=f5f5f5',
    description: 'Artistic raw stroke illustration with bold character',
  },
  {
    id: 'doodle_pixel_sprite',
    name: 'Pocket Bot',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PocketBot&backgroundColor=b6e3f4',
    description: 'Little mechanical buddy with antennae and LED eyes',
  },
  {
    id: 'doodle_curious_cat',
    name: 'Doodle Wonder',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/croodles/svg?seed=DoodleWonder&backgroundColor=ffd5dc',
    description: 'Whimsical illustrated face looking for inspiration',
  },
  {
    id: 'doodle_graphite_poet',
    name: 'Graphite Poet',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/croodles/svg?seed=GraphitePoet&backgroundColor=ffffff',
    description: 'Loose charcoal and pencil sketch of an expressive mind',
  },
  {
    id: 'doodle_mecha_spark',
    name: 'Sparky Droid',
    category: 'doodle',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SparkyDroid&backgroundColor=c0aede',
    description: 'Quirky retro automaton with playful antennas',
  },
];

/**
 * Generate a dynamic illustrated avatar on the fly
 */
export function generateAvatarUrl(category: AvatarCategory, seed: string): string {
  const cleanSeed = encodeURIComponent(seed.trim() || 'tsuna_creator');
  switch (category) {
    case 'anime':
      return `https://api.dicebear.com/7.x/lorelei/svg?seed=${cleanSeed}&backgroundColor=1e1e2e,313244,181825`;
    case 'doodle':
      return `https://api.dicebear.com/7.x/croodles/svg?seed=${cleanSeed}&backgroundColor=ffffff,f5f5f5`;
    case 'cartoon':
    default:
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc`;
  }
}
