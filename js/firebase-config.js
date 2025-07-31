// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage, connectStorageEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  // TODO: Replace with your actual Firebase config
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable emulators for development (comment out for production)
if (window.location.hostname === 'localhost') {
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Emulators already connected or not available:', error.message);
  }
}

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  CONTESTS: 'contests',
  SUBMISSIONS: 'submissions',
  LIKES: 'likes',
  VOTES: 'votes',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications'
};

// Storage paths
export const STORAGE_PATHS = {
  AVATARS: 'avatars',
  CONTEST_MEDIA: 'contest-media',
  SUBMISSIONS: 'submissions',
  THUMBNAILS: 'thumbnails'
};

// App configuration
export const APP_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_VIDEO_FORMATS: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_AUDIO_FORMATS: ['audio/mp3', 'audio/wav', 'audio/ogg'],
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_VIDEO_DURATION: 300, // 5 minutes
  PAGINATION_LIMIT: 10,
  CONTEST_MIN_DURATION: 3600000, // 1 hour in milliseconds
  CONTEST_MAX_DURATION: 2592000000, // 30 days in milliseconds
};

// User default data
export const DEFAULT_USER_DATA = {
  displayName: '',
  bio: '',
  location: '',
  website: '',
  socialLinks: {
    instagram: '',
    tiktok: '',
    youtube: ''
  },
  stats: {
    contestsCreated: 0,
    submissionsMade: 0,
    totalWins: 0,
    totalLikes: 0,
    followers: 0,
    following: 0
  },
  achievements: [],
  settings: {
    profilePublic: true,
    showEmail: false,
    allowMessages: true,
    emailNotifications: true,
    pushNotifications: true,
    contestReminders: true
  },
  createdAt: null,
  updatedAt: null,
  lastActive: null
};

// Contest status enum
export const CONTEST_STATUS = {
  ACTIVE: 'active',
  ENDED: 'ended',
  DRAFT: 'draft'
};

// Submission status enum
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Media types
export const MEDIA_TYPES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image'
};

// Achievement types
export const ACHIEVEMENTS = {
  FIRST_WIN: 'first_win',
  WIN_STREAK: 'win_streak',
  POPULAR_SUBMISSION: 'popular_submission',
  CONTEST_CREATOR: 'contest_creator',
  SOCIAL_BUTTERFLY: 'social_butterfly',
  VETERAN: 'veteran'
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_EMAIL: 'Please enter a valid email address',
    WEAK_PASSWORD: 'Password should be at least 6 characters',
    USER_NOT_FOUND: 'No user found with this email',
    WRONG_PASSWORD: 'Incorrect password',
    EMAIL_IN_USE: 'Email is already in use',
    NETWORK_ERROR: 'Network error. Please check your connection'
  },
  UPLOAD: {
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_FORMAT: 'File format not supported',
    UPLOAD_FAILED: 'Upload failed. Please try again',
    NETWORK_ERROR: 'Network error during upload'
  },
  CONTEST: {
    INVALID_DURATION: 'Contest duration must be between 1 hour and 30 days',
    MISSING_FIELDS: 'Please fill in all required fields',
    MEDIA_REQUIRED: 'Please upload contest media',
    CREATION_FAILED: 'Failed to create contest'
  },
  GENERAL: {
    UNKNOWN_ERROR: 'An unexpected error occurred',
    PERMISSION_DENIED: 'Permission denied',
    NOT_FOUND: 'Resource not found'
  }
};

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    SIGNUP_SUCCESS: 'Account created successfully!',
    LOGIN_SUCCESS: 'Welcome back!',
    LOGOUT_SUCCESS: 'Logged out successfully',
    PASSWORD_RESET: 'Password reset email sent'
  },
  CONTEST: {
    CREATED: 'Contest created successfully!',
    UPDATED: 'Contest updated successfully!',
    DELETED: 'Contest deleted successfully!'
  },
  SUBMISSION: {
    SUBMITTED: 'Submission uploaded successfully!',
    DELETED: 'Submission deleted successfully!'
  },
  PROFILE: {
    UPDATED: 'Profile updated successfully!',
    AVATAR_UPDATED: 'Profile picture updated!'
  }
};

// Utility functions
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (milliseconds) => {
  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const getTimeAgo = (timestamp) => {
  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m ago`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  } else if (diffInSeconds < 2592000) {
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  } else {
    return time.toLocaleDateString();
  }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Debug mode
export const DEBUG = window.location.hostname === 'localhost';

if (DEBUG) {
  console.log('🔥 Firebase initialized in debug mode');
  console.log('📱 App config:', APP_CONFIG);
}

export default app;