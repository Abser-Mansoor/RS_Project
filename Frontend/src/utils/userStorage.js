/**
 * User and profile storage utilities.
 * Manages authentication state and user profiles locally.
 */

const USERS_STORAGE_KEY = "rr_users";
const CURRENT_USER_KEY = "rr_current_user";
const DEFAULT_PROFILE_PAPER_IDS = [
  "0705.2976",
  "0705.1070",
  "0705.4213",
  "0706.0350",
  "0704.1851",
];

/**
 * Get all registered users
 */
export function getAllUsers() {
  const data = window.localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

/**
 * Get current logged-in user
 */
export function getCurrentUser() {
  const username = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!username) return null;
  const users = getAllUsers();
  return users[username] || null;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Register a new user with default profile
 */
export function registerUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required");
  }

  const users = getAllUsers();
  if (users[username]) {
    throw new Error("User already exists");
  }

  users[username] = {
    username,
    password,
    profile: DEFAULT_PROFILE_PAPER_IDS,
    savedPapers: [],
    createdAt: new Date().toISOString(),
  };

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return users[username];
}

/**
 * Login user
 */
export function loginUser(username, password) {
  const users = getAllUsers();
  const user = users[username];

  if (!user || user.password !== password) {
    throw new Error("Invalid username or password");
  }

  window.localStorage.setItem(CURRENT_USER_KEY, username);
  return user;
}

/**
 * Logout current user
 */
export function logoutUser() {
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Get user's profile (list of canonical paper ids they've engaged with)
 */
export function getUserProfile(username = null) {
  const user = username ? getAllUsers()[username] : getCurrentUser();
  return user?.profile || [];
}

/**
 * Add paper to user's saved papers
 * Updates user profile with canonical paper id
 */
export function savePaper(paperId) {
  const user = getCurrentUser();
  if (!user) return null;

  const users = getAllUsers();
  const currentUser = users[user.username];

  if (!currentUser.savedPapers) {
    currentUser.savedPapers = [];
  }

  if (!currentUser.savedPapers.includes(paperId)) {
    currentUser.savedPapers.push(paperId);
  }

  if (!currentUser.profile) {
    currentUser.profile = [];
  }

  if (!currentUser.profile.includes(paperId)) {
    currentUser.profile.push(paperId);
  }

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return currentUser;
}

/**
 * Remove paper from user's saved papers
 */
export function removeSavedPaper(paperId) {
  const user = getCurrentUser();
  if (!user) return null;

  const users = getAllUsers();
  const currentUser = users[user.username];

  if (!currentUser.savedPapers) {
    currentUser.savedPapers = [];
  }

  currentUser.savedPapers = currentUser.savedPapers.filter(
    (id) => id !== paperId
  );

  currentUser.profile = (currentUser.profile || []).filter((id) => id !== paperId);

  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return currentUser;
}

/**
 * Get user's saved papers
 */
export function getSavedPapers(username = null) {
  const user = username ? getAllUsers()[username] : getCurrentUser();
  return user?.savedPapers || [];
}

/**
 * Check if paper is saved by user
 */
export function isPaperSaved(paperId) {
  const user = getCurrentUser();
  if (!user) return false;
  return (user.savedPapers || []).includes(paperId);
}
