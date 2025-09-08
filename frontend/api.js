/**
 * @file api.js
 * @description MindTrack 應用程式的集中式、可複用 API 用戶端模組。
 * 為「習慣」實現了完整的 CRUD 功能，並遵循 DRY 原則。
 */

// 後端 API 的基礎 URL。集中管理此 URL 便於在開發、預備和生產環境之間切換。
const BASE_URL = 'http://127.0.0.1:5000';

/**
 * 處理所有 fetch 請求的私有輔助函式。
 * 此函式不會被匯出，作為所有 API 呼叫的單一進入點，集中處理錯誤、標頭設定和回應解析。
 * @param {string} path - API 端點路徑 (例如 '/habits')。
 * @param {object} options - fetch 請求的設定。
 * @param {string} [options.method='GET'] - HTTP 方法。
 * @param {object} [options.body=null] - POST/PUT 請求的負載。
 * @returns {Promise<any|null>} 成功時返回解析後的 JSON 回應，對於 204 回應返回成功標識，失敗時返回 null。
 */
async function apiFetch(path, { method = 'GET', body = null } = {}) {
  const options = {
    method,
    headers: {},
  };

  // 如果提供了 body，將其字串化並設定 Content-Type 標頭。
  if (body) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);

    // 檢查 HTTP 回應狀態是否不為 OK。
    if (!response.ok) {
      // 嘗試從回應主體中解析錯誤細節。
      const errorBody = await response.json().catch(() => null);
      const errorMessage = errorBody?.message || `網路回應不正常。狀態: ${response.status}`;
      throw new Error(errorMessage);
    }

    // 對於 204 No Content 回應 (常見於 DELETE/PUT)，返回一個成功標識。
    if (response.status === 204) {
      return { success: true };
    }

    // 對於所有其他成功的響應，解析並返回 JSON 主體。
    return await response.json();
  } catch (error) {
    console.error(`API 請求錯誤 (${method} ${path}):`, error.message);
    // 向呼叫者返回 null 以表示失敗。
    return null;
  }
}

// --- 公開的 API 函式 ---

/**
 * 從後端獲取所有習慣的列表。(讀取)
 * @returns {Promise<Array<Object>|null>} 一個解析為習慣物件陣列的 Promise，失敗時為 null。
 */
export async function fetchHabits() {
  return apiFetch('/habits');
}

/**
 * 在後端新增一個新習慣。(建立)
 * @param {object} habitData - 新習慣的數據 (例如 { name: '讀一本書' })。
 * @returns {Promise<Object|null>} 一個解析為新建立的習慣物件的 Promise，失敗時為 null。
 */
export async function addHabit(habitData) {
  return apiFetch('/habits', {
    method: 'POST',
    body: habitData,
  });
}

/**
 * 更新一個現有的習慣。(更新)
 * @param {string|number} habitId - 要更新的習慣 ID。
 * @param {object} updateData - 一個包含要更新欄位的物件。
 * @returns {Promise<Object|null>} 一個解析為更新後的習慣物件的 Promise，失敗時為 null。
 */
export async function updateHabit(habitId, updateData) {
  return apiFetch(`/habits/${habitId}`, {
    method: 'PUT',
    body: updateData,
  });
}

/**
 * 從後端刪除一個習慣。(刪除)
 * @param {string|number} habitId - 要刪除的習慣 ID。
 * @returns {Promise<boolean>} 一個在成功刪除時解析為 true 的 Promise，失敗時為 false。
 */
export async function deleteHabit(habitId) {
  const result = await apiFetch(`/habits/${habitId}`, { method: 'DELETE' });
  // apiFetch 對於 204 回應返回 { success: true }，對於錯誤返回 null。
  // 將結果強制轉換為布林值，以提供清晰的成功/失敗信號。
  return !!result;
}
