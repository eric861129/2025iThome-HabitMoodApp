/**
 * @file api.js
 * @description Foundational API client module for the MindTrack application.
 * Establishes a reusable pattern for all data fetching operations.
 */

// Base URL for the backend API. Centralizing this makes it easy to switch
// between development, staging, and production environments.
const BASE_URL = 'http://127.0.0.1:5000';

/**
 * Fetches the list of all habits from the backend.
 * This function establishes the standard pattern for all API read operations:
 * - Uses async/await for clean, readable asynchronous code.
 * - Implements robust try...catch error handling.
 * - Returns parsed JSON data on success and null on failure.
 *
 * @returns {Promise<Array<Object>|null>} A promise that resolves to an array of habit objects on success, or null if an error occurs.
 */
export async function fetchHabits() {
  try {
    const response = await fetch(`${BASE_URL}/habits`);

    // Check if the HTTP response status is in the 200-299 range.
    if (!response.ok) {
      // If not, throw an error to be caught by the catch block.
      throw new Error(`Network response was not ok. Status: ${response.status}`);
    }

    // If the response is ok, parse the JSON body and return it.
    const habits = await response.json();
    return habits;
  } catch (error) {
    // Log the error to the console for debugging purposes.
    console.error('Failed to fetch habits:', error);

    // Return null to the caller to indicate that the operation failed.
    // This allows the UI to handle the failure state gracefully.
    return null;
  }
}

// Future API functions like createHabit, updateHabit, etc., can be added below,
// following the same pattern established by fetchHabits.