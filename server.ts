import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { User, Post, Comment, ChatMessage, ChatConversation, TsunaEvent, EventSubmission, EventFileAttachment, VoiceRoom, Flow, Community, TsunaNotification, CommunityQuestion, QuestionAnswer } from './src/types';
import { rankFeed, getCreatorSuggestions, searchUserProfiles } from './server/feedAiRanker';
import { ELABORATE_50_FEED_PREFERENCES, FEED_CATEGORIES, PRESET_CURATIONS } from './src/data/feedPreferences';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // File and Image Upload Endpoint for Computer Uploads
  app.post('/api/upload', (req, res) => {
    try {
      const { name, type, size, dataUrl } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'Missing dataUrl payload' });
      }
      // Return file reference
      res.json({
        success: true,
        name: name || 'file',
        type: type || 'application/octet-stream',
        size: size || 'N/A',
        url: dataUrl,
      });
    } catch (err) {
      console.error('Upload handler error:', err);
      res.status(500).json({ error: 'Failed to process file upload' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'tsuna-platform', timestamp: new Date().toISOString() });
  });

  // Active Network Stats
  app.get('/api/stats', (req, res) => {
    res.json(db.getStats());
  });

  // Reset demo
  app.post('/api/reset-demo', (req, res) => {
    const fresh = db.resetDemo();
    res.json({ success: true, message: 'Tsuna demo state reset to pristine seed', currentUser: fresh.currentUser });
  });

  // Brevo API Configuration & In-Memory OTP Store
  const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
  const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'adigamerz1277@gmail.com';
  const BREVO_SENDER_NAME = 'Tsuna Platform';

  interface OtpRecord {
    code: string;
    expiresAt: number;
    attempts: number;
    email: string;
  }
  const otpStore = new Map<string, OtpRecord>();

  // Periodically clean up expired OTPs (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [email, record] of otpStore.entries()) {
      if (record.expiresAt < now) {
        otpStore.delete(email);
      }
    }
  }, 5 * 60 * 1000);

  // Send Email OTP via Brevo
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email format' });
      }

      // Generate 6-digit numeric OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(normalizedEmail, {
        code,
        expiresAt,
        attempts: 0,
        email: normalizedEmail,
      });

      console.log(`[Brevo OTP] Generated OTP for ${normalizedEmail}: ${code} (Expires in 10m)`);

      if (!BREVO_API_KEY) {
        console.warn(`[Brevo OTP] BREVO_API_KEY not set. Using dev preview OTP for ${normalizedEmail}: ${code}`);
        return res.json({
          success: true,
          message: `A 6-digit verification code was prepared for ${normalizedEmail}. (Development code: ${code})`,
          codePreview: code,
        });
      }

      // Brevo Transactional Email Payload
      const emailBody = {
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL,
        },
        to: [
          {
            email: normalizedEmail,
          },
        ],
        subject: `Your Tsuna Verification Code: ${code}`,
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tsuna Verification Code</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 32px 16px;">
            <div style="max-width: 520px; margin: 0 auto; background-color: #121214; border: 1px solid #27272a; border-radius: 16px; padding: 36px 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
              <div style="text-align: center; border-bottom: 1px solid #27272a; padding-bottom: 24px; margin-bottom: 24px;">
                <div style="font-size: 22px; font-weight: 800; letter-spacing: 2px; color: #ffffff;">TSUNA</div>
                <div style="font-size: 11px; color: #10b981; font-family: monospace; margin-top: 4px; letter-spacing: 1px;">CREATIVE TECHNOLOGIST & BUILDER NETWORK</div>
              </div>
              <div style="font-size: 17px; font-weight: 600; color: #ffffff; margin-bottom: 10px;">Verification Code</div>
              <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px;">
                Use the one-time verification code below to sign in or create your Tsuna account:
              </p>
              <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #34d399;">${code}</span>
              </div>
              <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin-bottom: 28px;">
                This code is valid for <strong>10 minutes</strong>. If you did not request this verification code, please disregard this email.
              </p>
              <div style="font-size: 11px; color: #52525b; text-align: center; border-top: 1px solid #27272a; padding-top: 20px; line-height: 1.5;">
                Delivered via Brevo Transactional Email Engine • Cloud Run &amp; Firebase Storage<br/>
                Tsuna Collaborative Platform
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      });

      if (!brevoRes.ok) {
        const errorText = await brevoRes.text();
        console.error('[Brevo Error] Status:', brevoRes.status, errorText);
        
        // If Brevo returns an error (e.g. sender validation or limit), provide helpful feedback
        let parsedErr: any = {};
        try { parsedErr = JSON.parse(errorText); } catch {}
        const detailMsg = parsedErr.message || errorText;

        return res.status(brevoRes.status >= 500 ? 502 : 400).json({
          error: `Brevo service error: ${detailMsg}`,
          hint: 'Ensure your Brevo sender email is active in Brevo dashboard.',
          codePreview: process.env.NODE_ENV !== 'production' ? code : undefined,
        });
      }

      const brevoData = await brevoRes.json().catch(() => ({}));
      console.log(`[Brevo Success] Email dispatched to ${normalizedEmail}. MessageId:`, (brevoData as any)?.messageId);

      return res.json({
        success: true,
        message: `A 6-digit verification code was sent to ${normalizedEmail}.`,
        messageId: (brevoData as any)?.messageId,
      });
    } catch (err: any) {
      console.error('[Brevo OTP] Unexpected server error:', err);
      return res.status(500).json({ error: err.message || 'Failed to dispatch verification email.' });
    }
  });

  // Verify Email OTP
  app.post('/api/auth/verify-otp', (req, res) => {
    try {
      const { email, otp, displayName } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and 6-digit verification code are required' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const cleanOtp = String(otp).trim();

      const record = otpStore.get(normalizedEmail);
      if (!record) {
        return res.status(400).json({ error: 'No active verification code found for this email. Please request a new code.' });
      }

      if (record.expiresAt < Date.now()) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      }

      if (record.code !== cleanOtp) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          otpStore.delete(normalizedEmail);
          return res.status(400).json({ error: 'Too many invalid attempts. Please request a new code.' });
        }
        return res.status(400).json({ error: `Incorrect verification code (${5 - record.attempts} attempts remaining).` });
      }

      // OTP is valid! Remove from store
      otpStore.delete(normalizedEmail);

      const state = db.getState();
      const emailPrefix = normalizedEmail.split('@')[0];
      const cleanUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;

      // Check if user already exists with this email or username
      let existingUser = state.users.find(
        (u) => (u.email && u.email.toLowerCase() === normalizedEmail) || u.username.toLowerCase() === cleanUsername
      );

      if (!existingUser) {
        // Create new user profile
        existingUser = {
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: displayName || emailPrefix,
          username: cleanUsername,
          email: normalizedEmail,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
          banner: `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80`,
          bio: 'Creator & builder on Tsuna verified via Brevo OTP.',
          roleTitle: 'Independent Creator',
          skills: ['TypeScript', 'Creative Tech'],
          externalAccounts: {},
          isOnline: true,
          isDemo: false,
          customStatus: 'Verified via Brevo Email OTP',
          statusEmoji: '⚡',
          availability: 'available',
        };
        state.users.push(existingUser);
      } else {
        existingUser.isOnline = true;
        existingUser.email = normalizedEmail;
        if (displayName && (!existingUser.name || existingUser.name === 'Tsuna Builder')) {
          existingUser.name = displayName;
        }
      }

      state.currentUser = existingUser;
      db.save();

      console.log(`[Brevo Auth] User verified & signed in: ${existingUser.name} (${existingUser.email})`);

      return res.json({
        success: true,
        user: state.currentUser,
        message: 'Successfully verified and logged in!',
      });
    } catch (err: any) {
      console.error('[Verify OTP] Error:', err);
      return res.status(500).json({ error: 'Failed to complete verification' });
    }
  });

  // Sync Firebase Auth User into Server State
  app.post('/api/auth/sync-firebase-user', (req, res) => {
    try {
      const { user: fbUser } = req.body;
      if (!fbUser || !fbUser.id) {
        return res.status(400).json({ error: 'Invalid user payload' });
      }

      const state = db.getState();
      let existing = state.users.find(
        (u) => u.id === fbUser.id || (fbUser.email && u.email && u.email.toLowerCase() === fbUser.email.toLowerCase())
      );

      if (existing) {
        Object.assign(existing, fbUser, { isOnline: true, isDemo: false });
        state.currentUser = existing;
      } else {
        state.users.push(fbUser);
        state.currentUser = fbUser;
      }

      db.save();
      return res.json({ success: true, user: state.currentUser });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to sync Firebase user' });
    }
  });

  // Auth endpoints
  app.get('/api/auth/me', (req, res) => {
    const state = db.getState();
    res.json(state.currentUser);
  });

  // Sync / Restore user from client localStorage
  app.post('/api/auth/sync-local-user', (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id) {
        return res.status(400).json({ error: 'User data required' });
      }
      const state = db.getState();
      let existing = state.users.find(
        (u) => u.id === user.id || (user.email && u.email && u.email.toLowerCase() === user.email.toLowerCase())
      );
      if (existing) {
        Object.assign(existing, user, { isOnline: true, isDemo: false });
        state.currentUser = existing;
      } else {
        const cleanUser = { ...user, isOnline: true, isDemo: false };
        state.users.push(cleanUser);
        state.currentUser = cleanUser;
      }
      db.save();
      return res.json({ success: true, user: state.currentUser });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to sync local user' });
    }
  });

  // Explicit Registration Endpoint (Fill up once, retained forever)
  app.post('/api/auth/register', (req, res) => {
    const { name, username, bio, roleTitle, skills, email, avatar } = req.body;
    if (!name || !username) {
      return res.status(400).json({ error: 'Full name and username are required' });
    }

    const cleanUsername = username.toLowerCase().replace(/[@\s]+/g, '_');
    const state = db.getState();

    // Check if user exists
    let existing = state.users.find(
      (u) => u.username.toLowerCase() === cleanUsername || (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (existing) {
      existing.name = name.trim();
      existing.username = cleanUsername;
      if (bio) existing.bio = bio.trim();
      if (roleTitle) existing.roleTitle = roleTitle.trim();
      if (avatar) existing.avatar = avatar;
      if (Array.isArray(skills)) existing.skills = skills;
      if (email) existing.email = email.toLowerCase().trim();
      existing.isOnline = true;
      existing.isDemo = false;
      state.currentUser = existing;
    } else {
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        username: cleanUsername,
        email: email ? email.toLowerCase().trim() : undefined,
        avatar:
          avatar ||
          `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanUsername)}`,
        bio: bio ? bio.trim() : 'Creator on Tsuna',
        roleTitle: roleTitle ? roleTitle.trim() : 'Independent Creator',
        skills: Array.isArray(skills) && skills.length > 0 ? skills : ['Creator'],
        externalAccounts: {},
        isOnline: true,
        isDemo: false,
      };
      state.users.push(newUser);
      state.currentUser = newUser;
    }

    db.save();
    console.log(`[Tsuna Auth] Registered/Updated user: ${state.currentUser.name} (@${state.currentUser.username})`);
    return res.json({ success: true, user: state.currentUser });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username } = req.body;
    const state = db.getState();
    const query = (username || '').toLowerCase().trim();
    let existing = state.users.find(
      (u) => u.username.toLowerCase() === query || (u.email && u.email.toLowerCase() === query)
    );
    if (!existing) {
      return res.status(404).json({ error: 'User not found. Please complete registration.' });
    }
    existing.isOnline = true;
    state.currentUser = existing;
    db.save();
    res.json(state.currentUser);
  });

  app.post('/api/auth/signup', (req, res) => {
    const { name, username, bio, roleTitle, skills, email, avatar } = req.body;
    const cleanUsername = (username || `creator_${Math.floor(Math.random() * 1000)}`).toLowerCase().replace(/[@\s]+/g, '_');
    const state = db.getState();
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name || 'Creator',
      username: cleanUsername,
      email: email ? email.toLowerCase().trim() : undefined,
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cleanUsername)}`,
      bio: bio || 'Building on Tsuna.',
      roleTitle: roleTitle || 'Independent Creator',
      skills: Array.isArray(skills) ? skills : ['Creative Tech'],
      externalAccounts: {},
      isOnline: true,
      isDemo: false,
    };
    state.users.push(newUser);
    state.currentUser = newUser;
    db.save();
    res.json(newUser);
  });

  app.post('/api/auth/logout', (req, res) => {
    const state = db.getState();
    state.currentUser = null;
    db.save();
    res.json({ success: true, message: 'Logged out successfully' });
  });

  function getActorUser(state: ReturnType<typeof db.getState>): User {
    if (state.currentUser) return state.currentUser;
    if (state.users && state.users.length > 0) return state.users[0];
    return {
      id: 'usr_guest',
      name: 'Tsuna Member',
      username: 'member',
      avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=tsuna',
      bio: 'Tsuna creator',
      roleTitle: 'Creator',
      skills: ['Creator'],
      isOnline: true,
      isDemo: false,
    };
  }

  // Profile
  app.patch('/api/profile', (req, res) => {
    const state = db.getState();
    const updates = req.body;
    const current = getActorUser(state);
    const updated: User = {
      ...current,
      ...updates,
      links: {
        ...(current.links || {}),
        ...(updates.links || {}),
      },
      externalAccounts: {
        ...(current.externalAccounts || {}),
        ...(updates.externalAccounts || {}),
      },
    };
    state.currentUser = updated;
    const idx = state.users.findIndex((u) => u.id === updated.id);
    if (idx !== -1) {
      state.users[idx] = updated;
    } else {
      state.users.push(updated);
    }

    // Propagate updated name, avatar, role to posts created by this user
    state.posts.forEach((p) => {
      if (p.author && p.author.id === updated.id) {
        p.author = { ...p.author, name: updated.name, avatar: updated.avatar, roleTitle: updated.roleTitle };
      }
    });

    if (state.comments) {
      Object.keys(state.comments).forEach((postId) => {
        state.comments[postId].forEach((c) => {
          if (c.author && c.author.id === updated.id) {
            c.author = { ...c.author, name: updated.name, avatar: updated.avatar };
          }
        });
      });
    }

    // Propagate to conversations and messages
    state.conversations.forEach((conv) => {
      if (conv.members) {
        const mIdx = conv.members.findIndex((m) => m.id === updated.id);
        if (mIdx !== -1) {
          conv.members[mIdx] = { ...conv.members[mIdx], name: updated.name, avatar: updated.avatar, roleTitle: updated.roleTitle };
        }
      }
    });
    Object.keys(state.messages).forEach((chatId) => {
      state.messages[chatId].forEach((msg) => {
        if (msg.sender && msg.sender.id === updated.id) {
          msg.sender = { ...msg.sender, name: updated.name, avatar: updated.avatar, roleTitle: updated.roleTitle };
        }
      });
    });

    db.save();
    res.json(updated);
  });

  // ==========================================
  // FEED CUSTOMIZATION & 50 PREFERENCES SYSTEM
  // ==========================================

  // Catalog of 50 Elaborate Feed Preferences
  app.get('/api/preferences', (req, res) => {
    res.json({
      categories: FEED_CATEGORIES,
      preferences: ELABORATE_50_FEED_PREFERENCES,
      presets: PRESET_CURATIONS,
      totalCount: ELABORATE_50_FEED_PREFERENCES.length,
    });
  });

  // Get current user feed customization state
  app.get('/api/user/preferences', (req, res) => {
    const state = db.getState();
    const actor = getActorUser(state);
    res.json({
      preferences: actor?.preferences || [],
      feedTuning: actor?.feedTuning || {
        codeWeight: 80,
        mediaWeight: 75,
        discussionWeight: 65,
        exploreVsFollowing: 'balanced',
        boostedTags: [],
        penalizedTags: [],
      },
    });
  });

  // Update current user feed customization preferences
  app.post('/api/user/preferences', (req, res) => {
    const { preferences, feedTuning } = req.body;
    const state = db.getState();
    const actor = getActorUser(state);

    if (Array.isArray(preferences)) {
      actor.preferences = preferences;
    }
    if (feedTuning && typeof feedTuning === 'object') {
      actor.feedTuning = {
        ...(actor.feedTuning || {}),
        ...feedTuning,
      };
    }

    // Persist in state.users
    const idx = state.users.findIndex((u) => u.id === actor.id);
    if (idx !== -1) {
      state.users[idx] = actor;
    } else {
      state.users.push(actor);
    }
    if (state.currentUser && state.currentUser.id === actor.id) {
      state.currentUser = actor;
    }

    db.save();
    res.json({
      success: true,
      preferences: actor.preferences,
      feedTuning: actor.feedTuning,
    });
  });

  // Instagram/Facebook-style multi-signal AI feed ranking
  app.post('/api/feed/ai-rank', async (req, res) => {
    try {
      const { mode, activePreferences, feedTuning } = req.body;
      const state = db.getState();
      const actor = getActorUser(state);

      const ranked = await rankFeed(
        {
          posts: state.posts,
          currentUser: actor,
          mode: mode || 'for_you',
          activePreferences,
          feedTuning,
        },
        state.users
      );

      res.json(ranked);
    } catch (err) {
      console.error('Error ranking feed:', err);
      res.status(500).json({ error: 'Failed to rank feed' });
    }
  });

  // Follow suggestions based on 50 preferences & mutual connections
  app.get('/api/users/suggestions', (req, res) => {
    try {
      const state = db.getState();
      const actor = getActorUser(state);
      const suggestions = getCreatorSuggestions(actor, state.users, state.posts);
      res.json(suggestions);
    } catch (err) {
      console.error('Error generating creator suggestions:', err);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  });

  // Search profiles section
  app.get('/api/users/search', (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      const state = db.getState();
      const actor = getActorUser(state);
      const results = searchUserProfiles(query, actor, state.users);
      res.json(results);
    } catch (err) {
      console.error('Error searching profiles:', err);
      res.status(500).json({ error: 'Failed to search profiles' });
    }
  });

  // Post feedback signal: "Show more like this" or "Show less like this"
  app.post('/api/feed/feedback', (req, res) => {
    try {
      const { tag, action } = req.body; // action: 'boost' | 'reduce'
      if (!tag) {
        return res.status(400).json({ error: 'Missing tag' });
      }
      const state = db.getState();
      const actor = getActorUser(state);
      const tuning = actor.feedTuning || {
        codeWeight: 80,
        mediaWeight: 75,
        discussionWeight: 65,
        boostedTags: [],
        penalizedTags: [],
      };

      const cleanTag = tag.replace(/^#/, '').toLowerCase();
      let boosted = new Set((tuning.boostedTags || []).map((t) => t.toLowerCase()));
      let penalized = new Set((tuning.penalizedTags || []).map((t) => t.toLowerCase()));

      if (action === 'boost') {
        boosted.add(cleanTag);
        penalized.delete(cleanTag);
      } else if (action === 'reduce') {
        penalized.add(cleanTag);
        boosted.delete(cleanTag);
      }

      tuning.boostedTags = Array.from(boosted);
      tuning.penalizedTags = Array.from(penalized);
      actor.feedTuning = tuning;

      const idx = state.users.findIndex((u) => u.id === actor.id);
      if (idx !== -1) {
        state.users[idx] = actor;
      }
      if (state.currentUser && state.currentUser.id === actor.id) {
        state.currentUser = actor;
      }
      db.save();

      res.json({ success: true, feedTuning: tuning });
    } catch (err) {
      console.error('Error updating feed feedback:', err);
      res.status(500).json({ error: 'Failed to update feedback' });
    }
  });
  app.get('/api/communities', (req, res) => {
    const state = db.getState();
    res.json(state.communities);
  });

  app.get('/api/communities/:id', (req, res) => {
    const state = db.getState();
    const comm = state.communities.find((c) => c.id === req.params.id || c.slug === req.params.id);
    if (!comm) {
      return res.status(404).json({ error: 'Community not found' });
    }
    const communityPosts = state.posts.filter((p) => p.communityId === comm.id);
    res.json({ community: comm, posts: communityPosts });
  });

  app.post('/api/communities', (req, res) => {
    const { name, tagline, description, category, tags, avatar, banner } = req.body;
    const state = db.getState();
    const slug = (name || 'community').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newComm: Community = {
      id: `comm_${Date.now()}`,
      name: name || 'New Community',
      slug,
      tagline: tagline || 'A collective space for building together.',
      description: description || 'Community focused on collaborative projects.',
      avatar: avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${slug}`,
      banner: banner || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
      category: category || 'Engineering',
      membersCount: 1,
      activeBuildingCount: 1,
      tags: Array.isArray(tags) ? tags : ['Collab', 'Projects'],
      isJoined: true,
      currentUserRole: 'Owner',
    };
    state.communities.unshift(newComm);
    // Create default group chat for the community
    const actorUser = getActorUser(state);
    const newChat: ChatConversation = {
      id: `chat_${newComm.id}`,
      type: 'group' as const,
      name: `#${newComm.slug}`,
      communityId: newComm.id,
      communityName: newComm.name,
      avatar: newComm.avatar,
      members: [actorUser],
      lastMessage: {
        text: `Community created. Let's start building!`,
        timestamp: 'Just now',
        senderName: actorUser.name,
      },
      unreadCount: 0,
      backgroundTheme: 'default' as const,
    };
    state.conversations.unshift(newChat);
    state.messages[newChat.id] = [
      {
        id: `msg_${Date.now()}`,
        conversationId: newChat.id,
        sender: actorUser,
        text: `Welcome to ${newComm.name}! Share your in-progress work, join voice rooms, and collaborate.`,
        timestamp: 'Just now',
        reactions: [{ emoji: '🎉', count: 1, users: [actorUser.id] }],
      },
    ];
    db.save();
    res.json(newComm);
  });

  app.post('/api/communities/:id/join', (req, res) => {
    const state = db.getState();
    const comm = state.communities.find((c) => c.id === req.params.id);
    if (!comm) {
      return res.status(404).json({ error: 'Community not found' });
    }
    comm.isJoined = true;
    comm.currentUserRole = comm.currentUserRole || 'Member';
    comm.membersCount += 1;
    db.save();
    res.json(comm);
  });

  app.post('/api/communities/:id/leave', (req, res) => {
    const state = db.getState();
    const comm = state.communities.find((c) => c.id === req.params.id);
    if (!comm) {
      return res.status(404).json({ error: 'Community not found' });
    }
    comm.isJoined = false;
    comm.currentUserRole = undefined;
    comm.membersCount = Math.max(1, comm.membersCount - 1);
    db.save();
    res.json(comm);
  });

  // Posts
  app.get('/api/posts', (req, res) => {
    const { communityId, search } = req.query;
    const state = db.getState();
    let list = [...state.posts];
    if (communityId) {
      list = list.filter((p) => p.communityId === communityId);
    } else {
      // Global feed: strictly filter out community-only posts
      list = list.filter((p) => !p.communityOnly);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    res.json(list);
  });

  app.post('/api/posts', (req, res) => {
    const {
      title,
      content,
      postType,
      codeSnippet,
      attachment,
      communityId,
      communityOnly,
      tags,
      image,
      linkPreview,
      gifUrl,
      videoUrl,
      eventInvite,
      groupInvite,
    } = req.body;
    const state = db.getState();
    const comm = state.communities.find((c) => c.id === communityId);

    const actorUser = getActorUser(state);
    // When posted to a community, defaults to community-only post unless explicitly set
    const isCommunityOnly = communityId ? (communityOnly !== undefined ? Boolean(communityOnly) : true) : false;

    const newPost: Post = {
      id: `post_${Date.now()}`,
      author: actorUser,
      communityId: comm?.id || undefined,
      communityName: comm?.name || undefined,
      communityOnly: isCommunityOnly,
      title: title || 'Untitled Share',
      content: content || '',
      postType: postType || 'general',
      codeSnippet: codeSnippet || undefined,
      attachment: attachment || undefined,
      image: image || undefined,
      linkPreview: linkPreview || undefined,
      gifUrl: gifUrl || undefined,
      videoUrl: videoUrl || undefined,
      eventInvite: eventInvite || undefined,
      groupInvite: groupInvite || undefined,
      likes: 0,
      isLiked: false,
      commentsCount: 0,
      createdAt: 'Just now',
      tags: Array.isArray(tags) ? tags : ['Tsuna', 'Build'],
    };

    state.posts.unshift(newPost);
    state.comments[newPost.id] = [];
    db.save();
    res.json(newPost);
  });

  // Community Questions (Q&A)
  app.get('/api/communities/:id/questions', (req, res) => {
    const state = db.getState();
    const commId = req.params.id;
    if (!state.questions) state.questions = {};
    const questions = state.questions[commId] || [];
    res.json(questions);
  });

  app.post('/api/communities/:id/questions', (req, res) => {
    const { title, details, tags, isAnonymous } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Question title is required' });
    }
    const state = db.getState();
    const commId = req.params.id;
    const actorUser = getActorUser(state);

    const isAnon = Boolean(isAnonymous);
    const author = isAnon
      ? {
          id: 'anon',
          name: 'Anonymous Builder',
          username: 'anonymous',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=anon_${Date.now()}`,
          roleTitle: 'Incognito Contributor',
        }
      : {
          id: actorUser.id,
          name: actorUser.name,
          username: actorUser.username,
          avatar: actorUser.avatar,
          roleTitle: actorUser.roleTitle || 'Builder',
        };

    const newQuestion: CommunityQuestion = {
      id: `q_${Date.now()}`,
      communityId: commId,
      title: title.trim(),
      details: (details || '').trim(),
      tags: Array.isArray(tags) ? tags : [],
      author,
      isAnonymous: isAnon,
      upvotes: 0,
      upvotedBy: [],
      answersCount: 0,
      isResolved: false,
      createdAt: 'Just now',
      answers: [],
    };

    if (!state.questions) state.questions = {};
    if (!state.questions[commId]) state.questions[commId] = [];
    state.questions[commId].unshift(newQuestion);
    if (!state.questionAnswers) state.questionAnswers = {};
    state.questionAnswers[newQuestion.id] = [];
    db.save();
    res.json(newQuestion);
  });

  app.get('/api/questions/:questionId', (req, res) => {
    const state = db.getState();
    const qId = req.params.questionId;
    if (!state.questions) state.questions = {};
    if (!state.questionAnswers) state.questionAnswers = {};
    let foundQuestion: CommunityQuestion | null = null;
    for (const commId of Object.keys(state.questions)) {
      const q = state.questions[commId]?.find((item) => item.id === qId);
      if (q) {
        foundQuestion = q;
        break;
      }
    }
    if (!foundQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const answers = state.questionAnswers[qId] || [];
    res.json({ ...foundQuestion, answers });
  });

  app.post('/api/questions/:questionId/answers', (req, res) => {
    const { content, isAnonymous } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Answer content is required' });
    }
    const state = db.getState();
    const qId = req.params.questionId;
    const actorUser = getActorUser(state);

    if (!state.questions) state.questions = {};
    if (!state.questionAnswers) state.questionAnswers = {};

    let targetQuestion: CommunityQuestion | null = null;
    for (const commId of Object.keys(state.questions)) {
      const q = state.questions[commId]?.find((item) => item.id === qId);
      if (q) {
        targetQuestion = q;
        break;
      }
    }
    if (!targetQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isAnon = Boolean(isAnonymous);
    const author = isAnon
      ? {
          id: 'anon',
          name: 'Anonymous Builder',
          username: 'anonymous',
          avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=anon_ans_${Date.now()}`,
          roleTitle: 'Incognito Contributor',
        }
      : {
          id: actorUser.id,
          name: actorUser.name,
          username: actorUser.username,
          avatar: actorUser.avatar,
          roleTitle: actorUser.roleTitle || 'Builder',
        };

    const newAnswer: QuestionAnswer = {
      id: `ans_${Date.now()}`,
      questionId: qId,
      content: content.trim(),
      author,
      isAnonymous: isAnon,
      upvotes: 0,
      upvotedBy: [],
      createdAt: 'Just now',
    };

    if (!state.questionAnswers[qId]) state.questionAnswers[qId] = [];
    state.questionAnswers[qId].push(newAnswer);
    targetQuestion.answersCount = state.questionAnswers[qId].length;
    db.save();
    res.json(newAnswer);
  });

  app.post('/api/questions/:questionId/upvote', (req, res) => {
    const state = db.getState();
    const qId = req.params.questionId;
    const actorUser = getActorUser(state);

    if (!state.questions) state.questions = {};
    let targetQuestion: CommunityQuestion | null = null;
    for (const commId of Object.keys(state.questions)) {
      const q = state.questions[commId]?.find((item) => item.id === qId);
      if (q) {
        targetQuestion = q;
        break;
      }
    }
    if (!targetQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    if (!targetQuestion.upvotedBy) targetQuestion.upvotedBy = [];
    const hasUpvoted = targetQuestion.upvotedBy.includes(actorUser.id);
    if (hasUpvoted) {
      targetQuestion.upvotedBy = targetQuestion.upvotedBy.filter((id) => id !== actorUser.id);
      targetQuestion.upvotes = Math.max(0, targetQuestion.upvotes - 1);
    } else {
      targetQuestion.upvotedBy.push(actorUser.id);
      targetQuestion.upvotes += 1;
    }
    db.save();
    res.json(targetQuestion);
  });

  app.post('/api/questions/:questionId/answers/:answerId/upvote', (req, res) => {
    const state = db.getState();
    const { questionId, answerId } = req.params;
    const actorUser = getActorUser(state);
    if (!state.questionAnswers) state.questionAnswers = {};
    const answers = state.questionAnswers[questionId] || [];
    const ans = answers.find((a) => a.id === answerId);
    if (!ans) {
      return res.status(404).json({ error: 'Answer not found' });
    }
    if (!ans.upvotedBy) ans.upvotedBy = [];
    const hasUpvoted = ans.upvotedBy.includes(actorUser.id);
    if (hasUpvoted) {
      ans.upvotedBy = ans.upvotedBy.filter((id) => id !== actorUser.id);
      ans.upvotes = Math.max(0, ans.upvotes - 1);
    } else {
      ans.upvotedBy.push(actorUser.id);
      ans.upvotes += 1;
    }
    db.save();
    res.json(ans);
  });

  app.post('/api/questions/:questionId/resolve', (req, res) => {
    const state = db.getState();
    const qId = req.params.questionId;
    if (!state.questions) state.questions = {};
    let targetQuestion: CommunityQuestion | null = null;
    for (const commId of Object.keys(state.questions)) {
      const q = state.questions[commId]?.find((item) => item.id === qId);
      if (q) {
        targetQuestion = q;
        break;
      }
    }
    if (!targetQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    targetQuestion.isResolved = !targetQuestion.isResolved;
    db.save();
    res.json(targetQuestion);
  });

  // Dedicated Community Group Chat endpoint (ensures conversation exists)
  app.get('/api/communities/:id/chat', (req, res) => {
    const state = db.getState();
    const commId = req.params.id;
    const comm = state.communities.find((c) => c.id === commId || c.slug === commId);
    if (!comm) {
      return res.status(404).json({ error: 'Community not found' });
    }

    if (!state.conversations) state.conversations = [];
    if (!state.messages) state.messages = {};

    let chat = state.conversations.find((c) => c.communityId === comm.id);
    if (!chat) {
      const actorUser = getActorUser(state);
      chat = {
        id: `chat_${comm.id}`,
        type: 'group',
        name: `#${comm.slug}`,
        communityId: comm.id,
        communityName: comm.name,
        avatar: comm.avatar,
        members: [actorUser],
        lastMessage: {
          text: `Welcome to the ${comm.name} group chat!`,
          timestamp: 'Just now',
          senderName: actorUser.name,
        },
        unreadCount: 0,
        backgroundTheme: 'default',
      };
      state.conversations.unshift(chat);
      state.messages[chat.id] = [
        {
          id: `msg_init_${Date.now()}`,
          conversationId: chat.id,
          sender: actorUser,
          text: `Welcome to the official group chat for ${comm.name}! Share ideas, ask questions, or connect with fellow community builders.`,
          timestamp: 'Just now',
          reactions: [{ emoji: '👋', count: 1, users: [actorUser.id] }],
        },
      ];
      db.save();
    }

    const messages = state.messages[chat.id] || [];
    res.json({ conversation: chat, messages });
  });

  app.post('/api/posts/:id/like', (req, res) => {
    const state = db.getState();
    const post = state.posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.isLiked = !post.isLiked;
    post.likes += post.isLiked ? 1 : -1;

    // Trigger notification on like
    if (post.isLiked) {
      const actor = getActorUser(state);
      if (!state.notifications) state.notifications = [];
      state.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'reaction',
        title: 'Work Appreciated',
        description: `${actor.name} liked your post "${post.title.slice(0, 32)}${post.title.length > 32 ? '...' : ''}"`,
        timestamp: 'Just now',
        isRead: false,
        linkTab: 'home',
        linkId: post.id,
        actor: {
          name: actor.name,
          avatar: actor.avatar,
          username: actor.username,
        },
      });
    }

    db.save();
    res.json(post);
  });

  // Comments
  app.get('/api/posts/:id/comments', (req, res) => {
    const state = db.getState();
    const comments = state.comments[req.params.id] || [];
    res.json(comments);
  });

  app.post('/api/posts/:id/comments', (req, res) => {
    const { content, codeSnippet } = req.body;
    const state = db.getState();
    const post = state.posts.find((p) => p.id === req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (!state.comments[post.id]) {
      state.comments[post.id] = [];
    }
    const actorUser = getActorUser(state);
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId: post.id,
      author: actorUser,
      content: content || '',
      createdAt: 'Just now',
      likes: 0,
      isLiked: false,
      codeSnippet: codeSnippet || undefined,
    };
    state.comments[post.id].push(newComment);
    post.commentsCount = state.comments[post.id].length;

    // Trigger notification on comment
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift({
      id: `notif_${Date.now()}`,
      type: 'comment',
      title: 'New Discussion',
      description: `${actorUser.name} commented on "${post.title.slice(0, 30)}...": "${(content || '').slice(0, 36)}"`,
      timestamp: 'Just now',
      isRead: false,
      linkTab: 'home',
      linkId: post.id,
      actor: {
        name: actorUser.name,
        avatar: actorUser.avatar,
        username: actorUser.username,
      },
    });

    db.save();
    res.json(newComment);
  });

  // Chats & Messages
  app.get('/api/chats', (req, res) => {
    const state = db.getState();
    res.json(state.conversations);
  });

  app.get('/api/chats/:id/messages', (req, res) => {
    const state = db.getState();
    const messages = state.messages[req.params.id] || [];
    res.json(messages);
  });

  app.post('/api/chats/:id/messages', (req, res) => {
    const { text, codeSnippet, attachment, image } = req.body;
    const state = db.getState();
    const conv = state.conversations.find((c) => c.id === req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (!state.messages[conv.id]) {
      state.messages[conv.id] = [];
    }
    const actorUser = getActorUser(state);
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      conversationId: conv.id,
      sender: actorUser,
      text: text || '',
      codeSnippet: codeSnippet || undefined,
      attachment: attachment || undefined,
      image: image || undefined,
      timestamp: 'Just now',
      reactions: [],
    };
    state.messages[conv.id].push(newMsg);
    conv.lastMessage = {
      text: text || (codeSnippet ? 'Shared code snippet' : 'Shared attachment'),
      timestamp: 'Just now',
      senderName: actorUser.name,
    };
    db.save();
    res.json(newMsg);
  });

  app.patch('/api/chats/:id/settings', (req, res) => {
    const { backgroundTheme } = req.body;
    const state = db.getState();
    const conv = state.conversations.find((c) => c.id === req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    if (backgroundTheme) {
      conv.backgroundTheme = backgroundTheme;
    }
    db.save();
    res.json(conv);
  });

  // Mark conversation as read
  app.post('/api/chats/:id/read', (req, res) => {
    const state = db.getState();
    const conv = state.conversations.find((c) => c.id === req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    conv.unreadCount = 0;
    db.save();
    res.json({ success: true, conversation: conv });
  });

  // Mark all conversations as read
  app.post('/api/chats/read-all', (req, res) => {
    const state = db.getState();
    state.conversations.forEach((c) => {
      c.unreadCount = 0;
    });
    db.save();
    res.json({ success: true, count: 0 });
  });

  // Notifications API
  app.get('/api/notifications', (req, res) => {
    const state = db.getState();
    res.json(state.notifications || []);
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const state = db.getState();
    if (!state.notifications) state.notifications = [];
    const notif = state.notifications.find((n) => n.id === req.params.id);
    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    notif.isRead = true;
    db.save();
    res.json({ success: true, notification: notif });
  });

  app.post('/api/notifications/read-all', (req, res) => {
    const state = db.getState();
    if (!state.notifications) state.notifications = [];
    state.notifications.forEach((n) => {
      n.isRead = true;
    });
    db.save();
    res.json({ success: true });
  });

  app.post('/api/notifications/simulate', (req, res) => {
    const state = db.getState();
    if (!state.notifications) state.notifications = [];
    const sampleEvents = [
      {
        type: 'reaction' as const,
        title: 'New Star on Code',
        desc: 'Sora Tanaka starred your WebGPU shader pipeline.',
        tab: 'home',
      },
      {
        type: 'comment' as const,
        title: 'New Feedback',
        desc: 'Elena Vance commented: "The buffer allocations here are super clean!"',
        tab: 'flows',
      },
      {
        type: 'event' as const,
        title: 'Live Workshop Starting',
        desc: 'Interactive Audio DSP Jam is now streaming in SynthWave Labs.',
        tab: 'events',
      },
      {
        type: 'mention' as const,
        title: 'Mentioned in Collective',
        desc: 'Marcus mentioned you in #design-systems: "Check this typography scale"',
        tab: 'chat',
      },
    ];
    const pick = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
    const newNotif: TsunaNotification = {
      id: `notif_${Date.now()}`,
      type: pick.type,
      title: pick.title,
      description: pick.desc,
      timestamp: 'Just now',
      isRead: false,
      linkTab: pick.tab,
      actor: {
        name: 'Active Builder',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        username: 'builder',
      },
    };
    state.notifications.unshift(newNotif);
    db.save();
    res.json(newNotif);
  });

  // Events & Submissions
  app.get('/api/events', (req, res) => {
    const state = db.getState();
    res.json(state.events);
  });

  app.post('/api/events', (req, res) => {
    const { communityId, title, description, type, startTime, submissionsPrompt, files } = req.body;
    const state = db.getState();
    const comm = state.communities.find((c) => c.id === communityId);

    const actorUser = getActorUser(state);
    const newEvent: TsunaEvent = {
      id: `event_${Date.now()}`,
      communityId: comm?.id || 'comm_hypercraft',
      communityName: comm?.name || 'Tsuna Global',
      title: title || 'New Collaboration Event',
      description: description || 'Collaborative session for Tsuna creators.',
      type: type || 'voice_room',
      startTime: startTime || 'Live Now',
      host: actorUser,
      status: 'live',
      participantsCount: 1,
      submissionsCount: 0,
      isJoined: true,
      submissionsPrompt: submissionsPrompt || undefined,
      files: Array.isArray(files) ? files : [],
    };
    state.events.unshift(newEvent);
    state.submissions[newEvent.id] = [];

    // Also spin up a Voice Room if type is voice_room
    if (type === 'voice_room') {
      const newVR: VoiceRoom = {
        id: `vr_${newEvent.id}`,
        title: newEvent.title,
        communityId: newEvent.communityId,
        communityName: newEvent.communityName,
        host: actorUser,
        participants: [
          { user: actorUser, isSpeaking: true, isMuted: false, joinedAt: 'Just now' },
        ],
        isLive: true,
      };
      state.voiceRooms.unshift(newVR);
    }

    db.save();
    res.json(newEvent);
  });

  app.post('/api/events/:id/join', (req, res) => {
    const state = db.getState();
    const event = state.events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    event.isJoined = !event.isJoined;
    event.participantsCount += event.isJoined ? 1 : -1;
    db.save();
    res.json(event);
  });

  // Event Files & Resources endpoints
  app.get('/api/events/:id/files', (req, res) => {
    const state = db.getState();
    const event = state.events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event.files || []);
  });

  app.post('/api/events/:id/files', (req, res) => {
    const { name, size, type, url, description } = req.body;
    const state = db.getState();
    const event = state.events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const actorUser = getActorUser(state);
    if (!event.files) {
      event.files = [];
    }
    const newFile: EventFileAttachment = {
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name || 'event_resource_file',
      size: size || '1.0 MB',
      type: type || 'application/octet-stream',
      url: url || '#',
      uploadedBy: actorUser.name || 'Tsuna Builder',
      uploadedAt: 'Just now',
      description: description || undefined,
      downloadCount: 0,
    };
    event.files.unshift(newFile);
    db.save();
    res.json(newFile);
  });

  app.delete('/api/events/:id/files/:fileId', (req, res) => {
    const state = db.getState();
    const event = state.events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.files) {
      event.files = event.files.filter((f) => f.id !== req.params.fileId);
      db.save();
    }
    res.json({ success: true, message: 'File deleted from event' });
  });

  app.get('/api/events/:id/submissions', (req, res) => {
    const state = db.getState();
    const list = state.submissions[req.params.id] || [];
    res.json(list);
  });

  app.post('/api/events/:id/submissions', (req, res) => {
    const { title, description, mediaType, mediaUrl, codeSnippet, files } = req.body;
    const state = db.getState();
    const event = state.events.find((e) => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (!state.submissions[event.id]) {
      state.submissions[event.id] = [];
    }
    const actorUser = getActorUser(state);
    const newSubmission: EventSubmission = {
      id: `sub_${Date.now()}`,
      eventId: event.id,
      author: actorUser,
      title: title || 'Untitled Submission',
      description: description || '',
      mediaType: mediaType || 'code',
      mediaUrl: mediaUrl || undefined,
      codeSnippet: codeSnippet || undefined,
      files: Array.isArray(files) ? files : undefined,
      votes: 1,
      hasVoted: true,
      createdAt: 'Just now',
    };
    state.submissions[event.id].unshift(newSubmission);
    event.submissionsCount = (event.submissionsCount || 0) + 1;
    db.save();
    res.json(newSubmission);
  });

  app.post('/api/submissions/:id/vote', (req, res) => {
    const state = db.getState();
    for (const eventId in state.submissions) {
      const sub = state.submissions[eventId].find((s) => s.id === req.params.id);
      if (sub) {
        sub.hasVoted = !sub.hasVoted;
        sub.votes += sub.hasVoted ? 1 : -1;
        db.save();
        return res.json(sub);
      }
    }
    res.status(404).json({ error: 'Submission not found' });
  });

  // Voice Rooms
  app.get('/api/voice-rooms', (req, res) => {
    const state = db.getState();
    res.json(state.voiceRooms);
  });

  app.post('/api/voice-rooms/join', (req, res) => {
    const { roomId } = req.body;
    const state = db.getState();
    const room = state.voiceRooms.find((r) => r.id === roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    const actorUser = getActorUser(state);
    const existing = room.participants.find((p) => p.user.id === actorUser.id);
    if (!existing) {
      room.participants.push({
        user: actorUser,
        isSpeaking: false,
        isMuted: false,
        joinedAt: 'Just now',
      });
    }
    db.save();
    res.json(room);
  });

  app.post('/api/voice-rooms/leave', (req, res) => {
    const { roomId } = req.body;
    const state = db.getState();
    const room = state.voiceRooms.find((r) => r.id === roomId);
    const actorUser = getActorUser(state);
    if (room) {
      room.participants = room.participants.filter((p) => p.user.id !== actorUser.id);
      db.save();
    }
    res.json({ success: true });
  });

  app.post('/api/voice-rooms/toggle-mute', (req, res) => {
    const { roomId } = req.body;
    const state = db.getState();
    const room = state.voiceRooms.find((r) => r.id === roomId);
    const actorUser = getActorUser(state);
    if (room) {
      const participant = room.participants.find((p) => p.user.id === actorUser.id);
      if (participant) {
        participant.isMuted = !participant.isMuted;
        if (participant.isMuted) {
          participant.isSpeaking = false;
        }
        db.save();
        return res.json(room);
      }
    }
    res.status(404).json({ error: 'Participant or room not found' });
  });

  // Flows
  app.get('/api/flows', (req, res) => {
    const state = db.getState();
    const actorUser = getActorUser(state);

    const enriched = (state.flows || []).map((f) => {
      const isLiked = f.likedBy ? f.likedBy.includes(actorUser.id) : Boolean(f.isLiked);
      const isSaved = f.savedBy
        ? f.savedBy.includes(actorUser.id)
        : Boolean(actorUser.savedFlowIds?.includes(f.id) || f.isSaved);
      const author = f.creator || f.author;
      const isFollowing = Boolean(actorUser.followingIds?.includes(author.id) || author.isFollowing);

      return {
        ...f,
        isLiked,
        isSaved,
        author: {
          ...author,
          isFollowing,
          followersCount: author.followersCount || 120,
        },
      };
    });

    res.json(enriched);
  });

  app.post('/api/flows', (req, res) => {
    const { title, description, duration, type, codeSnippet, tags } = req.body;
    const state = db.getState();
    const actorUser = getActorUser(state);
    const newFlow: Flow = {
      id: `flow_${Date.now()}`,
      author: actorUser,
      title: title || 'New Flow Moment',
      description: description || 'Creative/technical share under 4 minutes.',
      duration: duration || '02:00',
      type: type || 'code_walkthrough',
      codeSnippet: codeSnippet || undefined,
      likes: 0,
      isLiked: false,
      likedBy: [],
      savesCount: 0,
      isSaved: false,
      savedBy: [],
      sharesCount: 0,
      views: 1,
      commentsCount: 0,
      createdAt: 'Just now',
      tags: Array.isArray(tags) ? tags : ['Tsuna', 'Flow'],
    };
    state.flows.unshift(newFlow);
    db.save();
    res.json(newFlow);
  });

  app.post('/api/flows/:id/like', (req, res) => {
    const state = db.getState();
    const flow = state.flows.find((f) => f.id === req.params.id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    const actorUser = getActorUser(state);
    if (!flow.likedBy) {
      flow.likedBy = flow.isLiked ? [actorUser.id] : [];
    }
    const isAlreadyLiked = flow.likedBy.includes(actorUser.id);
    if (isAlreadyLiked) {
      flow.likedBy = flow.likedBy.filter((uid) => uid !== actorUser.id);
      flow.isLiked = false;
      flow.likes = Math.max(0, flow.likes - 1);
    } else {
      flow.likedBy.push(actorUser.id);
      flow.isLiked = true;
      flow.likes = (flow.likes || 0) + 1;

      // Trigger notification
      const author = flow.creator || flow.author;
      if (author && author.id !== actorUser.id) {
        if (!state.notifications) state.notifications = [];
        state.notifications.unshift({
          id: `notif_${Date.now()}`,
          type: 'reaction',
          title: 'Flow Appreciated',
          description: `${actorUser.name} liked your technical flow "${flow.title.slice(0, 32)}..."`,
          timestamp: 'Just now',
          isRead: false,
          linkTab: 'flows',
          linkId: flow.id,
          actor: {
            name: actorUser.name,
            avatar: actorUser.avatar,
            username: actorUser.username,
          },
        });
      }
    }
    db.save();
    res.json(flow);
  });

  app.post('/api/flows/:id/save', (req, res) => {
    const state = db.getState();
    const flow = state.flows.find((f) => f.id === req.params.id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    const actorUser = getActorUser(state);
    if (!flow.savedBy) {
      flow.savedBy = flow.isSaved ? [actorUser.id] : [];
    }
    if (!actorUser.savedFlowIds) {
      actorUser.savedFlowIds = [];
    }

    const isAlreadySaved =
      flow.savedBy.includes(actorUser.id) || actorUser.savedFlowIds.includes(flow.id);

    if (isAlreadySaved) {
      flow.savedBy = flow.savedBy.filter((uid) => uid !== actorUser.id);
      actorUser.savedFlowIds = actorUser.savedFlowIds.filter((fid) => fid !== flow.id);
      flow.isSaved = false;
      flow.savesCount = Math.max(0, (flow.savesCount || 1) - 1);
    } else {
      flow.savedBy.push(actorUser.id);
      if (!actorUser.savedFlowIds.includes(flow.id)) {
        actorUser.savedFlowIds.push(flow.id);
      }
      flow.isSaved = true;
      flow.savesCount = (flow.savesCount || 0) + 1;
    }
    db.save();
    res.json(flow);
  });

  app.post('/api/flows/:id/share', (req, res) => {
    const state = db.getState();
    const flow = state.flows.find((f) => f.id === req.params.id);
    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }
    flow.sharesCount = (flow.sharesCount || 0) + 1;
    db.save();
    res.json(flow);
  });

  app.post('/api/users/:id/follow', (req, res) => {
    const state = db.getState();
    const targetUserId = req.params.id;
    const actorUser = getActorUser(state);

    if (targetUserId === actorUser.id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    if (!actorUser.followingIds) {
      actorUser.followingIds = [];
    }

    let targetUser = state.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      for (const f of state.flows) {
        if (f.author?.id === targetUserId) {
          targetUser = f.author;
          break;
        }
        if (f.creator?.id === targetUserId) {
          targetUser = f.creator;
          break;
        }
      }
    }

    const isCurrentlyFollowing = actorUser.followingIds.includes(targetUserId);
    let nextFollowingState = false;

    if (isCurrentlyFollowing) {
      actorUser.followingIds = actorUser.followingIds.filter((uid) => uid !== targetUserId);
      if (targetUser) {
        targetUser.followersCount = Math.max(0, (targetUser.followersCount || 1) - 1);
        targetUser.isFollowing = false;
      }
      nextFollowingState = false;
    } else {
      actorUser.followingIds.push(targetUserId);
      if (targetUser) {
        targetUser.followersCount = (targetUser.followersCount || 0) + 1;
        targetUser.isFollowing = true;
      }
      nextFollowingState = true;

      // Notify followed user
      if (!state.notifications) state.notifications = [];
      state.notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'collab',
        title: 'New Follower',
        description: `${actorUser.name} (@${actorUser.username}) started following your technical flows and updates.`,
        timestamp: 'Just now',
        isRead: false,
        linkTab: 'flows',
        actor: {
          name: actorUser.name,
          avatar: actorUser.avatar,
          username: actorUser.username,
        },
      });
    }

    // Sync across all flows
    state.flows.forEach((f) => {
      if (f.author?.id === targetUserId) {
        f.author.isFollowing = nextFollowingState;
        if (targetUser?.followersCount !== undefined) {
          f.author.followersCount = targetUser.followersCount;
        }
      }
      if (f.creator?.id === targetUserId) {
        f.creator.isFollowing = nextFollowingState;
        if (targetUser?.followersCount !== undefined) {
          f.creator.followersCount = targetUser.followersCount;
        }
      }
    });

    db.save();
    res.json({
      success: true,
      isFollowing: nextFollowingState,
      followersCount: targetUser?.followersCount || 0,
      user: targetUser,
    });
  });

  // Dedicated Handle Lookup & Landing Resolution
  app.get('/api/users/by-handle/:handle', (req, res) => {
    try {
      const state = db.getState();
      const rawHandle = req.params.handle || '';
      const cleanHandle = rawHandle.replace(/^[@/]+|^u\/|^user\//i, '').trim().toLowerCase();

      if (!cleanHandle) {
        return res.status(400).json({ error: 'Valid handle parameter is required' });
      }

      // Check current users in state
      let targetUser = state.users.find(
        (u) =>
          u.username.toLowerCase() === cleanHandle ||
          u.id.toLowerCase() === cleanHandle ||
          u.name.toLowerCase().replace(/\s+/g, '_') === cleanHandle
      );

      // If not in state.users, check if author of any flow or post
      if (!targetUser) {
        for (const f of state.flows) {
          const author = f.creator || f.author;
          if (
            author.username.toLowerCase() === cleanHandle ||
            author.id.toLowerCase() === cleanHandle ||
            author.name.toLowerCase().replace(/\s+/g, '_') === cleanHandle
          ) {
            targetUser = { ...author };
            state.users.push(targetUser);
            db.save();
            break;
          }
        }
      }

      if (!targetUser) {
        for (const p of state.posts) {
          if (
            p.author &&
            (p.author.username.toLowerCase() === cleanHandle ||
              p.author.id.toLowerCase() === cleanHandle ||
              p.author.name.toLowerCase().replace(/\s+/g, '_') === cleanHandle)
          ) {
            targetUser = { ...p.author };
            state.users.push(targetUser);
            db.save();
            break;
          }
        }
      }

      // Check if current user in state matches
      if (!targetUser && state.currentUser) {
        if (
          state.currentUser.username.toLowerCase() === cleanHandle ||
          state.currentUser.id.toLowerCase() === cleanHandle
        ) {
          targetUser = state.currentUser;
        }
      }

      if (!targetUser) {
        return res.json({
          exists: false,
          handle: cleanHandle,
          message: `No account exists yet with handle @${cleanHandle}. Available to claim!`,
        });
      }

      // Check if the current device/session is authenticated as this user
      const isDeviceAuthenticated = Boolean(
        state.currentUser &&
          (state.currentUser.id === targetUser.id ||
            state.currentUser.username.toLowerCase() === cleanHandle)
      );

      // Collect user's authored posts, flows, and joined communities
      const userPosts = state.posts.filter(
        (p) =>
          p.author?.id === targetUser.id ||
          p.author?.username.toLowerCase() === cleanHandle
      );

      const userFlows = state.flows.filter((f) => {
        const a = f.creator || f.author;
        return a?.id === targetUser.id || a?.username.toLowerCase() === cleanHandle;
      });

      const userCommunities = state.communities.filter(
        (c) =>
          c.isJoined ||
          (targetUser?.skills && c.tags.some((t) => targetUser.skills.includes(t)))
      );

      // Obfuscate email for privacy when sent to unauthenticated devices
      let maskedEmail: string | undefined = undefined;
      if (targetUser.email) {
        const [userPart, domain] = targetUser.email.split('@');
        maskedEmail =
          userPart.length > 2
            ? `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`
            : `***@${domain}`;
      }

      return res.json({
        exists: true,
        user: {
          ...targetUser,
          // If on different unverified device, hide sensitive private fields
          email: isDeviceAuthenticated ? targetUser.email : maskedEmail,
        },
        hasEmail: Boolean(targetUser.email),
        maskedEmail,
        isDeviceAuthenticated,
        posts: userPosts,
        flows: userFlows,
        communities: userCommunities,
      });
    } catch (err: any) {
      console.error('Error fetching user by handle:', err);
      return res.status(500).json({ error: 'Failed to look up handle' });
    }
  });

  // Send Device Verification OTP for a Handle
  app.post('/api/auth/send-device-otp', async (req, res) => {
    try {
      const { handle, email } = req.body;
      const state = db.getState();
      const cleanHandle = String(handle || '').replace(/^[@/]+|^u\/|^user\//i, '').trim().toLowerCase();

      let targetUser = state.users.find(
        (u) => u.username.toLowerCase() === cleanHandle || u.id.toLowerCase() === cleanHandle
      );

      if (!targetUser) {
        for (const f of state.flows) {
          const a = f.creator || f.author;
          if (a.username.toLowerCase() === cleanHandle || a.id.toLowerCase() === cleanHandle) {
            targetUser = { ...a };
            state.users.push(targetUser);
            db.save();
            break;
          }
        }
      }

      let destEmail = (email || targetUser?.email || '').trim().toLowerCase();
      if (!destEmail) {
        destEmail = `${cleanHandle}@tsuna.dev`;
      }

      // Generate 6-digit OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(destEmail, {
        code,
        expiresAt,
        attempts: 0,
        email: destEmail,
      });

      console.log(`[Device Auth OTP] Verification code for @${cleanHandle} (${destEmail}): ${code}`);

      // Attempt Brevo transactional email
      try {
        const emailBody = {
          sender: {
            name: BREVO_SENDER_NAME,
            email: BREVO_SENDER_EMAIL,
          },
          to: [{ email: destEmail }],
          subject: `Tsuna Device Verification Code: ${code} for @${cleanHandle}`,
          htmlContent: `
            <div style="font-family: -apple-system, sans-serif; background-color: #0a0a0a; color: #ededed; padding: 32px 16px;">
              <div style="max-width: 480px; margin: 0 auto; background: #141416; border: 1px solid #27272a; border-radius: 16px; padding: 32px;">
                <h2 style="color: #ffffff; margin-top: 0;">Tsuna Device Verification</h2>
                <p style="color: #a1a1aa; font-size: 14px;">
                  A new device is requesting access to the creator profile <strong>@${cleanHandle}</strong> on Tsuna.
                </p>
                <div style="background: #1f1f23; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                  <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
                </div>
                <p style="color: #71717a; font-size: 12px; margin-bottom: 0;">
                  This code expires in 10 minutes. If you did not initiate this request, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        };

        await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json',
          },
          body: JSON.stringify(emailBody),
        });
      } catch (brevoErr) {
        console.warn('Brevo dispatch warning (OTP logged to console):', brevoErr);
      }

      const [userPart, domain] = destEmail.split('@');
      const masked = userPart.length > 2
        ? `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`
        : `***@${domain}`;

      return res.json({
        success: true,
        destEmail,
        maskedEmail: masked,
        codePreview: process.env.NODE_ENV !== 'production' ? code : undefined,
        message: `Verification code sent to ${masked}. Check your inbox!`,
      });
    } catch (err: any) {
      console.error('Error sending device OTP:', err);
      return res.status(500).json({ error: 'Failed to send verification code' });
    }
  });

  // Verify Device OTP and Establish Session on this Device
  app.post('/api/auth/verify-device-otp', (req, res) => {
    try {
      const { handle, email, otp } = req.body;
      const state = db.getState();
      const cleanHandle = String(handle || '').replace(/^[@/]+|^u\/|^user\//i, '').trim().toLowerCase();
      const cleanOtp = String(otp || '').trim();

      let targetUser = state.users.find(
        (u) => u.username.toLowerCase() === cleanHandle || u.id.toLowerCase() === cleanHandle
      );

      if (!targetUser) {
        for (const f of state.flows) {
          const a = f.creator || f.author;
          if (a.username.toLowerCase() === cleanHandle || a.id.toLowerCase() === cleanHandle) {
            targetUser = { ...a };
            state.users.push(targetUser);
            break;
          }
        }
      }

      const destEmail = (email || targetUser?.email || `${cleanHandle}@tsuna.dev`).trim().toLowerCase();
      const record = otpStore.get(destEmail);

      if (!record) {
        return res.status(400).json({ error: 'No active verification code found. Please request a new code.' });
      }

      if (record.expiresAt < Date.now()) {
        otpStore.delete(destEmail);
        return res.status(400).json({ error: 'Verification code expired. Please request a new code.' });
      }

      if (record.code !== cleanOtp) {
        record.attempts += 1;
        if (record.attempts >= 5) {
          otpStore.delete(destEmail);
          return res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code.' });
        }
        return res.status(400).json({ error: `Incorrect code (${5 - record.attempts} attempts remaining).` });
      }

      // Valid OTP!
      otpStore.delete(destEmail);

      // If user didn't exist in state.users, create them
      if (!targetUser) {
        targetUser = {
          id: `usr_${cleanHandle}_${Date.now().toString(36)}`,
          name: cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1),
          username: cleanHandle,
          email: destEmail,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
          banner: `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80`,
          bio: `Creator & builder @${cleanHandle} on Tsuna.`,
          roleTitle: 'Independent Creator',
          skills: ['WebGPU', 'Creative Tech'],
          isOnline: true,
          isDemo: false,
        };
        state.users.push(targetUser);
      } else {
        if (!targetUser.email && destEmail) {
          targetUser.email = destEmail;
        }
        targetUser.isOnline = true;
      }

      // Authenticate this device!
      state.currentUser = targetUser;
      db.save();

      return res.json({
        success: true,
        user: targetUser,
        message: `Device successfully verified. Logged in as @${targetUser.username}`,
      });
    } catch (err: any) {
      console.error('Error verifying device OTP:', err);
      return res.status(500).json({ error: 'Failed to verify code' });
    }
  });

  // Verify Device via Google Auth
  app.post('/api/auth/verify-device-google', (req, res) => {
    try {
      const { handle, googleUser } = req.body;
      const state = db.getState();
      const cleanHandle = String(handle || '').replace(/^[@/]+|^u\/|^user\//i, '').trim().toLowerCase();

      if (!googleUser || !googleUser.uid) {
        return res.status(400).json({ error: 'Valid Google user credentials required' });
      }

      let targetUser = state.users.find(
        (u) => u.username.toLowerCase() === cleanHandle || u.id.toLowerCase() === cleanHandle
      );

      if (!targetUser) {
        // Create user with this handle linked to Google
        targetUser = {
          id: googleUser.uid,
          name: googleUser.name || googleUser.displayName || cleanHandle,
          username: cleanHandle,
          email: googleUser.email,
          avatar: googleUser.photoURL || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80`,
          banner: `https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80`,
          bio: `Verified creator on Tsuna authenticated via Google.`,
          roleTitle: 'Independent Creator',
          skills: ['Creative Tech', 'TypeScript'],
          isOnline: true,
          isDemo: false,
        };
        state.users.push(targetUser);
      } else {
        targetUser.email = googleUser.email || targetUser.email;
        targetUser.isOnline = true;
      }

      // Authenticate device
      state.currentUser = targetUser;
      db.save();

      return res.json({
        success: true,
        user: targetUser,
        message: `Device verified via Google. Logged in as @${targetUser.username}`,
      });
    } catch (err: any) {
      console.error('Error verifying device with Google:', err);
      return res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  });

  // Global Search
  app.get('/api/search', (req, res) => {
    const q = ((req.query.q as string) || '').toLowerCase();
    const type = (req.query.type as string) || 'all';
    const state = db.getState();

    let matchingCommunities = state.communities;
    let matchingPosts = state.posts;
    let matchingEvents = state.events;
    let matchingCreators = state.users;

    if (q) {
      matchingCommunities = state.communities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
      matchingPosts = state.posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.codeSnippet && p.codeSnippet.code.toLowerCase().includes(q))
      );
      matchingEvents = state.events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
      matchingCreators = state.users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.roleTitle.toLowerCase().includes(q) ||
          u.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (type === 'communities') {
      matchingPosts = [];
      matchingEvents = [];
      matchingCreators = [];
    } else if (type === 'code') {
      matchingCommunities = [];
      matchingEvents = [];
      matchingCreators = [];
      matchingPosts = matchingPosts.filter((p) => p.postType === 'code' || p.codeSnippet);
    } else if (type === 'creators') {
      matchingCommunities = [];
      matchingPosts = [];
      matchingEvents = [];
    } else if (type === 'events') {
      matchingCommunities = [];
      matchingPosts = [];
      matchingCreators = [];
    }

    res.json({
      communities: matchingCommunities,
      posts: matchingPosts,
      events: matchingEvents,
      creators: matchingCreators,
    });
  });

  // Share into chat or community
  app.post('/api/share', (req, res) => {
    const { targetType, targetId, itemType, itemData, message } = req.body;
    const state = db.getState();

    if (targetType === 'chat') {
      const conv = state.conversations.find((c) => c.id === targetId);
      if (conv) {
        if (!state.messages[conv.id]) {
          state.messages[conv.id] = [];
        }
        const textContent = message
          ? `${message}\n\n[Shared ${itemType}: "${itemData.title || itemData.name || 'Item'}"]`
          : `Shared ${itemType}: "${itemData.title || itemData.name || 'Item'}"`;

        const actorUser = getActorUser(state);
        const newMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          conversationId: conv.id,
          sender: actorUser,
          text: textContent,
          codeSnippet: itemData.codeSnippet,
          attachment: itemData.attachment,
          timestamp: 'Just now',
          reactions: [{ emoji: '👀', count: 1, users: [actorUser.id] }],
        };
        state.messages[conv.id].push(newMsg);
        conv.lastMessage = {
          text: `Shared ${itemType}`,
          timestamp: 'Just now',
          senderName: actorUser.name,
        };
      }
    } else if (targetType === 'community') {
      const comm = state.communities.find((c) => c.id === targetId);
      if (comm) {
        const actorUser = getActorUser(state);
        const newPost: Post = {
          id: `post_${Date.now()}`,
          author: actorUser,
          communityId: comm.id,
          communityName: comm.name,
          title: `Shared: ${itemData.title || itemData.name || 'Creation'}`,
          content: message || `Cross-shared from Tsuna collaborative workspace.`,
          postType: itemData.postType || 'general',
          codeSnippet: itemData.codeSnippet,
          attachment: itemData.attachment,
          image: itemData.image,
          likes: 0,
          isLiked: false,
          commentsCount: 0,
          createdAt: 'Just now',
          tags: ['Shared', 'Collab'],
        };
        state.posts.unshift(newPost);
        state.comments[newPost.id] = [];
      }
    }

    db.save();
    res.json({ success: true, message: 'Shared successfully!' });
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tsuna full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
