/**
 * @file api.js
 * @description Centralized API request module for the MindTrack application.
 * This module abstracts the native `fetch` API to provide a consistent
 * way of handling requests, responses, and errors.
 */

// The base URL for the backend API.
// During development, this typically points to the local Flask server.
const BASE_URL = 'http://127.0.0.1:5000/api';

/**
 * A wrapper around the native `fetch` API.
 * @param {string} endpoint - The API endpoint to call (e.g., '/auth/login').
 * @param {object} options - Configuration for the fetch request.
 * @param {string} [options.method='GET'] - The HTTP method.
 * @param {object} [options.body=null] - The request payload for POST/PUT requests.
 * @param {object} [options.headers={}] - Additional headers.
 * @returns {Promise<any>} - A promise that resolves with the JSON response.
 * @throws {Error} - Throws an error if the request fails or the response is not ok.
 */
async function request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const config = {
    method,
    headers: {
      ...headers,
    },
  };

  // Attach the body and set the Content-Type header if a body is present.
  if (body) {
    config.body = JSON.stringify(body);
    config.headers['Content-Type'] = 'application/json';
  }

  // Retrieve the auth token from local storage and add it to the headers if it exists.
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If the response is not OK (e.g., 4xx, 5xx), parse the error and throw it.
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! Status: ${response.status}`,
    }));
    throw new Error(errorData.message || 'An unknown error occurred.');
  }

  // For 204 No Content, there's no body to parse.
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// --- Exported API Functions ---

/**
 * Authentication related API calls.
 */
export const auth = {
  /**
   * Logs in a user.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<{token: string}>}
   */
  login: ({ email, password }) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  /**
   * Registers a new user.
   * @param {string} username - The chosen username.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   * @returns {Promise<any>}
   */
  register: ({ username, email, password }) =>
    request('/auth/register', {
      method: 'POST',
      body: { username, email, password },
    }),
};

/**
 * Habit related API calls.
 */
export const habits = {
  /**
   * Fetches all habits for the logged-in user.
   * @returns {Promise<Array<object>>}
   */
  getAll: () => request('/habits'),

  /**
   * Creates a new habit.
   * @param {object} habitData - The data for the new habit.
   * @param {string} habitData.name - The name of the habit.
   * @param {string} [habitData.description] - The description of the habit.
   * @returns {Promise<object>}
   */
  create: (habitData) =>
    request('/habits', {
      method: 'POST',
      body: habitData,
    }),
};

/**
 * Mood related API calls.
 */
export const moods = {
    /**
     * Records or updates the mood for a specific date.
     * @param {object} moodData - The data for the mood log.
     * @param {number} moodData.rating - The mood rating (1-5).
     * @param {string} [moodData.notes] - Optional notes.
     * @param {string} moodData.log_date - The date in 'YYYY-MM-DD' format.
     * @returns {Promise<object>}
     */
    log: (moodData) => request('/moods', {
        method: 'POST',
        body: moodData
    })
}
