import { 
  APP_CONFIG, 
  formatFileSize, 
  formatDuration, 
  getTimeAgo,
  DEBUG 
} from './firebase-config.js';

// File validation utilities
export const validateFile = (file, type) => {
  const errors = [];

  // Check file size
  if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(APP_CONFIG.MAX_FILE_SIZE)})`);
  }

  // Check file type
  let allowedFormats = [];
  switch (type) {
    case 'video':
      allowedFormats = APP_CONFIG.SUPPORTED_VIDEO_FORMATS;
      break;
    case 'audio':
      allowedFormats = APP_CONFIG.SUPPORTED_AUDIO_FORMATS;
      break;
    case 'image':
      allowedFormats = APP_CONFIG.SUPPORTED_IMAGE_FORMATS;
      break;
    default:
      allowedFormats = [...APP_CONFIG.SUPPORTED_VIDEO_FORMATS, ...APP_CONFIG.SUPPORTED_AUDIO_FORMATS, ...APP_CONFIG.SUPPORTED_IMAGE_FORMATS];
  }

  if (!allowedFormats.includes(file.type)) {
    errors.push(`File type (${file.type}) is not supported. Allowed types: ${allowedFormats.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Get media duration (for video/audio files)
export const getMediaDuration = (file) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = file.type.startsWith('video/') ? 
      document.createElement('video') : 
      document.createElement('audio');
    
    element.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(element.duration);
    });
    
    element.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load media'));
    });
    
    element.src = url;
  });
};

// Generate thumbnail for video files
export const generateVideoThumbnail = (file, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(timeInSeconds, video.duration * 0.25);
    });
    
    video.addEventListener('seeked', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
    });
    
    video.addEventListener('error', reject);
    
    video.src = URL.createObjectURL(file);
  });
};

// Image resizing utility
export const resizeImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', quality);
      
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Countdown timer utility
export class CountdownTimer {
  constructor(endTime, callback) {
    this.endTime = new Date(endTime);
    this.callback = callback;
    this.interval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      const now = new Date();
      const timeLeft = this.endTime - now;
      
      if (timeLeft <= 0) {
        this.stop();
        this.callback({ expired: true, timeLeft: 0 });
      } else {
        this.callback({ expired: false, timeLeft });
      }
    }, 1000);
    
    // Call immediately
    const timeLeft = this.endTime - new Date();
    this.callback({ expired: timeLeft <= 0, timeLeft: Math.max(0, timeLeft) });
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
    }
  }

  static format(milliseconds) {
    if (milliseconds <= 0) return 'Expired';
    
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Infinite scroll utility
export class InfiniteScroll {
  constructor(container, loadMore, options = {}) {
    this.container = container;
    this.loadMore = loadMore;
    this.options = {
      threshold: 200, // Distance from bottom to trigger load
      ...options
    };
    
    this.loading = false;
    this.hasMore = true;
    this.observer = null;
    
    this.init();
  }

  init() {
    // Create intersection observer for the trigger element
    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !this.loading && this.hasMore) {
        this.load();
      }
    });

    // Create trigger element
    this.trigger = document.createElement('div');
    this.trigger.style.height = '20px';
    this.container.appendChild(this.trigger);
    this.observer.observe(this.trigger);
  }

  async load() {
    if (this.loading || !this.hasMore) return;
    
    this.loading = true;
    this.showLoading();
    
    try {
      const result = await this.loadMore();
      this.hasMore = result.hasMore !== false;
      
      if (!this.hasMore) {
        this.showNoMore();
      }
    } catch (error) {
      console.error('Infinite scroll load error:', error);
      this.showError();
    } finally {
      this.loading = false;
      this.hideLoading();
    }
  }

  showLoading() {
    if (!this.loadingEl) {
      this.loadingEl = document.createElement('div');
      this.loadingEl.className = 'infinite-scroll-loading';
      this.loadingEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          <i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>
          Loading more...
        </div>
      `;
    }
    this.container.appendChild(this.loadingEl);
  }

  hideLoading() {
    if (this.loadingEl && this.loadingEl.parentNode) {
      this.loadingEl.parentNode.removeChild(this.loadingEl);
    }
  }

  showNoMore() {
    if (!this.noMoreEl) {
      this.noMoreEl = document.createElement('div');
      this.noMoreEl.className = 'infinite-scroll-no-more';
      this.noMoreEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          No more items to load
        </div>
      `;
    }
    this.container.appendChild(this.noMoreEl);
  }

  showError() {
    if (!this.errorEl) {
      this.errorEl = document.createElement('div');
      this.errorEl.className = 'infinite-scroll-error';
      this.errorEl.innerHTML = `
        <div style="text-align: center; padding: 20px; color: var(--danger-color);">
          <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
          Failed to load more items
          <button onclick="this.parentNode.parentNode.remove(); location.reload();" 
                  style="margin-left: 10px; padding: 5px 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
            Retry
          </button>
        </div>
      `;
    }
    this.container.appendChild(this.errorEl);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.trigger && this.trigger.parentNode) {
      this.trigger.parentNode.removeChild(this.trigger);
    }
    this.hideLoading();
  }
}

// Debounce utility
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Local storage utilities
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// URL utilities
export const url = {
  getParams() {
    return new URLSearchParams(window.location.search);
  },

  getParam(name, defaultValue = null) {
    return this.getParams().get(name) || defaultValue;
  },

  setParam(name, value) {
    const params = this.getParams();
    params.set(name, value);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  },

  removeParam(name) {
    const params = this.getParams();
    params.delete(name);
    const newUrl = params.toString() ? 
      `${window.location.pathname}?${params.toString()}` : 
      window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
};

// Animation utilities
export const animate = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = performance.now();
    
    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    
    requestAnimationFrame(step);
  },

  fadeOut(element, duration = 300) {
    let start = performance.now();
    const startOpacity = parseFloat(getComputedStyle(element).opacity);
    
    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = startOpacity * (1 - progress);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.display = 'none';
      }
    }
    
    requestAnimationFrame(step);
  },

  slideUp(element, duration = 300) {
    const height = element.offsetHeight;
    element.style.height = height + 'px';
    element.style.overflow = 'hidden';
    
    let start = performance.now();
    
    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.height = (height * (1 - progress)) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
      }
    }
    
    requestAnimationFrame(step);
  },

  slideDown(element, duration = 300) {
    element.style.display = 'block';
    const height = element.scrollHeight;
    element.style.height = '0px';
    element.style.overflow = 'hidden';
    
    let start = performance.now();
    
    function step(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.height = (height * progress) + 'px';
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.style.height = '';
        element.style.overflow = '';
      }
    }
    
    requestAnimationFrame(step);
  }
};

// Form utilities
export const form = {
  serialize(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      if (data[key]) {
        // Handle multiple values (checkboxes, multiple selects)
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  },

  validate(formElement, rules = {}) {
    const errors = {};
    const formData = this.serialize(formElement);
    
    for (const [field, value] of Object.entries(formData)) {
      const fieldRules = rules[field];
      if (!fieldRules) continue;
      
      const fieldErrors = [];
      
      // Required validation
      if (fieldRules.required && (!value || value.toString().trim() === '')) {
        fieldErrors.push(`${field} is required`);
      }
      
      // Min length validation
      if (fieldRules.minLength && value && value.toString().length < fieldRules.minLength) {
        fieldErrors.push(`${field} must be at least ${fieldRules.minLength} characters`);
      }
      
      // Max length validation
      if (fieldRules.maxLength && value && value.toString().length > fieldRules.maxLength) {
        fieldErrors.push(`${field} must be no more than ${fieldRules.maxLength} characters`);
      }
      
      // Pattern validation
      if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
        fieldErrors.push(fieldRules.patternMessage || `${field} format is invalid`);
      }
      
      // Custom validation
      if (fieldRules.custom && value) {
        const customResult = fieldRules.custom(value);
        if (customResult !== true) {
          fieldErrors.push(customResult || `${field} is invalid`);
        }
      }
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: formData
    };
  },

  showErrors(formElement, errors) {
    // Clear previous errors
    const errorElements = formElement.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
    
    // Add new errors
    for (const [field, fieldErrors] of Object.entries(errors)) {
      const input = formElement.querySelector(`[name="${field}"]`);
      if (input) {
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = 'var(--danger-color)';
        errorElement.style.fontSize = '0.8rem';
        errorElement.style.marginTop = '4px';
        errorElement.textContent = fieldErrors[0]; // Show first error
        
        input.parentNode.appendChild(errorElement);
        input.style.borderColor = 'var(--danger-color)';
      }
    }
  },

  clearErrors(formElement) {
    const errorElements = formElement.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
    
    const inputs = formElement.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.style.borderColor = '';
    });
  }
};

// Performance monitoring
export const perf = {
  measure(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (DEBUG) {
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  async measureAsync(name, fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    if (DEBUG) {
      console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  }
};

// Export commonly used utilities
export { formatFileSize, formatDuration, getTimeAgo };

if (DEBUG) {
  console.log('🔧 Utils module loaded');
}