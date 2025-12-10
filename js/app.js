/* ========================================
   CBT EXAM SIMULATOR - MAIN APP JAVASCRIPT
   Utility Functions & General Features
   ======================================== */

/**
 * Utility object containing helper functions used across the application
 */
const AppUtils = {
  /**
   * Format time in seconds to MM:SS format
   * @param {number} seconds - Total seconds
   * @returns {string} Formatted time string (MM:SS)
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  },

  /**
   * Calculate test score and percentage
   * @param {number} correct - Number of correct answers
   * @param {number} total - Total number of questions
   * @returns {object} Score object with score, percentage, and status
   */
  calculateScore(correct, total) {
    const percentage = Math.round((correct / total) * 100);
    const passingPercentage = 40;

    return {
      correct,
      total,
      percentage,
      passed: percentage >= passingPercentage,
      status: percentage >= passingPercentage ? "PASSED" : "FAILED",
    };
  },

  /**
   * Validate email format
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Get data from localStorage
   * @param {string} key - Key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Retrieved data or default value
   */
  getFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Save data to localStorage
   * @param {string} key - Key to save under
   * @param {*} value - Value to save
   * @returns {boolean} True if successful
   */
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
      return false;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - Key to remove
   * @returns {boolean} True if successful
   */
  removeFromLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },

  /**
   * Get current timestamp
   * @returns {string} ISO timestamp string
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  },

  /**
   * Format date to readable format
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Calculate time difference between two timestamps
   * @param {string} startTime - Start timestamp
   * @param {string} endTime - End timestamp
   * @returns {string} Formatted duration (MM:SS)
   */
  calculateDuration(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const diffSeconds = Math.floor((end - start) / 1000);
    return this.formatTime(diffSeconds);
  },

  /**
   * Show notification message
   * @param {string} message - Message to display
   * @param {string} type - Type: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds
   */
  showNotification(message, type = "info", duration = 3000) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background-color: ${this.getNotificationColor(type)};
            color: white;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, duration);
  },

  /**
   * Get color for notification type
   * @param {string} type - Notification type
   * @returns {string} Color value
   */
  getNotificationColor(type) {
    const colors = {
      success: "#2ecc71",
      error: "#e74c3c",
      warning: "#f39c12",
      info: "#3498db",
    };
    return colors[type] || colors.info;
  },

  /**
   * Add CSS animation
   * @param {string} name - Animation name
   * @param {string} keyframes - CSS keyframes
   */
  addAnimation(name, keyframes) {
    const style = document.createElement("style");
    style.innerHTML = `@keyframes ${name} { ${keyframes} }`;
    document.head.appendChild(style);
  },

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user data exists
   */
  isAuthenticated() {
    return !!this.getFromLocalStorage("userData");
  },

  /**
   * Get authenticated user data
   * @returns {object|null} User data or null if not authenticated
   */
  getAuthenticatedUser() {
    return this.getFromLocalStorage("userData");
  },

  /**
   * Logout user (clear session data)
   */
  logout() {
    this.removeFromLocalStorage("userData");
    this.removeFromLocalStorage("examAnswers");
    this.removeFromLocalStorage("examResults");
    window.location.href = "login.html";
  },

  /**
   * Redirect to page
   * @param {string} page - Page name or path
   */
  redirect(page) {
    window.location.href = page;
  },

  /**
   * Check if exam is in progress
   * @returns {boolean} True if exam data exists
   */
  isExamInProgress() {
    return !!this.getFromLocalStorage("examAnswers");
  },

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML string to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  },
};

/**
 * Initialize global event listeners
 */
document.addEventListener("DOMContentLoaded", function () {
  // Add any global initialization here

  // Check authentication on protected pages
  const protectedPages = ["instructions.html", "exam.html", "results.html"];
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  if (protectedPages.some((page) => currentPage.includes(page))) {
    if (!AppUtils.isAuthenticated()) {
      AppUtils.redirect("login.html");
    }
  }
});

/**
 * Handle page unload warning for exam page
 */
window.addEventListener("beforeunload", function (e) {
  if (AppUtils.isExamInProgress()) {
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
});

/**
 * Global error handler
 */
window.addEventListener("error", function (e) {
  console.error("Global error:", e.error);
  AppUtils.showNotification(
    "An error occurred. Please refresh the page.",
    "error"
  );
});

/**
 * Log app version
 */
console.log(
  "%cCBT Exam Simulator v1.0",
  "color: #2ecc71; font-size: 16px; font-weight: bold;"
);
console.log(
  "%cDeveloped for Educational Excellence",
  "color: #3498db; font-style: italic;"
);
