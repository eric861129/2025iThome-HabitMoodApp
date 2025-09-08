import { fetchHabits } from "./api.js";

// --- 1. 狀態中心 (單一真理之源) ---
// 所有渲染 UI 所需的數據都儲存在這裡。
const state = {
  habits: [],
  isLoading: true, // 用於顯示載入指示器
  error: null, // 用於顯示任何獲取錯誤
};

// --- 2. 元素選擇器 ---
// 集中管理元素選擇可以提高效能和可讀性。
const habitListContainer = document.querySelector(".habit-list-container");

// --- 3. 主渲染引擎 ---
// 這是宣告式 UI 的核心。它根據當前狀態來渲染 UI。

/**
 * 根據中央 `state` 物件渲染習慣列表。
 */
function renderHabitList() {
  // 首先總是清空容器
  habitListContainer.innerHTML = "";

  // 處理載入狀態
  if (state.isLoading) {
    habitListContainer.innerHTML = "<p>正在載入您的習慣...</p>";
    return;
  }

  // 處理錯誤狀態
  if (state.error) {
    habitListContainer.innerHTML = `<p class="error-message">${state.error}</p>`;
    return;
  }

  // 處理空狀態
  if (state.habits.length === 0) {
    habitListContainer.innerHTML =
      "<p>您尚未新增任何習慣。點擊「新增習慣」開始吧！</p>";
    return;
  }

  // 渲染習慣列表
  const habitElements = state.habits
    .map((habit) => {
      // 在真實的應用中，`isCompleted` 應該來自於狀態
      const isCompleted = false;
      return `
        <div
          class="habit-item ${isCompleted ? "completed" : ""}"
          tabindex="0"
          role="button"
          aria-pressed="${isCompleted}"
          data-habit-id="${habit.id}"
        >
          <div class="habit-checkbox">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <span class="habit-name">${habit.name}</span>
        </div>
      `;
    })
    .join("");

  habitListContainer.innerHTML = habitElements;
}

/**
 * 主渲染函式，它負責調度所有其他的渲染函式。
 */
function render() {
  renderHabitList();
  // 未來像 renderMoodTracker() 這樣的渲染函式可以在這裡呼叫。
}

// --- 4. 狀態更新器 ---
// 一個集中的函式，用於更新狀態並觸發重新渲染。

/**
 * 將新狀態與現有狀態合併，並觸發重新渲染。
 * @param {object} newState - 一個包含要更新的狀態屬性的物件。
 */
function setState(newState) {
  // 將新狀態合併到舊狀態中
  Object.assign(state, newState);
  // 觸發重新渲染，以在 UI 中反映新狀態
  render();
}

// --- 5. 應用程式邏輯與事件監聽器 ---

document.addEventListener("DOMContentLoaded", () => {
  // --- 初始數據載入 (已重構) ---
  /**
   * 獲取初始數據並相應地更新狀態。
   * 管理完整的生命週期：載入 -> 成功/失敗。
   */
  async function loadInitialData() {
    setState({ isLoading: true, error: null });
    try {
      const data = await fetchHabits();
      if (data) {
        // 成功：用獲取的習慣更新狀態
        setState({ habits: data, isLoading: false });
        console.log("✅ 習慣已載入並更新狀態:", state.habits);
      } else {
        // 處理來自 api.js 的失敗 (例如，fetch 回傳了 null)
        setState({ error: "讀取習慣失敗。", isLoading: false });
      }
    } catch (error) {
      // 未預期的錯誤
      console.error("在初始數據載入期間發生未預期的錯誤:", error);
      setState({ error: "發生未預期的錯誤。", isLoading: false });
    }
  }

  // --- 保留的邏輯 (不依賴於 `state.habits`) ---

  const addHabitBtn = document.getElementById("add-habit-btn");
  const addHabitModal = document.getElementById("add-habit-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const subtitle = document.getElementById("page-subtitle");
  const navLinks = document.querySelectorAll(".nav-item a");
  const pages = document.querySelectorAll(".page-content");

  const setTodaysDate = () => {
    const today = new Date();
    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    if (subtitle) {
      subtitle.textContent = today.toLocaleDateString("zh-TW", options);
    }
  };

  const openModal = () => addHabitModal.classList.add("show");
  const closeModal = () => addHabitModal.classList.remove("show");

  if (addHabitBtn) addHabitBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (addHabitModal) {
    addHabitModal.addEventListener("click", (event) => {
      if (event.target === addHabitModal) closeModal();
    });
  }

  const switchPage = (targetPageId) => {
    pages.forEach((page) => page.classList.add("hidden"));
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) targetPage.classList.remove("hidden");
    navLinks.forEach((link) => {
      link.parentElement.classList.toggle("active", link.dataset.page === targetPageId);
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      switchPage(link.dataset.page);
    });
  });

  // --- 應用程式初始化 ---

  setTodaysDate();
  switchPage("dashboard-page");
  loadInitialData(); // 開始數據獲取和渲染過程
});