# 心境軌跡 (MindTrack): 你的個人成長夥伴

![建置狀態](https://img.shields.io/badge/build-passing-brightgreen)
![授權條款](https://img.shields.io/badge/license-MIT-blue)
![貢獻者](https://img.shields.io/badge/contributors-1-orange)
![最後提交](https://img.shields.io/github/last-commit/eric861129/2025iThome-HabitMoodApp)

## 專案簡介

MindTrack 是一個旨在幫助使用者追蹤好習慣、記錄每日心情，並透過視覺化洞察揭示行為與感受之間關聯的 Web 應用程式。我們的願景是打造一個最直覺、最富有洞察力的個人成長工具。我們相信，真正的自我提升源於深刻的自我覺察。MindTrack 不僅僅是一個紀錄工具，而是每一位使用者專屬的數據分析師，透過揭示個人行為與內在感受之間的微妙聯繫，賦予他們改善生活品質的知識與力量，最終引導使用者走向一個更健康、更快樂、更有意識的生活方式。

## 核心功能

*   **使用者認證**: 安全的註冊與登入系統。
    *   `[登入/註冊功能 GIF]`
*   **每日習慣追蹤**: 只需輕輕一點，即可輕鬆新增並追蹤每日習慣。
    *   `[習慣追蹤功能 GIF]`
*   **每日心情記錄**: 在 1-5 分的量表上快速記錄您的心情，並附上可選的筆記。
    *   `[心情記錄功能 GIF]`
*   **關聯性洞察**: 透過互動式圖表，將您的習慣與心情之間的關聯視覺化。
    *   `[關聯性圖表 GIF]`

## 技術棧與架構理念

| 類別 | 技術 |
| --- | --- |
| **後端** | Python, Flask, Flask-SQLAlchemy |
| **前端** | HTML5, CSS3, JavaScript (原生) |
| **資料庫** | SQLite (開發), PostgreSQL (生產) |
| **API 與結構** | Flask-RESTful, Marshmallow |
| **資料庫遷移** | Flask-Migrate (Alembic) |
| **測試** | Pytest |

本專案採用**前後端分離 (Headless)** 架構，將前端與後端獨立開發。這種方法允許獨立的開發與部署流程，提供了極大的靈活性與可擴展性。後端是一個模組化的 Flask 應用程式，使用 Blueprints 進行組織，以實現清晰的關注點分離。

## 專案結構

```
.
├── app/
│   ├── api/            # API 藍圖 (認證、習慣、心情)
│   ├── __init__.py     # 應用程式工廠
│   ├── models.py       # SQLAlchemy 資料庫模型
│   └── schemas.py      # Marshmallow 結構，用於 API 驗證
├── docs/               # 專案文件
├── frontend/           # 前端靜態檔案 (HTML, CSS, JS)
├── instance/
│   └── config.py       # 實例相關的設定檔
├── migrations/         # 資料庫遷移腳本
├── static/
│   └── API_SPEC.yml    # OpenAPI 規格文件
├── tests/              # Pytest 測試套件
├── .gitignore
├── app.py              # 應用程式進入點
├── requirements.txt    # Python 依賴套件
└── README.md
```

## 本地開發指南

### 先決條件

*   Git
*   Python 3.8+

### 後端設定

1.  **複製儲存庫：**
    ```sh
    git clone https://github.com/eric861129/2025iThome-HabitMoodApp.git
    cd 2025iThome-HabitMoodApp
    ```

2.  **建立並啟用虛擬環境：**
    ```sh
    python -m venv venv
    source venv/bin/activate  # 在 Windows 上，請使用 `venv\Scripts\activate`
    ```

3.  **安裝依賴套件：**
    ```sh
    pip install -r requirements.txt
    ```

4.  **初始化並升級資料庫：**
    ```sh
    flask db upgrade
    ```

5.  **執行後端伺服器：**
    ```sh
    flask run
    ```
    後端服務將會運行在 `http://127.0.0.1:5000`。

### 前端設定

1.  **在新終端機中，切換到前端目錄：**
    ```sh
    cd frontend
    ```

2.  **啟動一個簡易的 HTTP 伺服器：**
    ```sh
    python -m http.server
    ```
    現在可以透過 `http://localhost:8000` 訪問前端頁面。

## Vibe Coding 核心理念

本專案採用**文件驅動開發 (Document-Driven Development, DDD)** 的方法，並由 Gemini CLI 提供支援。我們首先在 `/docs` 目錄中定義了專案的願景、架構和使用者故事。這種「文件先行」的方法論確保了程式碼庫建立在一個堅實且經過深思熟慮的基礎之上。

Gemini CLI 被用來將這些文件轉化為功能性程式碼，確保了實作嚴格遵守預先定義的規格。這種工作流程提升了程式碼品質、改善了團隊協作，並最終產出一個高度可維護和可擴展的專案。

## 貢獻指南

我們歡迎社群的貢獻！如果您想為本專案做出貢獻，請參閱我們的 [貢獻指南](CONTRIBUTING.md) 以獲取更多入門資訊。

## 授權條款

本專案採用 **MIT 授權條款**。詳情請參閱 [LICENSE](LICENSE) 文件。