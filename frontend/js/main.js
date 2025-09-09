/**
 * @file main.js
 * @description 應用程式的主入口點。
 * 負責協調各個模組，初始化應用程式，並綁定頂層事件監聽器。
 */

import { state, setState, subscribe } from './state.js';
import { render } from './ui.js';
import {
  initializeApp,
  handleMainAppClick,
  handleAuthClick,
  handleLoginSubmit,
  handleRegisterSubmit,
  handleAddHabitSubmit,
  handleSaveMood,
  handleMoodSelectorClick,
  handleMoodNotesInput,
  openModal,
  closeModal,
} from './handlers.js';

// 訂閱 UI 模組的 render 函式，確保狀態更新時 UI 會重新繪製
subscribe(render);

// --- 應用程式初始化 ---
document.addEventListener("DOMContentLoaded", () => {
  // 獲取 appRoot 元素，所有視圖都將渲染到此元素中
  const appRoot = document.getElementById('app-root');

  // --- 頂層事件監聽器 (事件委派) ---
  // 點擊事件
  appRoot.addEventListener('click', event => {
    if (state.currentView === 'main') {
        // 處理主應用程式內的點擊事件
        handleMainAppClick(event);

        // 處理新增習慣 Modal 的開關
        if (event.target.id === 'add-habit-btn') openModal();
        if (event.target.closest('.close-button')) closeModal();
        if (event.target.id === 'cancel-btn') closeModal();
        if (event.target.id === 'add-habit-modal' && event.target.classList.contains('modal-overlay')) closeModal();

        // 處理心情選擇器點擊
        handleMoodSelectorClick(event);

        // 處理儲存心情按鈕點擊
        if (event.target.classList.contains('save-mood-btn')) handleSaveMood();

    }
    if (state.currentView === 'auth') {
        // 處理認證頁面內的點擊事件
        handleAuthClick(event);
    }
  });

  // 表單提交事件
  appRoot.addEventListener('submit', event => {
    if (event.target.id === 'login-form') handleLoginSubmit(event);
    if (event.target.id === 'register-form') handleRegisterSubmit(event);
    if (event.target.id === 'add-habit-form') handleAddHabitSubmit(event);
  });

  // 心情備註輸入事件 (直接綁定到 appRoot 並委派)
  appRoot.addEventListener('input', event => {
    if (event.target.classList.contains('mood-notes-input')) {
        handleMoodNotesInput(event);
    }
  });

  // 啟動應用程式
  initializeApp();
});
