document.addEventListener("DOMContentLoaded", () => {
  // --- 元素選擇 ---
  const addHabitBtn = document.getElementById("add-habit-btn");
  const addHabitModal = document.getElementById("add-habit-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const habitItems = document.querySelectorAll(".habit-item");
  const subtitle = document.getElementById("page-subtitle");
  const navLinks = document.querySelectorAll(".nav-item a");
  const pages = document.querySelectorAll(".page-content");

  // --- 功能 1: 設定今日日期 ---
  const setTodaysDate = () => {
    const today = new Date();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    };
    // 將語言地區設為 'zh-TW' 以顯示中文
    if (subtitle) {
        subtitle.textContent = today.toLocaleDateString("zh-TW", options);
    }
  };

  setTodaysDate();

  // --- 功能 2: Modal 視窗開關 ---
  const openModal = () => addHabitModal.classList.add("show");
  const closeModal = () => addHabitModal.classList.remove("show");

  if(addHabitBtn) addHabitBtn.addEventListener("click", openModal);
  if(closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if(cancelBtn) cancelBtn.addEventListener("click", closeModal);
  if(addHabitModal) addHabitModal.addEventListener("click", (event) => {
    if (event.target === addHabitModal) {
      closeModal();
    }
  });

  // --- 功能 3: 習慣打卡 ---
  habitItems.forEach((item) => {
    const toggleHabit = () => {
      item.classList.toggle("completed");
      const isCompleted = item.classList.contains("completed");
      item.setAttribute("aria-pressed", isCompleted);
    };

    item.addEventListener("click", toggleHabit);

    // 讓鍵盤使用者也能操作
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // 防止頁面滾動
        toggleHabit();
      }
    });
  });

  // --- 功能 4: 頁面切換 ---
  const switchPage = (targetPageId) => {
    // 隱藏所有頁面
    pages.forEach(page => {
        page.classList.add('hidden');
    });

    // 顯示目標頁面
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // 更新導覽列 active 狀態
    navLinks.forEach(link => {
        if (link.dataset.page === targetPageId) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
  };

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const targetPageId = link.dataset.page;
        switchPage(targetPageId);
    });
  });

  // 初始顯示儀表板
  switchPage('dashboard-page');
});
