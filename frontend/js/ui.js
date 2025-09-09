/**
 * @file ui.js
 * @description 應用程式的 UI 渲染模組。
 * 負責根據應用程式的狀態 (state) 將 UI 繪製到畫面上。
 */

import { state } from './state.js';

// 輔助函式：從 CSS 變數讀取值
const getCssVariable = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

let insightChartInstance = null; // 單一圖表實例

/**
 * 處理圖表數據，使其符合 Chart.js 規格書的 data prop 定義。
 * @param {Array<Object>} moods - 原始心情日誌數據。
 * @param {Array<Object>} habitLogs - 原始習慣日誌數據。
 * @returns {Array<Object>} 處理後的圖表數據陣列。
 */
function processChartData(moods, habitLogs) {
    const chartDataMap = new Map();

    // 填充心情數據
    moods.forEach(mood => {
        const date = mood.log_date; // Assuming log_date is 'YYYY-MM-DD'
        if (!chartDataMap.has(date)) {
            chartDataMap.set(date, { date, moodRating: null, completedHabits: [] });
        }
        chartDataMap.get(date).moodRating = mood.rating;
    });

    // 填充習慣數據
    habitLogs.forEach(log => {
        const date = log.log_date; // Assuming log_date is 'YYYY-MM-DD'
        if (!chartDataMap.has(date)) {
            chartDataMap.set(date, { date, moodRating: null, completedHabits: [] });
        }
        // Assuming log.habit_name is available or can be derived
        // For now, we'll just use habit_id, ideally we'd map to habit names
        chartDataMap.get(date).completedHabits.push(`Habit ${log.habit_id}`); 
    });

    // 將 Map 轉換為排序後的陣列
    const sortedDates = Array.from(chartDataMap.keys()).sort();
    return sortedDates.map(date => chartDataMap.get(date));
}

/**
 * 渲染關聯性洞察圖表。
 * @param {Array<Object>} chartData - 處理後的圖表數據。
 */
function renderInsightChart(chartData) {
    const chartCanvas = document.getElementById('insightChart');
    if (!chartCanvas) return; // 如果 canvas 元素還沒渲染出來，則跳過

    const ctx = chartCanvas.getContext('2d');

    // 處理數據不足情況
    if (chartData.length < 3) {
        if (insightChartInstance) {
            insightChartInstance.destroy();
            insightChartInstance = null;
        }
        chartCanvas.parentNode.innerHTML = `
            <section class="chart-container">
                <h2>關聯性洞察</h2>
                <p class="chart-message">持續記錄幾天，就能解鎖你的個人洞察報告！</p>
            </section>
        `;
        return;
    }

    // 從 CSS 變數獲取顏色和字體
    const primaryColor = getCssVariable('--primary-color');
    const accentColor = getCssVariable('--accent-color');
    const neutralText = getCssVariable('--neutral-text');
    const fontBody = getCssVariable('--font-body');

    const labels = chartData.map(d => d.date);
    const moodData = chartData.map(d => d.moodRating);
    const habitScatterData = chartData.filter(d => d.completedHabits.length > 0).map(d => ({
        x: d.date,
        y: d.moodRating // 散點的 Y 值可以與心情分數對齊
    }));

    const data = {
        labels: labels,
        datasets: [
            {
                type: 'line',
                label: '心情趨勢',
                data: moodData,
                borderColor: primaryColor,
                backgroundColor: 'transparent', // 可以設定漸層
                tension: 0.4, // 平滑曲線
                fill: false,
                yAxisID: 'y',
            },
            {
                type: 'scatter',
                label: '完成習慣',
                data: habitScatterData,
                backgroundColor: accentColor,
                pointRadius: 6,
                pointHoverRadius: 8,
                yAxisID: 'y',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(context) {
                        return context[0].label; // 日期
                    },
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label === '心情趨勢') {
                            label += ': ' + context.parsed.y + '/5';
                        } else if (label === '完成習慣') {
                            const dataPoint = chartData.find(d => d.date === context.parsed.x);
                            if (dataPoint && dataPoint.completedHabits.length > 0) {
                                label = '完成習慣: ' + dataPoint.completedHabits.join(', ');
                            } else {
                                label = ''; // 不顯示沒有完成習慣的散點提示
                            }
                        }
                        return label;
                    },
                },
            },
            legend: {
                onClick: (e, legendItem, legend) => {
                    const index = legendItem.datasetIndex;
                    const ci = legend.chart;
                    if (ci.isDatasetVisible(index)) {
                        ci.hide(index);
                        legendItem.hidden = true;
                    } else {
                        ci.show(index);
                        legendItem.hidden = false;
                    }
                },
                labels: {
                    color: neutralText,
                    font: { family: fontBody },
                },
            },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    displayFormats: {
                        day: 'MM/DD'
                    },
                    tooltipFormat: 'YYYY-MM-DD'
                },
                title: {
                    display: true,
                    text: '日期',
                    color: neutralText,
                    font: { family: fontBody }
                },
                ticks: {
                    color: neutralText,
                    font: { family: fontBody }
                },
            },
            y: {
                min: 1,
                max: 5,
                ticks: {
                    stepSize: 1,
                    color: neutralText,
                    font: { family: fontBody }
                },
                title: {
                    display: true,
                    text: '心情分數',
                    color: neutralText,
                    font: { family: fontBody }
                },
            },
        },
    };

    if (insightChartInstance) {
        insightChartInstance.data.labels = data.labels;
        insightChartInstance.data.datasets = data.datasets;
        insightChartInstance.options = options;
        insightChartInstance.update();
    } else {
        insightChartInstance = new Chart(ctx, {
            type: 'line', // 預設類型，但數據集會覆蓋
            data: data,
            options: options,
        });
    }
}

export function renderHabitList(container) {
  if (!container) return;
  const { habits, isLoading, error } = state;

  if (isLoading.main && habits.length === 0) {
    container.innerHTML = `<div class="loading-spinner"></div>`;
    return;
  }
  if (error) {
    container.innerHTML = `
      <div class="error-message">
        <p>${error.message}</p>
        <button class="retry-button" data-action="retry-main-data">重試</button>
      </div>`;
    return;
  }
  if (habits.length === 0) {
    container.innerHTML = "<p>您尚未新增任何習慣。點擊「新增習慣」開始吧！</p>";
    return;
  }

  container.innerHTML = habits
    .map((habit) => {
      const isCompleted = habit.completed_today || false;
      return `
        <div class="habit-item ${isCompleted ? "completed" : ""}" data-habit-id="${habit.id}">
          <div class="habit-interaction-area" data-action="toggle-habit" role="button" tabindex="0">
              <div class="habit-checkbox"></div>
              <span class="habit-name">${habit.name}</span>
          </div>
          <div class="habit-actions">
              <button class="action-btn" data-action="delete-habit" aria-label="刪除習慣">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");
}

export function renderMoodTracker(container) {
    if (!container) return;
    const rating = state.todayMoodLog?.rating || 0;
    const moodSelector = container.querySelector(".mood-selector");
    const moodNotesInput = container.querySelector(".mood-notes-input");
    const saveMoodBtn = container.querySelector(".save-mood-btn");

    moodSelector.querySelectorAll(".mood-option").forEach(btn => {
        btn.classList.toggle("active", Number(btn.dataset.rating) === rating);
    });
    moodNotesInput.value = state.todayMoodLog?.notes || '';
    saveMoodBtn.disabled = state.isLoading.mood;
    saveMoodBtn.textContent = state.isLoading.mood ? '儲存中...' : '儲存心情';
}

export function renderAuthView(container) {
    const isLoading = state.isLoading.auth;
    if (state.authView === 'login') {
        container.innerHTML = `
            <div class="auth-card">
                <div class="logo-container"><h2>MindTrack</h2></div>
                <div id="auth-content">
                    <form id="login-form">
                        <h3>登入</h3>
                        <div class="form-group">
                            <label for="login-email">電子郵件</label>
                            <input type="email" id="login-email" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="login-password">密碼</label>
                            <input type="password" id="login-password" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="auth-error" id="auth-error"></div>
                        <button type="submit" class="btn btn-primary" id="login-btn" ${isLoading ? 'disabled' : ''}>${isLoading ? '登入中...' : '登入'}</button>
                    </form>
                </div>
                <div class="auth-form-footer">
                    <p>還沒有帳號？ <a href="#" data-action="show-register">點此註冊</a></p>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="auth-card">
                <div class="logo-container"><h2>MindTrack</h2></div>
                <div id="auth-content">
                    <form id="register-form">
                        <h3>建立新帳號</h3>
                        <div class="form-group">
                            <label for="register-username">使用者名稱</label>
                            <input type="text" id="register-username" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="register-email">電子郵件</label>
                            <input type="email" id="register-email" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="form-group">
                            <label for="register-password">密碼</label>
                            <input type="password" id="register-password" class="form-input" required ${isLoading ? 'disabled' : ''}>
                        </div>
                        <div class="auth-error" id="auth-error"></div>
                        <button type="submit" class="btn btn-primary" id="register-btn" ${isLoading ? 'disabled' : ''}>${isLoading ? '註冊中...' : '註冊'}</button>
                    </form>
                </div>
                <div class="auth-form-footer">
                    <p>已經有帳號了？ <a href="#" data-action="show-login">點此登入</a></p>
                </div>
            </div>
        `;
    }
}

export function render() {
  const appRoot = document.getElementById('app-root');
  const mainAppTemplate = document.getElementById('main-app-template');
  const authTemplate = document.getElementById('auth-template');

  appRoot.innerHTML = '';
  const anyLoading = Object.values(state.isLoading).some(Boolean);

  switch (state.currentView) {
    case 'loading':
      appRoot.innerHTML = '<div class="loading-spinner"></div>';
      break;
    case 'auth':
      const authNode = authTemplate.content.cloneNode(true);
      renderAuthView(authNode.querySelector('.auth-layout'));
      appRoot.appendChild(authNode);
      break;
    case 'main':
      const mainNode = mainAppTemplate.content.cloneNode(true);
      mainNode.querySelector('#add-habit-btn').disabled = anyLoading;
      renderHabitList(mainNode.querySelector('.habit-list-container'));
      renderMoodTracker(mainNode.querySelector('.mood-tracker-container'));
      renderInsightChart(processChartData(state.moods, state.habitLogs)); // 渲染圖表
      appRoot.appendChild(mainNode);
      break;
  }
}
