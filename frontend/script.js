
import {
  fetchHabits,
  addHabit,
  deleteHabit,
  updateHabit,
} from "./api.js";

// --- 1. 狀態中心 (單一真理之源) ---
const state = {
  habits: [],
  isLoading: true,
  error: null,
  isSubmitting: false, // 用於追蹤「新增/編輯」時的提交狀態
  editingHabitId: null, // 追蹤當前正在被編輯的習慣 ID
};

// --- 2. 元素選擇器 ---
const habitListContainer = document.querySelector(".habit-list-container");
const addHabitModal = document.getElementById("add-habit-modal");
const addHabitForm = addHabitModal.querySelector("form"); // Assuming the modal contains a form
const habitNameInput = document.getElementById("habit-name-input");
const saveHabitBtn = addHabitModal.querySelector(".btn-primary");

// --- 3. 渲染引擎 ---

/**
 * 根據 state 渲染「新增習慣 Modal」的狀態
 */
function renderModal() {
  if (saveHabitBtn) {
    saveHabitBtn.disabled = state.isSubmitting;
    saveHabitBtn.textContent = state.isSubmitting ? "儲存中..." : "儲存";
  }
}

/**
 * 根據中央 `state` 物件渲染習慣列表。
 */
function renderHabitList() {
  habitListContainer.innerHTML = "";

  if (state.isLoading) {
    habitListContainer.innerHTML = "<p>正在載入您的習慣...</p>";
    return;
  }
  if (state.error) {
    habitListContainer.innerHTML = `<p class="error-message">${state.error}</p>`;
    return;
  }
  if (state.habits.length === 0) {
    habitListContainer.innerHTML =
      "<p>您尚未新增任何習慣。點擊「新增習慣」開始吧！</p>";
    return;
  }

  const habitElements = state.habits
    .map((habit) => {
      const isEditing = habit.id === state.editingHabitId;
      // TODO: The completion status should be managed in state as well.
      const isCompleted = false;

      if (isEditing) {
        return `
          <div class="habit-item editing">
            <input type="text" value="${habit.name}" class="edit-input" data-habit-id="${habit.id}" />
            <button class="btn" data-action="save-edit" data-habit-id="${habit.id}">儲存</button>
          </div>
        `;
      }

      return `
        <div class="habit-item ${isCompleted ? "completed" : ""}" data-habit-id="${habit.id}">
          <div class="habit-interaction-area" data-action="toggle" role="button" tabindex="0">
            <div class="habit-checkbox">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <span class="habit-name">${habit.name}</span>
          </div>
          <div class="habit-actions">
            <button class="action-btn" data-action="edit" aria-label="編輯習慣">✏️</button>
            <button class="action-btn" data-action="delete" aria-label="刪除習慣">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");

  habitListContainer.innerHTML = habitElements;
}

/**
 * 主渲染函式，負責調度所有渲染任務。
 */
function render() {
  renderModal();
  renderHabitList();
}

// --- 4. 狀態更新器 ---

function setState(newState) {
  Object.assign(state, newState);
  render();
}

// --- 5. 應用程式邏輯與事件處理 ---

/**
 * 處理新增習慣表單的提交。
 * @param {Event} event
 */
async function handleAddHabitSubmit(event) {
  event.preventDefault();
  const habitName = habitNameInput.value.trim();

  if (!habitName) {
    alert("習慣名稱不能為空！");
    return;
  }

  setState({ isSubmitting: true });

  const newHabit = await addHabit({ name: habitName });

  if (newHabit) {
    const updatedHabits = [newHabit, ...state.habits];
    setState({ habits: updatedHabits, isSubmitting: false });
    closeModal();
    habitNameInput.value = "";
  } else {
    alert("新增習慣失敗，請稍後再試。");
    setState({ isSubmitting: false });
  }
}

/**
 * 使用事件委派處理習慣列表中的所有點擊事件。
 * @param {Event} event
 */
async function handleHabitListClick(event) {
  const target = event.target;
  const actionTarget = target.closest("[data-action]");

  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  const habitItem = actionTarget.closest(".habit-item, .editing");
  const habitId = habitItem?.dataset.habitId;

  if (!habitId) return;

  switch (action) {
    case "delete": {
      if (!confirm("確定要刪除這個習慣嗎？")) return;

      const originalHabits = [...state.habits];
      const optimisticHabits = state.habits.filter((h) => h.id !== Number(habitId));
      setState({ habits: optimisticHabits });

      const success = await deleteHabit(habitId);
      if (!success) {
        alert("刪除失敗，正在還原...");
        setState({ habits: originalHabits });
      }
      break;
    }

    case "toggle": {
      // TODO: Implement optimistic update and background sync for toggling completion.
      // 1. Find habit in state.
      // 2. Toggle its 'completed_today' property.
      // 3. Call setState to instantly update UI.
      // 4. Call `updateHabit` in the background.
      // 5. If API call fails, revert the state change and alert the user.
      console.log(`Toggle habit ${habitId}`);
      break;
    }
      
    case "edit": {
      setState({ editingHabitId: Number(habitId) });
      // Focus the input after it's rendered
      setTimeout(() => {
        const input = habitListContainer.querySelector(`.edit-input[data-habit-id="${habitId}"]`);
        input?.focus();
      }, 0);
      break;
    }

    case "save-edit": {
      const input = habitItem.querySelector("input");
      const newName = input.value.trim();
      const originalHabit = state.habits.find(h => h.id === Number(habitId));

      if (!newName || newName === originalHabit.name) {
        setState({ editingHabitId: null });
        return;
      }
      
      const updatedHabit = await updateHabit(habitId, { name: newName });

      if (updatedHabit) {
        const updatedHabits = state.habits.map(h => h.id === Number(habitId) ? updatedHabit : h);
        setState({ habits: updatedHabits, editingHabitId: null });
      } else {
        alert("更新失敗！");
        setState({ editingHabitId: null });
      }
      break;
    }
  }
}


// --- 6. DOMContentLoaded 初始化 ---

document.addEventListener("DOMContentLoaded", () => {
  async function loadInitialData() {
    setState({ isLoading: true, error: null });
    try {
      const data = await fetchHabits();
      if (data) {
        setState({ habits: data, isLoading: false });
      } else {
        setState({ error: "讀取習慣失敗。", isLoading: false });
      }
    } catch (error) {
      console.error("在初始數據載入期間發生未預期的錯誤:", error);
      setState({ error: "發生未預期的錯誤。", isLoading: false });
    }
  }

  // --- 保留的非狀態驅動邏輯 ---
  const addHabitBtn = document.getElementById("add-habit-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const subtitle = document.getElementById("page-subtitle");

  const setTodaysDate = () => {
    const today = new Date();
    const options = { year: "numeric", month: "long", day: "numeric", weekday: "long" };
    if (subtitle) {
      subtitle.textContent = today.toLocaleDateString("zh-TW", options);
    }
  };

  const openModal = () => addHabitModal.classList.add("show");
  const closeModal = () => {
      addHabitModal.classList.remove("show");
      habitNameInput.value = ""; // Clear input on close
  }

  // --- 事件監聽器綁定 ---
  if (addHabitBtn) addHabitBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if (addHabitModal) {
    addHabitModal.addEventListener("click", (event) => {
      if (event.target === addHabitModal) closeModal();
    });
  }
  if (addHabitForm) addHabitForm.addEventListener("submit", handleAddHabitSubmit);
  if (habitListContainer) habitListContainer.addEventListener("click", handleHabitListClick);


  // --- 應用程式初始化 ---
  setTodaysDate();
  loadInitialData();
});
