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
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HyperCraft&backgroundColor=b6e3f4,c0aede',
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
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SynthWave&backgroundColor=ffd5dc,ffdfbf',
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
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=DesignSystems&backgroundColor=d1d4f9,c0aede',
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
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ZeroKnowledge&backgroundColor=c0aede,b6e3f4',
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
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Founders&backgroundColor=ffd5dc,c0aede',
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
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=HyperCraft&backgroundColor=b6e3f4,c0aede',
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
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=SynthWave&backgroundColor=ffd5dc,ffdfbf',
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
    avatar: 'https://api.dicebear.com/7.x/micah/svg?seed=DesignSystems&backgroundColor=d1d4f9,c0aede',
    members: [],
    unreadCount: 0,
    backgroundTheme: 'default',
  },
];

const DEFAULT_MESSAGES: Record<string, ChatMessage[]> = {};

const DEFAULT_NOTIFICATIONS: TsunaNotification[] = [];

const DEFAULT_FLOWS: Flow[] = [];

const BOT_IDS = new Set([
  "user_maya",
  "user_kenji",
  "user_elena",
  "user_liam",
  "user_sora",
  "user_aria",
  "user_marcus",
  "creator_elena",
  "creator_kai",
  "creator_maya",
  "creator_devon",
  "usr_sarah",
  "usr_marcus_v",
  "usr_guest",
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

        const realFlows: Flow[] = (parsed.flows || []).filter(
          (f: Flow) => f.author && !BOT_IDS.has(f.author.id)
        );

        const cleanComments: Record<string, Comment[]> = {};
        if (parsed.comments) {
          for (const [postId, commentList] of Object.entries(parsed.comments as Record<string, Comment[]>)) {
            cleanComments[postId] = (commentList || []).filter(
              (c: Comment) => c.author && !BOT_IDS.has(c.author.id)
            );
          }
        }

        const state: DatabaseState = {
          currentUser: realCurrentUser,
          users: realUsers,
          communities: parsed.communities && parsed.communities.length > 0 ? parsed.communities : DEFAULT_COMMUNITIES,
          posts: realPosts,
          comments: cleanComments,
          conversations: initialConversations,
          messages: initialMessages,
          events: parsed.events || [],
          submissions: parsed.submissions || {},
          voiceRooms: [],
          flows: realFlows,
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
