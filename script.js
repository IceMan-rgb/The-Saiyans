// Welcome Notification
document.addEventListener("DOMContentLoaded", function () {
  // Only show bankai notification on home page and only once
  const isHomePage =
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname.endsWith("/") ||
    window.location.pathname === "";
  const hasSeenBankai = localStorage.getItem("hasSeenBankai") === "true";

  if (isHomePage && !hasSeenBankai) {
    showNotification();
  }

  // Initialize fade-out effect after a brief delay to allow DOM to fully settle
  setTimeout(() => {
    initFadeOutOnScroll();
  }, 100);
});

// Fade Out Effect for Elements Leaving Top of Viewport
function initFadeOutOnScroll() {
  const options = {
    root: null,
    rootMargin: "0px 0px 0px 0px",
    threshold: [0, 0.1, 0.5],
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      // Skip notification elements to avoid circular issues
      if (
        entry.target.classList.contains("notification") ||
        entry.target.classList.contains("notification-backdrop")
      ) {
        return;
      }

      // Get the element's position relative to viewport
      const rect = entry.boundingClientRect;
      const isAboveViewport = rect.bottom < 0;

      if (isAboveViewport) {
        // Element is above viewport - apply fade out
        if (!entry.target.classList.contains("fade-out-top")) {
          entry.target.classList.add("fade-out-top");
        }
      } else {
        // Element is visible or below viewport - remove fade out
        if (entry.target.classList.contains("fade-out-top")) {
          entry.target.classList.remove("fade-out-top");
        }
      }
    });
  }, options);

  // Observe all main content elements (sections, divs, etc.) - excluding notification elements
  const elementsToObserve = document.querySelectorAll(
    "section:not(.notification), article, .container, h1, h2, h3, p, ul, li, #BOD > div",
  );

  elementsToObserve.forEach((element) => {
    observer.observe(element);
  });
}

function showNotification() {
  // Mark that user has seen the bankai notification
  localStorage.setItem("hasSeenBankai", "true");

  // Disable scrolling
  document.body.style.overflow = "hidden";

  // Create backdrop overlay
  const backdrop = document.createElement("div");
  backdrop.className = "notification-backdrop";
  document.body.appendChild(backdrop);

  // Create notification container
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <div class="notification-content">
      <h3>🎌 Welcome, Anime Warrior! 🎌</h3>
      <p>You have awakened to the greatest anime association in the universe! Prepare for an epic journey through anime realms! ⚔️</p>
      <div class="notification-buttons">
        <button class="close-notification">×</button>
        <button class="bankai-btn">Bankai Mode!</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Close button functionality
  const closeBtn = notification.querySelector(".close-notification");
  closeBtn.addEventListener("click", function () {
    notification.classList.add("fade-out");
    backdrop.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
      backdrop.remove();
      // Re-enable scrolling
      document.body.style.overflow = "auto";
    }, 500);
  });

  // Bankai button functionality
  const bankaiBtn = notification.querySelector(".bankai-btn");
  bankaiBtn.addEventListener("click", function () {
    notification.classList.add("bankai-mode");
    backdrop.classList.add("bankai-mode");
    setTimeout(() => {
      notification.remove();
      backdrop.remove();
      // Re-enable scrolling
      document.body.style.overflow = "auto";
    }, 800);
  });
}

// ===== COMMENT SYSTEM =====

// Initialize comment system when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize comment system
  initCommentSystem();
  // Initialize sidebar
  initSidebar();
});

function initCommentSystem() {
  loadComments();
  setupCommentForm();

  // Clean up old comments on page load
  cleanupOldComments();
}

function setupCommentForm() {
  const form = document.getElementById("commentForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const nameInput = document.getElementById("commentName");
    const textInput = document.getElementById("commentText");

    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
      showCommentNotification("Please fill in both name and message!", "error");
      return;
    }

    // Create comment object
    const comment = {
      id: Date.now().toString(),
      name: name,
      text: text,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    };

    // Save comment
    saveComment(comment);

    // Clear form
    nameInput.value = "";
    textInput.value = "";

    // Reload comments
    loadComments();

    // Show success message
    showCommentNotification("Comment posted successfully! 🎉", "success");
  });
}

function saveComment(comment) {
  // Use API instead of localStorage
  apiRequest("/comments", {
    method: "POST",
    body: JSON.stringify({
      text: comment.text,
      username: comment.name,
    }),
  })
    .then((data) => {
      console.log("Comment saved via API:", data);
    })
    .catch((error) => {
      console.error("Failed to save comment via API:", error);
      // Fallback to localStorage if API fails
      const comments = getStoredComments();
      comments.push(comment);
      localStorage.setItem("saiyans_comments", JSON.stringify(comments));
    });
}

function getStoredComments() {
  try {
    const stored = localStorage.getItem("saiyans_comments");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading comments:", e);
    return [];
  }
}

async function loadComments() {
  const commentsList = document.getElementById("commentsList");
  if (!commentsList) return;

  try {
    // Try to load from API first
    const data = await apiRequest("/comments");
    const comments = data.comments || [];

    if (comments.length === 0) {
      commentsList.innerHTML =
        '<div class="no-comments">No comments yet. Be the first to share your anime wisdom! 🌟</div>';
      return;
    }

    commentsList.innerHTML = comments
      .map((comment) => {
        const date = new Date(comment.timestamp);
        const formattedDate =
          date.toLocaleDateString() +
          " " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.username || comment.author_username)}</span>
            <span class="comment-date">${formattedDate}</span>
          </div>
          <div class="comment-text">${escapeHtml(comment.text).replace(/\n/g, "<br>")}</div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load comments from API:", error);
    // Fallback to localStorage
    const comments = getStoredComments();

    if (comments.length === 0) {
      commentsList.innerHTML =
        '<div class="no-comments">No comments yet. Be the first to share your anime wisdom! 🌟</div>';
      return;
    }

    commentsList.innerHTML = comments
      .map((comment) => {
        const date = new Date(comment.timestamp);
        const formattedDate =
          date.toLocaleDateString() +
          " " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${escapeHtml(comment.name)}</span>
            <span class="comment-date">${formattedDate}</span>
          </div>
          <div class="comment-text">${escapeHtml(comment.text).replace(/\n/g, "<br>")}</div>
        </div>
      `;
      })
      .join("");
  }
}

function cleanupOldComments() {
  const comments = getStoredComments();
  const now = new Date();

  // Filter out expired comments
  const validComments = comments.filter((comment) => {
    const expiresAt = new Date(comment.expiresAt);
    return expiresAt > now;
  });

  // Save cleaned comments back to storage
  localStorage.setItem("saiyans_comments", JSON.stringify(validComments));
}

function showCommentNotification(message, type = "info") {
  // Remove existing notification
  const existingNotification = document.querySelector(".comment-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `comment-notification ${type}`;
  notification.textContent = message;

  // Style the notification
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    color: "white",
    fontWeight: "bold",
    zIndex: "10000",
    animation: "slideInRight 0.3s ease-out",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  });

  // Set background color based on type
  if (type === "success") {
    notification.style.backgroundColor = "#25d366";
  } else if (type === "error") {
    notification.style.backgroundColor = "#ff6b6b";
  } else {
    notification.style.backgroundColor = "#00d4ff";
  }

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-in forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add notification animations to CSS dynamically
const notificationStyles = `
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

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
// ===== API CONFIGURATION =====
// Dynamically determine API base URL based on environment
function getAPIBaseURL() {
  // Check if backend URL is specified in window config
  if (window.BACKEND_API_URL) {
    console.log("✓ Using window.BACKEND_API_URL:", window.BACKEND_API_URL);
    return window.BACKEND_API_URL;
  }

  // Check localStorage for stored backend URL (user can set this)
  const storedApiUrl = localStorage.getItem("backendApiUrl");
  if (storedApiUrl) {
    console.log("✓ Using stored backendApiUrl:", storedApiUrl);
    return storedApiUrl;
  }

  // For localhost development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "127.0.0.1:5500" ||
    window.location.hostname.includes(":3000")
  ) {
    const url = "http://localhost:3001/api";
    console.log("✓ Using localhost API:", url);
    return url;
  }

  // For GitHub Pages and other deployments
  // Try to determine if backend is on same domain or needs custom config
  const protocol = window.location.protocol; // http: or https:
  const hostname = window.location.hostname;

  // Check if there's a /api endpoint on the same domain
  const sameOriginUrl = `${protocol}//${hostname}:3001/api`;
  console.log(
    "⚠️ Deployed environment detected. Configure backend URL:",
    "1. Set window.BACKEND_API_URL in your HTML",
    "2. Or save to localStorage: localStorage.setItem('backendApiUrl', 'YOUR_BACKEND_URL/api')",
    "3. Backend needs CORS configured to allow",
    `requests from ${protocol}//${hostname}`,
  );

  // Try same domain with port 3001 first
  console.log("Attempting:", sameOriginUrl);
  return sameOriginUrl;
}

const API_BASE_URL = getAPIBaseURL();

// ===== UTILITY FUNCTIONS =====
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log("📡 API Request:", options.method || "GET", url);
    const response = await fetch(url, config);

    // Handle token refresh on 401
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken && (await refreshAccessToken())) {
        // Retry the request with new token
        config.headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
        return await fetch(url, config);
      }
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Network error" }));
      const errorMsg = error.error || `HTTP ${response.status}`;
      console.error(
        "❌ API Request failed:",
        errorMsg,
        "Status:",
        response.status,
      );
      throw new Error(errorMsg);
    }

    console.log("✓ API Request successful:", options.method || "GET", endpoint);
    return await response.json();
  } catch (error) {
    console.error("❌ API Request Error:", error.message);
    console.error("📍 Attempted URL:", url);
    console.error(
      "💡 Configure backend URL: localStorage.setItem('backendApiUrl', 'YOUR_API_URL/api')",
    );
    throw error;
  }
}

async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      return true;
    }
  } catch (error) {
    console.error("Token refresh failed:", error);
  }

  // Clear tokens on failure
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return false;
}

function isLoggedIn() {
  return !!localStorage.getItem("accessToken");
}

function getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

// ===== SIDEBAR FUNCTIONALITY =====
function initSidebar() {
  const menuToggle = document.getElementById("menuToggle");
  const navbar = document.getElementById("navbar");
  const body = document.body;
  const sidebarHideBtn = document.getElementById("sidebarHideBtn");

  if (!menuToggle || !navbar) return;

  // Hamburger menu toggle for mobile
  menuToggle.addEventListener("click", function () {
    const isOpen = navbar.classList.contains("sidebar-open");

    if (isOpen) {
      // Close sidebar
      navbar.classList.remove("sidebar-open");
      body.classList.remove("sidebar-open");
      menuToggle.classList.remove("active");
    } else {
      // Open sidebar
      navbar.classList.add("sidebar-open");
      body.classList.add("sidebar-open");
      menuToggle.classList.add("active");
    }
  });

  // Hide/show sidebar button for desktop
  if (sidebarHideBtn) {
    sidebarHideBtn.addEventListener("click", function () {
      const isHidden = navbar.classList.contains("sidebar-hidden");

      if (isHidden) {
        // Show sidebar
        navbar.classList.remove("sidebar-hidden");
        body.classList.remove("sidebar-hidden");
      } else {
        // Hide sidebar
        navbar.classList.add("sidebar-hidden");
        body.classList.add("sidebar-hidden");
      }
    });
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", function (e) {
    if (window.innerWidth <= 768) {
      if (!navbar.contains(e.target) && !menuToggle.contains(e.target)) {
        navbar.classList.remove("sidebar-open");
        body.classList.remove("sidebar-open");
        menuToggle.classList.remove("active");
      }
    }
  });

  // Close sidebar on window resize if desktop
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      navbar.classList.remove("sidebar-open");
      body.classList.remove("sidebar-open");
      menuToggle.classList.remove("active");
    }
  });
}

// ===== QUOTE CATEGORY TABS =====
function initQuoteTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const quoteCategories = document.querySelectorAll(".quote-category");

  if (tabButtons.length === 0) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Hide all categories
      quoteCategories.forEach((category) =>
        category.classList.remove("active"),
      );

      // Show selected category
      const categoryId = button.getAttribute("data-category");
      const selectedCategory = document.getElementById(categoryId);
      if (selectedCategory) {
        selectedCategory.classList.add("active");
      }
    });
  });
}

// ===== QUOTE SUBMISSION =====
function initQuoteSubmission() {
  const quoteForm = document.getElementById("quoteForm");
  if (!quoteForm) return;

  quoteForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(quoteForm);
    const quoteData = {
      quote: formData.get("quoteText").trim(),
      character: formData.get("character").trim(),
      anime: formData.get("anime").trim(),
      submitter: formData.get("submitterName").trim(),
      timestamp: new Date().toISOString(),
    };

    // Validate form
    if (
      !quoteData.quote ||
      !quoteData.character ||
      !quoteData.anime ||
      !quoteData.submitter
    ) {
      showCommentNotification("Please fill in all fields!", "error");
      return;
    }

    // Save quote (in a real app, this would be sent to a server)
    saveSubmittedQuote(quoteData);

    // Clear form
    quoteForm.reset();

    // Show success message
    showCommentNotification(
      "Quote submitted successfully! It will be reviewed by our team. 🎉",
      "success",
    );
  });
}

function saveSubmittedQuote(quoteData) {
  // Use API instead of localStorage
  apiRequest("/quotes", {
    method: "POST",
    body: JSON.stringify(quoteData),
  })
    .then((data) => {
      console.log("Quote submitted via API:", data);
    })
    .catch((error) => {
      console.error("Failed to submit quote via API:", error);
      // Fallback to localStorage if API fails
      const submittedQuotes = getSubmittedQuotes();
      submittedQuotes.push(quoteData);
      localStorage.setItem(
        "saiyans_submitted_quotes",
        JSON.stringify(submittedQuotes),
      );
    });
}

function getSubmittedQuotes() {
  try {
    const stored = localStorage.getItem("saiyans_submitted_quotes");
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading submitted quotes:", e);
    return [];
  }
}

// Initialize quote functionality when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initQuoteTabs();
  initQuoteSubmission();
  initAnnouncementFilters();
});

// ===== ANNOUNCEMENT ARCHIVE FILTERS =====
function initAnnouncementFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const archiveItems = document.querySelectorAll(".archive-item");

  if (filterButtons.length === 0) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      button.classList.add("active");

      // Get filter category
      const filterCategory = button.getAttribute("data-filter");

      // Filter items
      archiveItems.forEach((item) => {
        if (
          filterCategory === "all" ||
          item.getAttribute("data-category") === filterCategory
        ) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  });
}

// ===== LOGIN FORM VALIDATION AND HANDLING =====
document.addEventListener("DOMContentLoaded", function () {
  // Login form validation
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      // Basic validation
      if (!username || !password) {
        showLoginMessage("Please fill in all fields", "error");
        return;
      }

      if (username.length < 3) {
        showLoginMessage("Username must be at least 3 characters", "error");
        return;
      }

      if (password.length < 6) {
        showLoginMessage("Password must be at least 6 characters", "error");
        return;
      }

      // Show loading
      showLoginMessage("Logging in...", "info");

      try {
        const response = await apiRequest("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });

        // Store tokens
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
        localStorage.setItem("userData", JSON.stringify(response.user));

        showLoginMessage("Login successful! Welcome back, Saiyan!", "success");

        setTimeout(() => {
          window.location.href = "user-dashboard.html";
        }, 1500);
      } catch (error) {
        console.error("Login error:", error);
        let errorMsg = error.message || "Login failed";
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network")
        ) {
          errorMsg = `Connection Error: Cannot reach API. Please check:
1. Backend server is running at the configured URL
2. CORS is properly configured on backend
3. To set API URL: localStorage.setItem('backendApiUrl', 'YOUR_BACKEND_URL/api')`;
        }
        showLoginMessage(errorMsg, "error");
      }
    });
  }

  // Social login handlers
  const socialButtons = document.querySelectorAll(".social-btn");
  socialButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const provider = this.classList[1]; // google-btn, discord-btn, github-btn
      handleSocialLogin(provider);
    });
  });

  // Check if user is already logged in
  checkLoginStatus();
});

function showLoginMessage(message, type) {
  // Remove existing message
  const existingMessage = document.querySelector(".login-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create new message
  const messageDiv = document.createElement("div");
  messageDiv.className = `login-message ${type}`;
  messageDiv.textContent = message;

  // Style based on type
  messageDiv.style.cssText = `
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
    text-align: center;
    font-weight: bold;
    transition: all 0.3s ease;
  `;

  switch (type) {
    case "error":
      messageDiv.style.backgroundColor = "rgba(255, 107, 107, 0.2)";
      messageDiv.style.border = "1px solid #ff6b6b";
      messageDiv.style.color = "#ff6b6b";
      break;
    case "success":
      messageDiv.style.backgroundColor = "rgba(0, 212, 255, 0.2)";
      messageDiv.style.border = "1px solid #00d4ff";
      messageDiv.style.color = "#00d4ff";
      break;
    case "info":
      messageDiv.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
      messageDiv.style.border = "1px solid #ffd700";
      messageDiv.style.color = "#ffd700";
      break;
  }

  // Insert message before the form
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.parentNode.insertBefore(messageDiv, loginForm);
  }
}

async function handleSocialLogin(provider) {
  showLoginMessage(
    `Connecting to ${provider.charAt(0).toUpperCase() + provider.slice(1)}...`,
    "info",
  );

  // For now, simulate social login - in production, this would redirect to OAuth
  setTimeout(async () => {
    try {
      // Create a demo user for social login
      const demoUsername = `${provider}User_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const demoEmail = `${demoUsername}@${provider}.com`;

      // Try to register first (will fail if exists, then login)
      try {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            username: demoUsername,
            email: demoEmail,
            password: "social_login_demo_password",
          }),
        });
      } catch (registerError) {
        // User might already exist, try login
        console.log("User might exist, trying login...");
      }

      // Now try to login
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: demoUsername,
          password: "social_login_demo_password",
        }),
      });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("userData", JSON.stringify(response.user));

      showLoginMessage(
        `Successfully logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
        "success",
      );

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (error) {
      showLoginMessage(`Social login failed: ${error.message}`, "error");
    }
  }, 1500);
}

async function checkLoginStatus() {
  const token = localStorage.getItem("accessToken");
  const userData = localStorage.getItem("userData");

  if (token && userData) {
    try {
      // Verify token is still valid by making a request
      await apiRequest("/auth/profile");

      // Show logged in state
      const loginCard = document.querySelector(".login-card");
      if (loginCard) {
        const user = JSON.parse(userData);
        loginCard.innerHTML = `
          <h2>Welcome back, ${user.username}!</h2>
          <p>You are already logged in.</p>
          <button onclick="logout()" class="login-btn" style="background: linear-gradient(45deg, #ff6b6b, #cc5555);">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
          <div class="login-footer">
            <p><a href="index.html" class="signup-link">← Back to Home</a></p>
          </div>
        `;
      }
    } catch (error) {
      // Token invalid, clear storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    }
  }
}

async function logout() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error("Logout API call failed:", error);
  }

  // Clear local storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");

  location.reload();
}

// PASSWORD VISIBILITY TOGGLE (if needed)
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.querySelector(".password-toggle");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
  } else {
    passwordInput.type = "password";
    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
  }
}
