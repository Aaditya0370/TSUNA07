import { GoogleGenAI } from '@google/genai';
import { Post, User } from '../src/types';
import { ELABORATE_50_FEED_PREFERENCES, FeedPreference } from '../src/data/feedPreferences';

// Lazy Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI client:', e);
    }
  }
  return aiClient;
}

export interface FeedRankParams {
  posts: Post[];
  currentUser: User | null;
  mode?: 'for_you' | 'following' | 'latest';
  activePreferences?: string[];
  feedTuning?: {
    codeWeight?: number;
    mediaWeight?: number;
    discussionWeight?: number;
    exploreVsFollowing?: 'balanced' | 'mostly_following' | 'mostly_explore';
    boostedTags?: string[];
    penalizedTags?: string[];
  };
}

export interface RankedPost extends Post {
  aiMatchScore: number;
  aiReason: string;
  matchedPreferences: string[];
  authorMutualsCount: number;
  transparencySignals: {
    preferenceBonus: number;
    formatBonus: number;
    socialBonus: number;
    engagementBonus: number;
    explanation: string[];
  };
}

export interface CreatorSuggestion {
  user: User;
  matchScore: number;
  mutualsCount: number;
  matchedTopics: string[];
  reason: string;
}

/**
 * Maps preference IDs to fast lookup objects
 */
const PREF_MAP = new Map<string, FeedPreference>();
ELABORATE_50_FEED_PREFERENCES.forEach((p) => PREF_MAP.set(p.id, p));

/**
 * Computes mutual follow connections between two users
 */
export function computeMutualConnections(userA: User | null, userB: User | null, allUsers: User[]): number {
  if (!userA || !userB || userA.id === userB.id) return 0;
  const followingA = new Set(userA.followingIds || []);
  const followingB = new Set(userB.followingIds || []);

  let mutuals = 0;
  for (const id of followingA) {
    if (followingB.has(id)) {
      mutuals++;
    }
  }
  return mutuals;
}

/**
 * Core Instagram/Facebook-style multi-signal feed ranker
 */
export async function rankFeed(params: FeedRankParams, allUsers: User[] = []): Promise<RankedPost[]> {
  const { posts, currentUser, mode = 'for_you' } = params;

  const userPrefs = params.activePreferences || currentUser?.preferences || [];
  const tuning = params.feedTuning || currentUser?.feedTuning || {
    codeWeight: 80,
    mediaWeight: 75,
    discussionWeight: 65,
    boostedTags: [],
    penalizedTags: [],
  };

  const boostedSet = new Set((tuning.boostedTags || []).map((t) => t.toLowerCase()));
  const penalizedSet = new Set((tuning.penalizedTags || []).map((t) => t.toLowerCase()));
  const followingSet = new Set(currentUser?.followingIds || []);

  // Prepare preference keywords
  const selectedPrefObjects = userPrefs.map((id) => PREF_MAP.get(id)).filter(Boolean) as FeedPreference[];

  const ranked: RankedPost[] = posts.map((post) => {
    let score = 50; // baseline score
    const explanations: string[] = [];
    const matchedPrefNames: string[] = [];

    // 1. Social Graph & Mutual Connections
    const isFollowed = post.author ? followingSet.has(post.author.id) : false;
    let socialBonus = 0;
    if (isFollowed) {
      socialBonus += 35;
      explanations.push('You follow this creator');
    }

    const mutuals = post.author ? computeMutualConnections(currentUser, post.author, allUsers) : 0;
    if (mutuals > 0) {
      socialBonus += Math.min(mutuals * 6, 20);
      explanations.push(`${mutuals} mutual connection${mutuals > 1 ? 's' : ''}`);
    }

    // 2. 50 Preferences Topic Affinity
    let prefScore = 0;
    const postSearchable = [
      post.title || '',
      post.content || '',
      ...(post.tags || []),
      post.codeSnippet?.language || '',
      post.codeSnippet?.filename || '',
    ].join(' ').toLowerCase();

    for (const pref of selectedPrefObjects) {
      let prefMatched = false;
      // Tag matching
      for (const tag of pref.tags) {
        if (postSearchable.includes(tag.toLowerCase())) {
          prefScore += 12;
          prefMatched = true;
        }
      }
      if (prefMatched) {
        matchedPrefNames.push(pref.label);
      }
    }

    const uniqueMatchedPrefs = Array.from(new Set(matchedPrefNames));
    if (uniqueMatchedPrefs.length > 0) {
      explanations.push(`Matched preferences: ${uniqueMatchedPrefs.slice(0, 2).join(', ')}`);
    }

    // 3. Format Tuning (Instagram/Facebook format affinity)
    let formatBonus = 0;
    if (post.codeSnippet) {
      formatBonus += ((tuning.codeWeight ?? 80) - 50) * 0.4;
      if ((tuning.codeWeight ?? 80) > 70) {
        explanations.push('High code snippet affinity');
      }
    }
    if (post.attachment || post.videoUrl) {
      formatBonus += ((tuning.mediaWeight ?? 75) - 50) * 0.35;
    }
    if (!post.codeSnippet && !post.attachment && !post.videoUrl) {
      formatBonus += ((tuning.discussionWeight ?? 65) - 50) * 0.3;
    }

    // 4. Boosted & Penalized Tags (User feedback loop)
    let feedbackAdjustment = 0;
    if (post.tags) {
      for (const tag of post.tags) {
        const lower = tag.toLowerCase();
        if (boostedSet.has(lower)) {
          feedbackAdjustment += 25;
          explanations.push(`Boosted topic: #${tag}`);
        }
        if (penalizedSet.has(lower)) {
          feedbackAdjustment -= 40;
          explanations.push(`Reduced topic: #${tag}`);
        }
      }
    }

    // 5. Engagement Velocity (Likes & comments weight)
    const engagementBonus = Math.min((post.likes || 0) * 0.5 + (post.commentsCount || 0) * 1.5, 15);

    // Composite calculation (0 to 100 clamped)
    const rawScore = score + prefScore + socialBonus + formatBonus + feedbackAdjustment + engagementBonus;
    const finalScore = Math.max(15, Math.min(99, Math.round(rawScore)));

    // AI Reason summary
    let reasonSummary = '';
    if (uniqueMatchedPrefs.length > 0) {
      reasonSummary = `${finalScore}% Match • Curated for your interest in ${uniqueMatchedPrefs[0]}`;
      if (uniqueMatchedPrefs.length > 1) {
        reasonSummary += ` & ${uniqueMatchedPrefs[1]}`;
      }
    } else if (isFollowed) {
      reasonSummary = `${finalScore}% Match • From creator you follow`;
    } else if (mutuals > 0) {
      reasonSummary = `${finalScore}% Match • Connected via ${mutuals} mutual${mutuals > 1 ? 's' : ''}`;
    } else {
      reasonSummary = `${finalScore}% Match • Recommended for explore`;
    }

    return {
      ...post,
      aiMatchScore: finalScore,
      aiReason: reasonSummary,
      matchedPreferences: uniqueMatchedPrefs,
      authorMutualsCount: mutuals,
      transparencySignals: {
        preferenceBonus: Math.round(prefScore),
        formatBonus: Math.round(formatBonus),
        socialBonus: Math.round(socialBonus),
        engagementBonus: Math.round(engagementBonus),
        explanation: explanations.length > 0 ? explanations : ['Recommended based on community engagement'],
      },
    };
  });

  // Sort according to feed mode
  if (mode === 'following') {
    return ranked
      .filter((p) => p.author && followingSet.has(p.author.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  if (mode === 'latest') {
    return ranked.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 'for_you': Sort by AI match score descending, with slight recency tie-breaker
  return ranked.sort((a, b) => {
    if (b.aiMatchScore !== a.aiMatchScore) {
      return b.aiMatchScore - a.aiMatchScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Computes creator follow recommendations based on preferences & mutuals
 */
export function getCreatorSuggestions(
  currentUser: User | null,
  allUsers: User[],
  userPosts: Post[] = []
): CreatorSuggestion[] {
  if (!currentUser) {
    // If guest, return active creators with basic scoring
    return allUsers
      .filter((u) => !u.isDemo)
      .slice(0, 8)
      .map((u) => ({
        user: u,
        matchScore: 85,
        mutualsCount: 0,
        matchedTopics: u.skills || ['Creator'],
        reason: 'Trending creator in the Tsuna ecosystem',
      }));
  }

  const followingSet = new Set(currentUser.followingIds || []);
  const userPrefs = currentUser.preferences || [];
  const selectedPrefObjects = userPrefs.map((id) => PREF_MAP.get(id)).filter(Boolean) as FeedPreference[];

  // Flatten all tags the user cares about
  const userInterestTags = new Set<string>();
  selectedPrefObjects.forEach((pref) => {
    pref.tags.forEach((tag) => userInterestTags.add(tag.toLowerCase()));
  });

  const suggestions: CreatorSuggestion[] = [];

  for (const candidate of allUsers) {
    // Exclude self and already followed
    if (candidate.id === currentUser.id || followingSet.has(candidate.id) || candidate.isDemo) {
      continue;
    }

    // Mutuals count
    const mutuals = computeMutualConnections(currentUser, candidate, allUsers);

    // Topic & Skill overlap
    const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase());
    const candidateBio = (candidate.bio || '').toLowerCase();
    const candidateRole = (candidate.roleTitle || '').toLowerCase();

    const matchedTopics: string[] = [];
    let overlapScore = 0;

    for (const pref of selectedPrefObjects) {
      let prefMatched = false;
      for (const tag of pref.tags) {
        const lowerTag = tag.toLowerCase();
        if (candidateSkills.includes(lowerTag) || candidateBio.includes(lowerTag) || candidateRole.includes(lowerTag)) {
          overlapScore += 18;
          prefMatched = true;
        }
      }
      if (prefMatched) {
        matchedTopics.push(pref.label);
      }
    }

    // Candidate posts topic analysis
    const candidatePosts = userPosts.filter((p) => p.author?.id === candidate.id);
    for (const post of candidatePosts) {
      if (post.tags) {
        for (const t of post.tags) {
          if (userInterestTags.has(t.toLowerCase())) {
            overlapScore += 8;
          }
        }
      }
    }

    // Base score + mutuals bonus + topic overlap
    const mutualScore = mutuals * 15;
    const compositeScore = Math.max(60, Math.min(99, Math.round(55 + overlapScore + mutualScore)));

    const uniqueTopics = Array.from(new Set(matchedTopics));

    let reason = '';
    if (uniqueTopics.length > 0 && mutuals > 0) {
      reason = `${mutuals} mutual connection${mutuals > 1 ? 's' : ''} • Shares ${uniqueTopics[0]}`;
    } else if (mutuals > 0) {
      reason = `${mutuals} mutual connection${mutuals > 1 ? 's' : ''} in common`;
    } else if (uniqueTopics.length > 0) {
      reason = `Expert in ${uniqueTopics.slice(0, 2).join(' & ')}`;
    } else {
      reason = candidate.roleTitle || 'Active builder on Tsuna';
    }

    suggestions.push({
      user: candidate,
      matchScore: compositeScore,
      mutualsCount: mutuals,
      matchedTopics: uniqueTopics.length > 0 ? uniqueTopics : (candidate.skills || ['Creator']),
      reason,
    });
  }

  // Sort by match score descending
  return suggestions.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
}

/**
 * Searches user profiles matching query with mutuals calculation
 */
export function searchUserProfiles(
  query: string,
  currentUser: User | null,
  allUsers: User[]
): { user: User; mutualsCount: number; isFollowing: boolean; matchHighlights: string[] }[] {
  const cleanQ = (query || '').trim().toLowerCase();
  if (!cleanQ) return [];

  const followingSet = new Set(currentUser?.followingIds || []);

  const results = allUsers
    .filter((u) => !u.isDemo && u.id !== currentUser?.id)
    .filter((u) => {
      const name = (u.name || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const bio = (u.bio || '').toLowerCase();
      const role = (u.roleTitle || '').toLowerCase();
      const skills = (u.skills || []).map((s) => s.toLowerCase()).join(' ');

      return (
        name.includes(cleanQ) ||
        username.includes(cleanQ) ||
        bio.includes(cleanQ) ||
        role.includes(cleanQ) ||
        skills.includes(cleanQ)
      );
    })
    .map((u) => {
      const mutuals = computeMutualConnections(currentUser, u, allUsers);
      const highlights: string[] = [];
      if (u.username.toLowerCase().includes(cleanQ)) highlights.push(`@${u.username}`);
      if (u.roleTitle && u.roleTitle.toLowerCase().includes(cleanQ)) highlights.push(u.roleTitle);
      (u.skills || []).forEach((s) => {
        if (s.toLowerCase().includes(cleanQ)) highlights.push(s);
      });

      return {
        user: u,
        mutualsCount: mutuals,
        isFollowing: followingSet.has(u.id),
        matchHighlights: highlights,
      };
    });

  return results.slice(0, 15);
}
