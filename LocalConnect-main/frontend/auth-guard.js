/**
 * Auth Guard - Route Protection and Authentication State Management
 * Handles redirects for protected routes and maintains user auth state
 */

// Protected route configurations
const PROTECTED_ROUTES = {
  "/post.html": true,
  "/messages.html": true,
  "/profile.html": true,
  "/cart.html": true,
};

const PUBLIC_ROUTES = {
  "/index.html": true,
  "/login.html": true,
  "/register.html": true,
  "/browse.html": true,
  "/safety.html": true,
};

// Auth state store
let currentUser = null;
let currentSession = null;

/**
 * Initialize auth guard on page load
 */
async function initAuthGuard() {
  try {
    // Check for existing session
    const session = await getCurrentSession();
    const user = await getCurrentUser();

    currentSession = session;
    currentUser = user;

    // Check if current page is protected
    const currentPath = window.location.pathname;
    const isProtected = PROTECTED_ROUTES[currentPath];

    if (isProtected && !user) {
      // Redirect to login if no user and page is protected
      localStorage.setItem("redirectAfterLogin", currentPath);
      window.location.href = "/login.html";
      return;
    }

    // If on login/register and already logged in, redirect to home
    if ((currentPath === "/login.html" || currentPath === "/register.html") && user) {
      window.location.href = "/index.html";
      return;
    }

    // Update UI based on auth state
    updateAuthUI(user);

    // Set up real-time auth listener
    setupAuthListener();
  } catch (error) {
    console.error("Auth guard initialization error:", error);
  }
}

/**
 * Set up real-time auth state listener
 */
function setupAuthListener() {
  onAuthStateChange((event, session) => {
    currentSession = session;

    if (session?.user) {
      currentUser = session.user;
      updateAuthUI(session.user);
    } else {
      currentUser = null;
      currentSession = null;
      updateAuthUI(null);

      // If on protected route and logged out, redirect to login
      const currentPath = window.location.pathname;
      if (PROTECTED_ROUTES[currentPath]) {
        localStorage.setItem("redirectAfterLogin", currentPath);
        window.location.replace("/login.html");
      }
    }
  });
}

/**
 * Handle user logout and redirect immediately
 */
async function handleLogout() {
  try {
    await signOutUser();
    currentUser = null;
    currentSession = null;
    updateAuthUI(null);
    localStorage.removeItem("redirectAfterLogin");
    window.location.replace("/login.html");
  } catch (error) {
    console.error("Logout error:", error);
  }
}

/**
 * Update UI based on authentication state
 */
async function updateAuthUI(user) {
  const userActionsDiv = document.querySelector(".user-actions");
  
  if (!userActionsDiv) {
    return; // Header not present on this page
  }

  if (user) {
    // User is logged in
    const profile = await getUserProfile(user.id);
    
    const authHTML = `
      <div class="user-menu" id="userMenu">
        <button class="user-avatar-btn" id="userAvatarBtn">
          <img src="${profile?.avatar_url || 'https://via.placeholder.com/32'}" 
               alt="Avatar" 
               class="avatar-image">
          <span class="user-name">${profile?.display_name || profile?.username || 'User'}</span>
        </button>
        <div class="dropdown-menu hidden" id="userDropdown">
          <a href="/profile.html" class="dropdown-item">My Profile</a>
          <a href="/post.html" class="dropdown-item">Post Item</a>
          <a href="/messages.html" class="dropdown-item">Messages</a>
          <a href="/cart.html" class="dropdown-item">Cart</a>
          <a href="/admin.html" class="dropdown-item text-primary" style="color: var(--primary-color);">Admin Dashboard</a>
          <hr class="dropdown-divider">
          <button class="dropdown-item logout-btn" id="logoutBtn">Sign Out</button>
        </div>
      </div>
    `;

    userActionsDiv.innerHTML = authHTML;

    // Set up dropdown toggle
    const userAvatarBtn = document.getElementById("userAvatarBtn");
    const userDropdown = document.getElementById("userDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    userAvatarBtn?.addEventListener("click", () => {
      userDropdown?.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#userMenu")) {
        userDropdown?.classList.add("hidden");
      }
    });

    // Logout handler
    logoutBtn?.addEventListener("click", handleLogout);
  } else {
    // User is not logged in
    userActionsDiv.innerHTML = `
      <a href="/login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  }
}

/**
 * Require authentication for a function
 * Useful for button click handlers
 */
async function requireAuth(callback) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      window.location.href = "/login.html";
      return;
    }

    // User is authenticated, call the callback
    if (typeof callback === "function") {
      return await callback(user);
    }
  } catch (error) {
    console.error("Auth requirement error:", error);
    alert("Authentication error. Please try logging in again.");
  }
}

/**
 * Show error message with auth-related recovery options
 */
function showAuthError(message, isPermissionError = false) {
  const errorHTML = `
    <div class="auth-error-notification">
      <div class="error-icon">⚠️</div>
      <div class="error-message">${message}</div>
      ${isPermissionError ? `
        <a href="/login.html" class="error-link">Sign In</a>
      ` : ""}
      <button class="error-close-btn" onclick="this.parentElement.remove()">✕</button>
    </div>
  `;

  const container = document.querySelector("main") || document.body;
  const errorEl = document.createElement("div");
  errorEl.innerHTML = errorHTML;
  container.prepend(errorEl.firstElementChild);
}

/**
 * Redirect after login to original page or home
 */
function redirectAfterLogin() {
  const redirect = localStorage.getItem("redirectAfterLogin");
  localStorage.removeItem("redirectAfterLogin");

  if (redirect && PROTECTED_ROUTES[redirect]) {
    window.location.href = redirect;
  } else {
    window.location.href = "/index.html";
  }
}

/**
 * Check if user has permission for an action
 * Throws error if unauthorized
 */
async function checkPermission(requiredAuth = true) {
  const user = await getCurrentUser();

  if (requiredAuth && !user) {
    throw new Error("Authentication required");
  }

  return user;
}

// Initialize auth guard when DOM is ready
document.addEventListener("DOMContentLoaded", initAuthGuard);

