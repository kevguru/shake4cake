import { 
  auth, 
  db, 
  COLLECTIONS, 
  DEFAULT_USER_DATA, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  validateEmail,
  validatePassword,
  DEBUG 
} from './firebase-config.js';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.authListeners = [];
    this.profileListeners = [];
    this.unsubscribeAuth = null;
    this.unsubscribeProfile = null;
    
    this.init();
  }

  init() {
    // Listen for auth state changes
    this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        await this.loadUserProfile(user.uid);
        this.updateLastActive();
      } else {
        this.userProfile = null;
        if (this.unsubscribeProfile) {
          this.unsubscribeProfile();
          this.unsubscribeProfile = null;
        }
      }
      
      this.notifyAuthListeners(user);
      this.updateUI();
    });

    if (DEBUG) {
      console.log('🔐 Auth manager initialized');
    }
  }

  // Authentication methods
  async signUp(email, password, displayName) {
    try {
      if (!validateEmail(email)) {
        throw new Error(ERROR_MESSAGES.AUTH.INVALID_EMAIL);
      }
      
      if (!validatePassword(password)) {
        throw new Error(ERROR_MESSAGES.AUTH.WEAK_PASSWORD);
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: displayName || email.split('@')[0]
      });

      // Create user document in Firestore
      await this.createUserProfile(user, { displayName: displayName || email.split('@')[0] });

      this.showMessage(SUCCESS_MESSAGES.AUTH.SIGNUP_SUCCESS, 'success');
      return user;
    } catch (error) {
      console.error('Sign up error:', error);
      const message = this.getAuthErrorMessage(error);
      this.showMessage(message, 'error');
      throw error;
    }
  }

  async signIn(email, password) {
    try {
      if (!validateEmail(email)) {
        throw new Error(ERROR_MESSAGES.AUTH.INVALID_EMAIL);
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.showMessage(SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, 'success');
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      const message = this.getAuthErrorMessage(error);
      this.showMessage(message, 'error');
      throw error;
    }
  }

  async signInAnonymously() {
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;
      
      // Create anonymous user profile
      await this.createUserProfile(user, { 
        displayName: 'Guest User',
        isAnonymous: true 
      });

      this.showMessage('Signed in as guest', 'success');
      return user;
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      const message = this.getAuthErrorMessage(error);
      this.showMessage(message, 'error');
      throw error;
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      this.showMessage(SUCCESS_MESSAGES.AUTH.LOGOUT_SUCCESS, 'success');
    } catch (error) {
      console.error('Sign out error:', error);
      this.showMessage(ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR, 'error');
      throw error;
    }
  }

  async resetPassword(email) {
    try {
      if (!validateEmail(email)) {
        throw new Error(ERROR_MESSAGES.AUTH.INVALID_EMAIL);
      }

      await sendPasswordResetEmail(auth, email);
      this.showMessage(SUCCESS_MESSAGES.AUTH.PASSWORD_RESET, 'success');
    } catch (error) {
      console.error('Password reset error:', error);
      const message = this.getAuthErrorMessage(error);
      this.showMessage(message, 'error');
      throw error;
    }
  }

  async updatePassword(newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No user signed in');
      }

      if (!validatePassword(newPassword)) {
        throw new Error(ERROR_MESSAGES.AUTH.WEAK_PASSWORD);
      }

      await updatePassword(this.currentUser, newPassword);
      this.showMessage('Password updated successfully', 'success');
    } catch (error) {
      console.error('Update password error:', error);
      this.showMessage(this.getAuthErrorMessage(error), 'error');
      throw error;
    }
  }

  async deleteAccount() {
    try {
      if (!this.currentUser) {
        throw new Error('No user signed in');
      }

      // Delete user document from Firestore
      await this.deleteUserProfile(this.currentUser.uid);

      // Delete Firebase Auth user
      await deleteUser(this.currentUser);
      
      this.showMessage('Account deleted successfully', 'success');
    } catch (error) {
      console.error('Delete account error:', error);
      this.showMessage('Failed to delete account', 'error');
      throw error;
    }
  }

  // User profile methods
  async createUserProfile(user, additionalData = {}) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const userData = {
          ...DEFAULT_USER_DATA,
          ...additionalData,
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || additionalData.displayName || 'User',
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        };

        await setDoc(userRef, userData);
        
        if (DEBUG) {
          console.log('👤 User profile created:', userData);
        }
      }
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }

  async loadUserProfile(uid) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      // Set up real-time listener for user profile
      this.unsubscribeProfile = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          this.userProfile = { id: doc.id, ...doc.data() };
          this.notifyProfileListeners(this.userProfile);
        }
      });

    } catch (error) {
      console.error('Load user profile error:', error);
    }
  }

  async updateUserProfile(data) {
    try {
      if (!this.currentUser) {
        throw new Error('No user signed in');
      }

      const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);

      // Update Firebase Auth profile if displayName changed
      if (data.displayName && data.displayName !== this.currentUser.displayName) {
        await updateProfile(this.currentUser, {
          displayName: data.displayName
        });
      }

      this.showMessage(SUCCESS_MESSAGES.PROFILE.UPDATED, 'success');
    } catch (error) {
      console.error('Update user profile error:', error);
      this.showMessage('Failed to update profile', 'error');
      throw error;
    }
  }

  async updateLastActive() {
    try {
      if (!this.currentUser) return;

      const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
      await updateDoc(userRef, {
        lastActive: serverTimestamp()
      });
    } catch (error) {
      // Silently fail - not critical
      if (DEBUG) {
        console.log('Update last active failed:', error);
      }
    }
  }

  async deleteUserProfile(uid) {
    try {
      // In a real app, you might want to keep some data for analytics
      // For now, we'll just mark the user as deleted
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await updateDoc(userRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Delete user profile error:', error);
      throw error;
    }
  }

  // Listener management
  onAuthStateChange(callback) {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  onProfileChange(callback) {
    this.profileListeners.push(callback);
    // Call immediately with current state
    if (this.userProfile) {
      callback(this.userProfile);
    }
    
    // Return unsubscribe function
    return () => {
      this.profileListeners = this.profileListeners.filter(listener => listener !== callback);
    };
  }

  notifyAuthListeners(user) {
    this.authListeners.forEach(callback => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  notifyProfileListeners(profile) {
    this.profileListeners.forEach(callback => {
      try {
        callback(profile);
      } catch (error) {
        console.error('Profile listener error:', error);
      }
    });
  }

  // UI management
  updateUI() {
    // Update login/logout buttons
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');

    if (this.currentUser) {
      if (loginBtn) loginBtn.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (userGreeting) {
        userGreeting.textContent = `Hello, ${this.getUserDisplayName()}!`;
        userGreeting.classList.remove('hidden');
      }
    } else {
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (userGreeting) userGreeting.classList.add('hidden');
    }

    // Update any user-specific content
    this.updateUserSpecificContent();
  }

  updateUserSpecificContent() {
    // Update user avatar displays
    const avatars = document.querySelectorAll('[data-user-avatar]');
    avatars.forEach(avatar => {
      if (this.userProfile?.photoURL) {
        avatar.src = this.userProfile.photoURL;
      }
    });

    // Update user name displays
    const names = document.querySelectorAll('[data-user-name]');
    names.forEach(name => {
      name.textContent = this.getUserDisplayName();
    });
  }

  // Utility methods
  getUserDisplayName() {
    if (this.userProfile?.displayName) {
      return this.userProfile.displayName;
    }
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName;
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.split('@')[0];
    }
    return 'User';
  }

  isSignedIn() {
    return !!this.currentUser;
  }

  isAnonymous() {
    return this.currentUser?.isAnonymous || false;
  }

  requireAuth() {
    if (!this.isSignedIn()) {
      this.showLoginModal();
      throw new Error('Authentication required');
    }
    return this.currentUser;
  }

  showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.remove('hidden');
    }
  }

  hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  getAuthErrorMessage(error) {
    switch (error.code) {
      case 'auth/user-not-found':
        return ERROR_MESSAGES.AUTH.USER_NOT_FOUND;
      case 'auth/wrong-password':
        return ERROR_MESSAGES.AUTH.WRONG_PASSWORD;
      case 'auth/email-already-in-use':
        return ERROR_MESSAGES.AUTH.EMAIL_IN_USE;
      case 'auth/weak-password':
        return ERROR_MESSAGES.AUTH.WEAK_PASSWORD;
      case 'auth/invalid-email':
        return ERROR_MESSAGES.AUTH.INVALID_EMAIL;
      case 'auth/network-request-failed':
        return ERROR_MESSAGES.AUTH.NETWORK_ERROR;
      default:
        return error.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR;
    }
  }

  showMessage(message, type = 'info') {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '8px',
      color: 'white',
      fontWeight: '600',
      zIndex: '10000',
      animation: 'slideInRight 0.3s ease-out',
      maxWidth: '300px'
    });

    switch (type) {
      case 'success':
        toast.style.background = '#00d4aa';
        break;
      case 'error':
        toast.style.background = '#ff3333';
        break;
      case 'warning':
        toast.style.background = '#ffa500';
        break;
      default:
        toast.style.background = '#667eea';
    }

    document.body.appendChild(toast);

    // Remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  // Cleanup
  destroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
    if (this.unsubscribeProfile) {
      this.unsubscribeProfile();
    }
    this.authListeners = [];
    this.profileListeners = [];
  }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Set up global event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      authManager.showLoginModal();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      authManager.signOut();
    });
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        await authManager.signIn(email, password);
        authManager.hideLoginModal();
        loginForm.reset();
      } catch (error) {
        // Error already handled in signIn method
      }
    });
  }

  // Anonymous login button
  const anonymousBtn = document.getElementById('anonymousBtn');
  if (anonymousBtn) {
    anonymousBtn.addEventListener('click', async () => {
      try {
        await authManager.signInAnonymously();
        authManager.hideLoginModal();
      } catch (error) {
        // Error already handled in signInAnonymously method
      }
    });
  }

  // Modal close buttons
  const modalCloses = document.querySelectorAll('.modal-close');
  modalCloses.forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  });

  // Click outside modal to close
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.add('hidden');
    }
  });
});

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

export default authManager;