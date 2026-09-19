export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  banner?: string;
  bio: string;
  roleTitle: string; // e.g., "Graphics Engineer & Shader Artist"
  location?: string;
  timezone?: string;
  customStatus?: string; // e.g. "Building WebGPU fluid simulation"
  statusEmoji?: string; // e.g. "⚡"
  availability?: 'available' | 'busy' | 'stealth' | 'mentoring';
  pronouns?: string; // e.g. "they/them"
  skills: string[];
  links?: {
    github?: string;
    website?: string;
    twitter?: string;
    discord?: string;
    linkedin?: string;
  };
  externalAccounts?: {
    github?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
  };
  isOnline: boolean;
  isDemo?: boolean;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  followingIds?: string[];
  savedFlowIds?: string[];
}

export type CommunityRole = 'Owner' | 'Admin' | 'Moderator' | 'Member';

export interface CommunityMember {
  user: User;
  role: CommunityRole;
  joinedAt: string;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  avatar: string;
  banner: string;
  category: 'Engineering' | 'Audio & Sound' | 'Design & 3D' | 'Creative Tech' | 'Open Source';
  membersCount: number;
  activeBuildingCount: number;
  tags: string[];
  isJoined?: boolean;
  currentUserRole?: CommunityRole;
}

export type PostType = 'general' | 'code' | 'file' | 'showcase' | 'event_invite' | 'media' | 'link';

export interface PostAttachment {
  name: string;
  size: string;
  type: string; // 'pdf' | 'zip' | 'image' | 'model' | 'other'
  url: string;
}

export interface PostCodeSnippet {
  language: string;
  code: string;
  filename?: string;
}

export interface PostLinkPreview {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
}

export interface PostEventInvite {
  eventId: string;
  eventTitle: string;
  eventType: string;
  startTime: string;
  communityName?: string;
  description?: string;
}

export interface PostGroupInvite {
  communityId: string;
  communityName: string;
  category?: string;
  membersCount?: number;
  avatar?: string;
  tagline?: string;
}

export interface Post {
  id: string;
  author: User;
  communityId?: string;
  communityName?: string;
  communityOnly?: boolean; // When true, post is strictly visible only in this community
  title: string;
  content: string;
  postType: PostType;
  codeSnippet?: PostCodeSnippet;
  attachment?: PostAttachment;
  image?: string;
  linkPreview?: PostLinkPreview;
  gifUrl?: string;
  videoUrl?: string;
  eventInvite?: PostEventInvite;
  groupInvite?: PostGroupInvite;
  likes: number;
  isLiked: boolean;
  commentsCount: number;
  createdAt: string;
  tags: string[];
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  codeSnippet?: PostCodeSnippet;
  replies?: Comment[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: Partial<User> & { id: string; name: string; avatar?: string; username?: string };
  text: string;
  codeSnippet?: PostCodeSnippet;
  attachment?: PostAttachment;
  image?: string;
  timestamp: string;
  reactions: { emoji: string; count: number; users: string[] }[];
}

export interface ChatConversation {
  id: string;
  type: 'group' | 'direct';
  name: string;
  avatar?: string;
  communityId?: string;
  communityName?: string;
  members: User[];
  lastMessage?: {
    text: string;
    timestamp: string;
    senderName: string;
  };
  unreadCount?: number;
  backgroundTheme?: 'default' | 'obsidian' | 'charcoal' | 'mono-grid' | 'warm-dark';
}

export type EventType = 'voice_room' | 'video_meeting' | 'competition' | 'submission';

export interface EventFileAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount?: number;
  description?: string;
}

export interface EventSubmission {
  id: string;
  eventId: string;
  author: User;
  title: string;
  description: string;
  mediaType: 'code' | 'image' | 'audio' | 'project' | 'file';
  mediaUrl?: string;
  codeSnippet?: PostCodeSnippet;
  files?: EventFileAttachment[];
  votes: number;
  hasVoted?: boolean;
  createdAt: string;
  submittedAt?: string;
}

export interface TsunaEvent {
  id: string;
  communityId: string;
  communityName: string;
  title: string;
  description: string;
  type: EventType;
  startTime: string;
  startDate?: string;
  endTime?: string;
  host: User;
  status: 'live' | 'upcoming' | 'ended';
  participantsCount: number;
  submissionsCount?: number;
  isJoined?: boolean;
  submissionsPrompt?: string;
  files?: EventFileAttachment[];
}

export interface VoiceParticipant {
  user: User;
  isSpeaking: boolean;
  isMuted: boolean;
  joinedAt: string;
}

export interface VoiceRoom {
  id: string;
  title: string;
  communityId: string;
  communityName: string;
  host: User;
  participants: VoiceParticipant[];
  isLive: boolean;
}

export interface Flow {
  id: string;
  author: User;
  creator?: User;
  title: string;
  description: string;
  content?: string;
  duration: string; // e.g. "02:14"
  type: 'code_walkthrough' | 'build_in_public' | 'sound_design' | 'ui_prototype';
  codeSnippet?: PostCodeSnippet;
  previewMedia?: string;
  videoUrl?: string;
  likes: number;
  isLiked: boolean;
  likedBy?: string[];
  savesCount: number;
  isSaved: boolean;
  savedBy?: string[];
  sharesCount: number;
  views: number;
  commentsCount: number;
  createdAt: string;
  tags: string[];
}

export interface ActiveStats {
  onlineCreators: number;
  activeBuildingSessions: number;
  liveVoiceRooms: number;
  upcomingEvents: number;
}

export interface TsunaNotification {
  id: string;
  type: 'reply' | 'comment' | 'reaction' | 'mention' | 'event' | 'collab' | 'system' | 'message';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
  linkId?: string;
  actor?: {
    name: string;
    avatar?: string;
    username?: string;
  };
}

export interface QuestionAnswer {
  id: string;
  questionId: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    roleTitle?: string;
  };
  isAnonymous: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
}

export interface CommunityQuestion {
  id: string;
  communityId: string;
  title: string;
  details?: string;
  tags?: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    roleTitle?: string;
  };
  isAnonymous: boolean;
  upvotes: number;
  upvotedBy: string[];
  answersCount: number;
  isResolved?: boolean;
  createdAt: string;
  answers?: QuestionAnswer[];
}
