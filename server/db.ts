import fs from 'fs';
import path from 'path';
import {
  User,
  Community,
  Post,
  Comment,
  ChatConversation,
  ChatMessage,
  TsunaEvent,
  EventSubmission,
  VoiceRoom,
  Flow,
  ActiveStats,
  TsunaNotification,
  CommunityQuestion,
  QuestionAnswer,
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'tsuna-store.json');

export interface DatabaseState {
  currentUser: User | null;
  users: User[];
  communities: Community[];
  posts: Post[];
  comments: Record<string, Comment[]>;
  conversations: ChatConversation[];
  messages: Record<string, ChatMessage[]>;
  events: TsunaEvent[];
  submissions: Record<string, EventSubmission[]>;
  voiceRooms: VoiceRoom[];
  flows: Flow[];
  notifications: TsunaNotification[];
  questions: Record<string, CommunityQuestion[]>;
  questionAnswers: Record<string, QuestionAnswer[]>;
}

const DEFAULT_COMMUNITIES: Community[] = [
  {
    id: 'comm_hypercraft',
    name: 'HyperCraft Engine',
    slug: 'hypercraft',
    tagline: 'High-performance WebGPU, Rust & 3D real-time graphical engines.',
    description: 'A community of graphics coders, game engine architects, and 3D toolmakers collaborating on real-time rendering pipelines, WGSL compute shaders, and low-latency viewport synchronization.',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    category: 'Engineering',
    membersCount: 142,
    activeBuildingCount: 0,
    tags: ['WebGPU', 'Rust', 'Graphics', '3D Engine', 'WGSL'],
    isJoined: false,
    currentUserRole: undefined,
  },
  {
    id: 'comm_synthwave',
    name: 'SynthWave Audio Labs',
    slug: 'synthwave',
    tagline: 'Generative sound synthesis, DSP shaders, and spatial binaural audio.',
    description: 'Sound designers, algorithmists, and electronic creators crafting procedural sound engines, browser-based modular synths, and spatial soundscapes.',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    category: 'Audio & Sound',
    membersCount: 98,
    activeBuildingCount: 0,
    tags: ['WebAudio', 'DSP', 'Sound Design', 'Synths', 'Generative'],
    isJoined: false,
    currentUserRole: undefined,
  },
  {
    id: 'comm_designsystems',
    name: 'Design Systems Studio',
    slug: 'design-systems',
    tagline: 'Mathematical typography, tactile tokens, and high-fidelity interaction design.',
    description: 'Product designers and frontend artisans who reject generic templates. We build strict typographic scales, harmonic layout geometry, and accessible component architectures.',
    avatar: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    category: 'Design & 3D',
    membersCount: 184,
    activeBuildingCount: 0,
    tags: ['Design Systems', 'Typography', 'Figma Tokens', 'Motion', 'UI Engineering'],
    isJoined: false,
    currentUserRole: undefined,
  },
  {
    id: 'comm_zeroknowledge',
    name: 'ZeroKnowledge Collective',
    slug: 'zk-collective',
    tagline: 'Applied cryptography, privacy primitives, and decentralized p2p collaboration.',
    description: 'Researchers and cryptographers implementing zero-knowledge proof verification, client-side encryption primitives, and resilient local-first sync systems.',
    avatar: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    category: 'Open Source',
    membersCount: 76,
    activeBuildingCount: 0,
    tags: ['Cryptography', 'ZK Proofs', 'Rust', 'Privacy', 'P2P'],
    isJoined: false,
    currentUserRole: undefined,
  },
  {
    id: 'comm_founders',
    name: 'Founders & Shippers',
    slug: 'founders-shippers',
    tagline: 'Full-stack creators launching production code in 24–48 hour sprints.',
    description: 'Zero fluff, zero marketing vaporware. Builders who turn ideas into deployed software with real users, live feedback, and communal code reviews.',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
    category: 'Engineering',
    membersCount: 220,
    activeBuildingCount: 0,
    tags: ['Fullstack', 'TypeScript', 'Shipping', 'Indie Hacker', 'OpenSource'],
    isJoined: false,
    currentUserRole: undefined,
  },
];

const DEFAULT_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'chat_hypercraft',
    type: 'group',
    name: '#hypercraft-engine',
    communityId: 'comm_hypercraft',
    communityName: 'HyperCraft Engine',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    members: [],
    unreadCount: 0,
    backgroundTheme: 'default',
  },
  {
    id: 'chat_synthwave',
    type: 'group',
    name: '#synthwave-dsp',
    communityId: 'comm_synthwave',
    communityName: 'SynthWave Audio Labs',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
    members: [],
    unreadCount: 0,
    backgroundTheme: 'default',
  },
  {
    id: 'chat_designsystems',
    type: 'group',
    name: '#design-tokens',
    communityId: 'comm_designsystems',
    communityName: 'Design Systems Studio',
    avatar: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=150&auto=format&fit=crop&q=80',
    members: [],
    unreadCount: 0,
    backgroundTheme: 'default',
  },
];

const DEFAULT_MESSAGES: Record<string, ChatMessage[]> = {};

const DEFAULT_NOTIFICATIONS: TsunaNotification[] = [];

const DEFAULT_FLOWS: Flow[] = [
  {
    id: 'flow_wgsl_particles',
    author: {
      id: 'creator_elena',
      name: 'Elena Rostova',
      username: 'elena_gpu',
      roleTitle: 'WebGPU & Shader Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Writing compute shaders and WebGPU raymarching pipelines.',
      skills: ['WGSL', 'WebGPU', 'Rust', 'Compute Shaders'],
      isOnline: true,
      followersCount: 342,
      isFollowing: false,
    },
    title: '100k GPU Particles with WGSL Compute Shaders in 3 Minutes',
    description: 'A breakdown of high-performance particle velocity ping-pong buffers using WebGPU storage buffers and ping-pong render passes.',
    content: `In this walkthrough, we bypass CPU bottlenecking by driving 100,000 particles entirely on the GPU compute pass.

1. Allocate ping-pong storage buffers with GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST.
2. Bind the previous position buffer as read-only and next position buffer as read-write in the compute bind group.
3. Apply Curl Noise directly in the compute shader to generate organic vector flow fields with zero main-thread hitching.`,
    duration: '02:45',
    type: 'code_walkthrough',
    previewMedia: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    likes: 48,
    isLiked: false,
    savesCount: 19,
    isSaved: false,
    sharesCount: 12,
    views: 620,
    commentsCount: 6,
    createdAt: '2 hours ago',
    tags: ['WebGPU', 'WGSL', 'Shaders', 'Compute', 'Performance'],
    codeSnippet: {
      language: 'wgsl',
      filename: 'particle_compute.wgsl',
      code: `@group(0) @binding(0) var<storage, read> posIn: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read_write> posOut: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let index = id.x;
    if (index >= arrayLength(&posIn)) { return; }
    
    var pos = posIn[index].xyz;
    let vel = curlNoise(pos * 0.15) * 0.02;
    pos = pos + vel;
    
    posOut[index] = vec4<f32>(pos, 1.0);
}`
    }
  },
  {
    id: 'flow_dsp_karplus',
    author: {
      id: 'creator_kai',
      name: 'Kai Tanaka',
      username: 'kaidsp',
      roleTitle: 'DSP & Audio Architect',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Procedural audio engines and physical modeling in Web Audio API.',
      skills: ['WebAudio', 'AudioWorklet', 'C++', 'DSP'],
      isOnline: true,
      followersCount: 218,
      isFollowing: false,
    },
    title: 'Physical Acoustic Modeling with Karplus-Strong Algorithm',
    description: 'How to synthesize plucked acoustic guitar strings in real time using a feedback delay loop with low-pass damping in an AudioWorkletProcessor.',
    content: `Karplus-Strong creates convincing physical string models by exciting a delay line with white noise and feeding it back through an averaging filter.

1. Generate an initial burst of noise equal to the period length (SampleRate / Frequency).
2. On each cycle, average adjacent samples: y[n] = 0.5 * (x[n] + x[n-1]) * decay.
3. This creates natural high-frequency dampening identical to vibrating nylon or steel strings.`,
    duration: '03:10',
    type: 'sound_design',
    previewMedia: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    likes: 62,
    isLiked: false,
    savesCount: 31,
    isSaved: false,
    sharesCount: 17,
    views: 890,
    commentsCount: 9,
    createdAt: '5 hours ago',
    tags: ['WebAudio', 'AudioWorklet', 'PhysicalModeling', 'DSP', 'Synthesis'],
    codeSnippet: {
      language: 'javascript',
      filename: 'KarplusProcessor.js',
      code: `class KarplusStrongProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const output = outputs[0][0];
    for (let i = 0; i < output.length; ++i) {
      const delayed = this.buffer[this.readPtr];
      const filtered = 0.5 * (delayed + this.lastSample) * 0.992;
      this.lastSample = filtered;
      this.buffer[this.writePtr] = filtered;
      output[i] = filtered;
      this.readPtr = (this.readPtr + 1) % this.buffer.length;
      this.writePtr = (this.writePtr + 1) % this.buffer.length;
    }
    return true;
  }
}`
    }
  },
  {
    id: 'flow_spring_physics',
    author: {
      id: 'creator_maya',
      name: 'Maya Lin',
      username: 'mayamotion',
      roleTitle: 'Creative UI & Physics Developer',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      bio: 'Crafting fluid UI gesture physics and mathematical transitions.',
      skills: ['Canvas2D', 'Spring Physics', 'TypeScript', 'Motion'],
      isOnline: true,
      followersCount: 405,
      isFollowing: true,
    },
    title: 'Runge-Kutta 4 (RK4) Spring Integrator for Tactile Gestures',
    description: 'Replacing standard Euler integration with RK4 to eliminate velocity drift and oscillation explosions during high-frequency gesture dragging.',
    content: `Euler integration (pos += vel * dt) rapidly accumulates floating-point energy during stiff springs (tension > 500). RK4 evaluates velocity derivatives at 4 checkpoints per tick.

Result: Zero overshooting instability even with ultra-snappy micro-animations and zero frame drops on 120Hz ProMotion displays.`,
    duration: '01:50',
    type: 'ui_prototype',
    previewMedia: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    likes: 85,
    isLiked: true,
    savesCount: 44,
    isSaved: true,
    sharesCount: 28,
    views: 1140,
    commentsCount: 14,
    createdAt: 'Yesterday',
    tags: ['Physics', 'Animation', 'RK4', 'Motion', 'Math'],
    codeSnippet: {
      language: 'typescript',
      filename: 'rk4Spring.ts',
      code: `export function rk4Step(state: SpringState, target: number, k: number, c: number, dt: number) {
  const evaluate = (s: SpringState, dtStep: number, d: Derivative): Derivative => {
    const p = s.position + d.dx * dtStep;
    const v = s.velocity + d.dv * dtStep;
    const force = -k * (p - target) - c * v;
    return { dx: v, dv: force };
  };

  const a = evaluate(state, 0, { dx: 0, dv: 0 });
  const b = evaluate(state, dt * 0.5, a);
  const cDeriv = evaluate(state, dt * 0.5, b);
  const d = evaluate(state, dt, cDeriv);

  state.position += (dt / 6) * (a.dx + 2 * (b.dx + cDeriv.dx) + d.dx);
  state.velocity += (dt / 6) * (a.dv + 2 * (b.dv + cDeriv.dv) + d.dv);
}`
    }
  },
  {
    id: 'flow_zk_merkle',
    author: {
      id: 'creator_devon',
      name: 'Devon Thorne',
      username: 'devonzk',
      roleTitle: 'Cryptographic Systems Engineer',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      bio: 'Building SNARK verifiers, Poseidon hashing, and anonymous credentials.',
      skills: ['Circom', 'Rust', 'ZK-SNARKs', 'Cryptography'],
      isOnline: false,
      followersCount: 167,
      isFollowing: false,
    },
    title: 'Zero-Knowledge Merkle Membership in 42 Constraints',
    description: 'Optimizing Poseidon sponge hash rounds to verify tree inclusion proofs inside Circom circuits with minimal prover time.',
    content: `Traditional SHA-256 inside SNARKs consumes ~25,000 R1CS constraints per block. Switching to Poseidon over the BN254 scalar field reduces this to under 240 constraints per level!

In this breakdown, see the exact circuit architecture to prove you belong to a verified creator pool without revealing your address or identity.`,
    duration: '03:45',
    type: 'build_in_public',
    previewMedia: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
    likes: 39,
    isLiked: false,
    savesCount: 22,
    isSaved: false,
    sharesCount: 9,
    views: 530,
    commentsCount: 4,
    createdAt: '2 days ago',
    tags: ['ZeroKnowledge', 'Circom', 'Cryptography', 'Privacy'],
    codeSnippet: {
      language: 'circom',
      filename: 'merkle_proof.circom',
      code: `template MerkleInclusionProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    signal currentHash[levels + 1];
    currentHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== currentHash[i] + pathIndices[i] * (pathElements[i] - currentHash[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (currentHash[i] - pathElements[i]);
        currentHash[i + 1] <== hashers[i].out;
    }
    root <== currentHash[levels];
}`
    }
  }
];

const BOT_IDS = new Set([
  'user_maya',
  'user_kenji',
  'user_elena',
  'user_liam',
  'user_sora',
  'user_aria',
  'user_marcus',
]);

class Database {
  private state: DatabaseState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Filter out any legacy bot accounts
        const realUsers: User[] = (parsed.users || []).filter(
          (u: User) => !BOT_IDS.has(u.id) && !u.isDemo
        );

        // Filter out posts created by bots
        const realPosts: Post[] = (parsed.posts || []).filter(
          (p: Post) => p.author && !BOT_IDS.has(p.author.id) && !p.author.isDemo
        );

        const realCurrentUser: User | null =
          parsed.currentUser && !BOT_IDS.has(parsed.currentUser.id) && !parsed.currentUser.isDemo
            ? parsed.currentUser
            : realUsers.length > 0
            ? realUsers[realUsers.length - 1]
            : null;

        const initialConversations: ChatConversation[] =
          parsed.conversations && parsed.conversations.length > 0
            ? parsed.conversations
            : DEFAULT_CONVERSATIONS;

        const initialMessages: Record<string, ChatMessage[]> = {
          ...DEFAULT_MESSAGES,
          ...(parsed.messages || {}),
        };

        const initialNotifications: TsunaNotification[] =
          parsed.notifications && Array.isArray(parsed.notifications)
            ? parsed.notifications
            : DEFAULT_NOTIFICATIONS;

        const state: DatabaseState = {
          currentUser: realCurrentUser,
          users: realUsers,
          communities: parsed.communities && parsed.communities.length > 0 ? parsed.communities : DEFAULT_COMMUNITIES,
          posts: realPosts,
          comments: parsed.comments || {},
          conversations: initialConversations,
          messages: initialMessages,
          events: parsed.events || [],
          submissions: parsed.submissions || {},
          voiceRooms: [],
          flows: parsed.flows && parsed.flows.length > 0 ? parsed.flows : DEFAULT_FLOWS,
          notifications: initialNotifications,
          questions: parsed.questions || {},
          questionAnswers: parsed.questionAnswers || {},
        };
        this.persist(state);
        return state;
      }
    } catch (err) {
      console.warn('Could not load persistent state, falling back to clean initial state:', err);
    }

    const initial: DatabaseState = {
      currentUser: null,
      users: [],
      communities: DEFAULT_COMMUNITIES,
      posts: [],
      comments: {},
      conversations: DEFAULT_CONVERSATIONS,
      messages: DEFAULT_MESSAGES,
      events: [],
      submissions: {},
      voiceRooms: [],
      flows: DEFAULT_FLOWS,
      notifications: DEFAULT_NOTIFICATIONS,
      questions: {},
      questionAnswers: {},
    };
    this.persist(initial);
    return initial;
  }

  private persist(state: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write persistent data file:', err);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public save() {
    this.persist(this.state);
  }

  public resetDemo() {
    const fresh: DatabaseState = {
      currentUser: null,
      users: [],
      communities: DEFAULT_COMMUNITIES,
      posts: [],
      comments: {},
      conversations: DEFAULT_CONVERSATIONS,
      messages: DEFAULT_MESSAGES,
      events: [],
      submissions: {},
      voiceRooms: [],
      flows: DEFAULT_FLOWS,
      notifications: DEFAULT_NOTIFICATIONS,
      questions: {},
      questionAnswers: {},
    };
    this.state = fresh;
    this.save();
    return fresh;
  }

  public getStats(): ActiveStats {
    const realUsersCount = this.state.users.length;
    return {
      onlineCreators: realUsersCount,
      activeBuildingSessions: this.state.posts.length,
      liveVoiceRooms: 0,
      upcomingEvents: 0,
    };
  }
}

export const db = new Database();
