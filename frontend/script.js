document.addEventListener("DOMContentLoaded", () => {
  // --- 元素選擇 ---
  const addHabitBtn = document.getElementById("add-habit-btn");
  const addHabitModal = document.getElementById("add-habit-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const habitItems = document.querySelectorAll(".habit-item");
  const subtitle = document.getElementById("page-subtitle");

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
    subtitle.textContent = today.toLocaleDateString("zh-TW", options);
  };

  setTodaysDate();

  // --- 功能 2: Modal 視窗開關 ---
  const openModal = () => addHabitModal.classList.add("show");
  const closeModal = () => addHabitModal.classList.remove("show");

  addHabitBtn.addEventListener("click", openModal);
  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);
  // 點擊 Modal 背景也會關閉
  addHabitModal.addEventListener("click", (event) => {
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
});
