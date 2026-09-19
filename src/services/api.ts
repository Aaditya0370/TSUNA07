import {
  User,
  Community,
  Post,
  Comment,
  ChatConversation,
  ChatMessage,
  TsunaEvent,
  EventSubmission,
  EventFileAttachment,
  VoiceRoom,
  Flow,
  ActiveStats,
  TsunaNotification,
  CommunityQuestion,
  QuestionAnswer,
} from '../types';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => fetchJSON<ActiveStats>('/api/stats'),

  // Auth & Registration
  getMe: () => fetchJSON<User | null>('/api/auth/me'),
  getCurrentUser: () => fetchJSON<User | null>('/api/auth/me'),
  register: (data: {
    name: string;
    username: string;
    bio?: string;
    roleTitle?: string;
    skills?: string[];
    email?: string;
    avatar?: string;
  }) =>
    fetchJSON<{ success: boolean; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  syncLocalUser: (user: User) =>
    fetchJSON<{ success: boolean; user: User }>('/api/auth/sync-local-user', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  sendEmailOtp: (email: string) =>
    fetchJSON<{ success: boolean; message: string; codePreview?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyEmailOtp: (email: string, otp: string, displayName?: string) =>
    fetchJSON<{ success: boolean; user: User; message: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, displayName }),
    }),
  syncFirebaseUser: (user: User) =>
    fetchJSON<{ success: boolean; user: User }>('/api/auth/sync-firebase-user', {
      method: 'POST',
      body: JSON.stringify({ user }),
    }),
  switchDemo: (userId: string) =>
    fetchJSON<User>('/api/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  switchUser: (userId: string) =>
    fetchJSON<User>('/api/auth/switch-demo', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  login: (username: string) =>
    fetchJSON<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  signup: (data: { name: string; username: string; bio: string; roleTitle: string; skills: string[] }) =>
    fetchJSON<User>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  logout: () => fetchJSON<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  resetDemo: () => fetchJSON<{ success: boolean; currentUser: User }>('/api/reset-demo', { method: 'POST' }),

  // Creator Landing by Handle & Device Verification
  getUserByHandle: (handle: string) =>
    fetchJSON<{
      exists: boolean;
      user?: User;
      hasEmail?: boolean;
      maskedEmail?: string;
      isDeviceAuthenticated?: boolean;
      posts?: Post[];
      flows?: Flow[];
      communities?: Community[];
      handle?: string;
      message?: string;
    }>(`/api/users/by-handle/${encodeURIComponent(handle)}`),

  sendDeviceOtp: (handle: string, email?: string) =>
    fetchJSON<{
      success: boolean;
      destEmail: string;
      maskedEmail: string;
      codePreview?: string;
      message: string;
    }>('/api/auth/send-device-otp', {
      method: 'POST',
      body: JSON.stringify({ handle, email }),
    }),

  verifyDeviceOtp: (handle: string, otp: string, email?: string) =>
    fetchJSON<{
      success: boolean;
      user: User;
      message: string;
    }>('/api/auth/verify-device-otp', {
      method: 'POST',
      body: JSON.stringify({ handle, otp, email }),
    }),

  verifyDeviceGoogle: (handle: string, googleUser: { uid: string; email: string; name: string; photoURL?: string }) =>
    fetchJSON<{
      success: boolean;
      user: User;
      message: string;
    }>('/api/auth/verify-device-google', {
      method: 'POST',
      body: JSON.stringify({ handle, googleUser }),
    }),

  // Profile
  updateProfile: (updates: Partial<User>) =>
    fetchJSON<User>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Communities
  getCommunities: () => fetchJSON<Community[]>('/api/communities'),
  getCommunity: (id: string) => fetchJSON<{ community: Community; posts: Post[] }>(`/api/communities/${id}`),
  getCommunityChat: (id: string) => fetchJSON<{ conversation: ChatConversation; messages: ChatMessage[] }>(`/api/communities/${id}/chat`),
  createCommunity: (data: { name: string; tagline: string; description: string; category: string; tags: string[] }) =>
    fetchJSON<Community>('/api/communities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  joinCommunity: (id: string) => fetchJSON<Community>(`/api/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id: string) => fetchJSON<Community>(`/api/communities/${id}/leave`, { method: 'POST' }),

  // Community Questions (Q&A with anonymous support)
  getCommunityQuestions: (communityId: string) => fetchJSON<CommunityQuestion[]>(`/api/communities/${communityId}/questions`),
  createQuestion: (communityId: string, data: { title: string; details?: string; tags?: string[]; isAnonymous?: boolean }) =>
    fetchJSON<CommunityQuestion>(`/api/communities/${communityId}/questions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getQuestion: (questionId: string) => fetchJSON<CommunityQuestion>(`/api/questions/${questionId}`),
  addAnswer: (questionId: string, data: { content: string; isAnonymous?: boolean }) =>
    fetchJSON<QuestionAnswer>(`/api/questions/${questionId}/answers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleUpvoteQuestion: (questionId: string) =>
    fetchJSON<CommunityQuestion>(`/api/questions/${questionId}/upvote`, { method: 'POST' }),
  toggleUpvoteAnswer: (questionId: string, answerId: string) =>
    fetchJSON<QuestionAnswer>(`/api/questions/${questionId}/answers/${answerId}/upvote`, { method: 'POST' }),
  toggleResolveQuestion: (questionId: string) =>
    fetchJSON<CommunityQuestion>(`/api/questions/${questionId}/resolve`, { method: 'POST' }),

  // Posts
  getPosts: (communityId?: string, search?: string) => {
    const params = new URLSearchParams();
    if (communityId) params.append('communityId', communityId);
    if (search) params.append('search', search);
    const qs = params.toString();
    return fetchJSON<Post[]>(`/api/posts${qs ? `?${qs}` : ''}`);
  },
  createPost: (postData: Partial<Post>) =>
    fetchJSON<Post>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    }),
  toggleLikePost: (id: string) => fetchJSON<Post>(`/api/posts/${id}/like`, { method: 'POST' }),

  // Comments
  getComments: (postId: string) => fetchJSON<Comment[]>(`/api/posts/${postId}/comments`),
  addComment: (postId: string, content: string, codeSnippet?: { language: string; code: string }) =>
    fetchJSON<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, codeSnippet }),
    }),

  // Chats
  getConversations: () => fetchJSON<ChatConversation[]>('/api/chats'),
  getMessages: (conversationId: string) => fetchJSON<ChatMessage[]>(`/api/chats/${conversationId}/messages`),
  sendMessage: (
    conversationId: string,
    messageData: {
      text?: string;
      codeSnippet?: { language: string; code: string };
      attachment?: { name: string; size: string; type: string; url: string };
      image?: string;
    }
  ) =>
    fetchJSON<ChatMessage>(`/api/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
  updateChatTheme: (conversationId: string, backgroundTheme: string) =>
    fetchJSON<ChatConversation>(`/api/chats/${conversationId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify({ backgroundTheme }),
    }),
  markConversationRead: (conversationId: string) =>
    fetchJSON<{ success: boolean; conversation: ChatConversation }>(`/api/chats/${conversationId}/read`, {
      method: 'POST',
    }),
  markAllConversationsRead: () =>
    fetchJSON<{ success: boolean; count: number }>('/api/chats/read-all', {
      method: 'POST',
    }),

  // Notifications
  getNotifications: () => fetchJSON<TsunaNotification[]>('/api/notifications'),
  markNotificationRead: (id: string) =>
    fetchJSON<{ success: boolean; notification: TsunaNotification }>(`/api/notifications/${id}/read`, {
      method: 'POST',
    }),
  markAllNotificationsRead: () =>
    fetchJSON<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST',
    }),
  simulateNotification: () =>
    fetchJSON<TsunaNotification>('/api/notifications/simulate', {
      method: 'POST',
    }),

  // Events & Submissions
  getEvents: () => fetchJSON<TsunaEvent[]>('/api/events'),
  createEvent: (eventData: Partial<TsunaEvent>) =>
    fetchJSON<TsunaEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),
  toggleJoinEvent: (id: string) => fetchJSON<TsunaEvent>(`/api/events/${id}/join`, { method: 'POST' }),
  joinEvent: (id: string) => fetchJSON<TsunaEvent>(`/api/events/${id}/join`, { method: 'POST' }),
  
  // Event Files & Resources
  getEventFiles: (eventId: string) => fetchJSON<EventFileAttachment[]>(`/api/events/${eventId}/files`),
  uploadEventFile: (eventId: string, fileData: Partial<EventFileAttachment>) =>
    fetchJSON<EventFileAttachment>(`/api/events/${eventId}/files`, {
      method: 'POST',
      body: JSON.stringify(fileData),
    }),
  deleteEventFile: (eventId: string, fileId: string) =>
    fetchJSON<{ success: boolean; message: string }>(`/api/events/${eventId}/files/${fileId}`, {
      method: 'DELETE',
    }),

  getSubmissions: (eventId: string) => fetchJSON<EventSubmission[]>(`/api/events/${eventId}/submissions`),
  createSubmission: (eventId: string, submissionData: Partial<EventSubmission>) =>
    fetchJSON<EventSubmission>(`/api/events/${eventId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    }),
  voteSubmission: (id: string) => fetchJSON<EventSubmission>(`/api/submissions/${id}/vote`, { method: 'POST' }),

  // Voice Rooms
  getVoiceRooms: () => fetchJSON<VoiceRoom[]>('/api/voice-rooms'),
  joinVoiceRoom: (roomId: string) =>
    fetchJSON<VoiceRoom>('/api/voice-rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    }),
  leaveVoiceRoom: (roomId: string) =>
    fetchJSON<{ success: boolean }>('/api/voice-rooms/leave', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    }),
  toggleMuteVoiceRoom: (roomId: string) =>
    fetchJSON<VoiceRoom>('/api/voice-rooms/toggle-mute', {
      method: 'POST',
      body: JSON.stringify({ roomId }),
    }),

  // Flows
  getFlows: () => fetchJSON<Flow[]>('/api/flows'),
  createFlow: (flowData: Partial<Flow>) =>
    fetchJSON<Flow>('/api/flows', {
      method: 'POST',
      body: JSON.stringify(flowData),
    }),
  toggleLikeFlow: (id: string) => fetchJSON<Flow>(`/api/flows/${id}/like`, { method: 'POST' }),
  toggleSaveFlow: (id: string) => fetchJSON<Flow>(`/api/flows/${id}/save`, { method: 'POST' }),
  trackFlowShare: (id: string) => fetchJSON<Flow>(`/api/flows/${id}/share`, { method: 'POST' }),
  toggleFollowUser: (userId: string) =>
    fetchJSON<{ success: boolean; isFollowing: boolean; followersCount: number; user: User }>(
      `/api/users/${userId}/follow`,
      { method: 'POST' }
    ),

  // Sharing System
  shareItem: (payload: {
    targetType: 'chat' | 'community';
    targetId: string;
    itemType: string;
    itemData: any;
    message?: string;
  }) =>
    fetchJSON<{ success: boolean; message: string }>('/api/share', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Search
  searchAll: (query: string, type: string = 'all') => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type) params.append('type', type);
    return fetchJSON<{
      communities: Community[];
      posts: Post[];
      events: TsunaEvent[];
      creators: User[];
    }>(`/api/search?${params.toString()}`);
  },
};
