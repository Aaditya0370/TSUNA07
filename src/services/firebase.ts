import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc as firestoreSetDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Post } from '../types';

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Auth instance
export const auth = getAuth(app);

// Firestore Database instance
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Storage instance (for storing particular user ID's files and assets)
export const storage = getStorage(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Upload file to Google Firebase Storage under a particular user ID's folder
 */
export async function uploadUserFileToStorage(
  userId: string,
  file: File,
  folderName: 'avatars' | 'banners' | 'attachments' | 'shaders' = 'avatars'
): Promise<string> {
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `users/${userId}/${folderName}/${Date.now()}_${cleanFileName}`;
    const fileRef = storageRef(storage, path);
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error('Failed to upload file to Google Storage:', error);
    throw error;
  }
}

/**
 * Save / sync a particular user ID's profile document to Firestore
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    const dataToSave = {
      ...user,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userDocRef, dataToSave, { merge: true });
  } catch (error) {
    console.warn('Could not sync user to Firestore (fallback to local state):', error);
  }
}

/**
 * Fetch a particular user ID's profile document from Firestore
 */
export async function getUserFromFirestore(userId: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.warn(`Could not read user ${userId} from Firestore:`, error);
    return null;
  }
}

/**
 * Save user custom private data (e.g. bookmarks, draft shaders, settings) under particular user ID
 */
export async function saveUserDataToFirestore(
  userId: string,
  key: string,
  data: any
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'private_data', key);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn(`Could not save user data for ${userId}/${key}:`, error);
  }
}

/**
 * Get user custom private data under particular user ID
 */
export async function getUserDataFromFirestore(
  userId: string,
  key: string
): Promise<any | null> {
  try {
    const docRef = doc(db, 'users', userId, 'private_data', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.warn(`Could not read user data for ${userId}/${key}:`, error);
    return null;
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User; firebaseUser: FirebaseUser }> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  // Check if user document already exists in Firestore
  let existingProfile = await getUserFromFirestore(fbUser.uid);

  const cleanName = fbUser.displayName || 'Tsuna Creator';
  const cleanUsername = (fbUser.email?.split('@')[0] || `builder_${fbUser.uid.slice(0, 6)}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  const userProfile: User = existingProfile || {
    id: fbUser.uid,
    name: cleanName,
    username: cleanUsername,
    avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    bio: 'Collaborative builder and creative technologist on Tsuna.',
    roleTitle: 'Creator & Technologist',
    skills: ['TypeScript', 'WebGPU', 'Creative Tech'],
    links: {},
    externalAccounts: {},
    isOnline: true,
    isDemo: false,
    customStatus: 'Connected via Google Account',
    statusEmoji: '⚡',
    availability: 'available',
  };

  // If newly created or updated, persist to Firestore
  await saveUserToFirestore(userProfile);

  return { user: userProfile, firebaseUser: fbUser };
}

/**
 * Sign in with Email and Password
 */
export async function signInEmailPassword(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = cred.user;

  let profile = await getUserFromFirestore(fbUser.uid);
  if (!profile) {
    profile = {
      id: fbUser.uid,
      name: fbUser.displayName || email.split('@')[0],
      username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      bio: 'Builder on Tsuna.',
      roleTitle: 'Independent Creator',
      skills: ['TypeScript', 'Design'],
      isOnline: true,
      isDemo: false,
    };
    await saveUserToFirestore(profile);
  }
  return profile;
}

/**
 * Sign up with Email and Password
 */
export async function signUpEmailPassword(
  email: string,
  pass: string,
  displayName: string,
  roleTitle?: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = cred.user;

  if (displayName) {
    await firebaseUpdateProfile(fbUser, { displayName });
  }

  const newProfile: User = {
    id: fbUser.uid,
    name: displayName || email.split('@')[0],
    username: (displayName || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9_]/g, ''),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80',
    bio: 'Exploring and building collaboratively on Tsuna.',
    roleTitle: roleTitle || 'Independent Creator',
    skills: ['WebGPU', 'Creative Tech'],
    isOnline: true,
    isDemo: false,
    availability: 'available',
  };

  await saveUserToFirestore(newProfile);
  return newProfile;
}

/**
 * Sign out
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Save post to Firestore for global durable persistence
 */
export async function savePostToFirestore(post: Post): Promise<void> {
  try {
    const postRef = doc(db, 'posts', post.id);
    await setDoc(postRef, {
      ...post,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Could not save post to Firestore:', err);
  }
}

/**
 * Fetch persistent posts from Firestore
 */
export async function getFirestorePosts(): Promise<Post[]> {
  try {
    const snap = await getDocs(collection(db, 'posts'));
    const posts: Post[] = [];
    snap.forEach((d) => {
      posts.push(d.data() as Post);
    });
    return posts;
  } catch (err) {
    console.warn('Could not load posts from Firestore:', err);
    return [];
  }
}
