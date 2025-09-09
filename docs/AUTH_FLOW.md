# 前端認證架構藍圖 (Frontend Authentication Architectural Blueprint)

- **文件版本**: 1.0
- **作者**: Gemini (資安架構師 / 資深前端工程師)
- **狀態**: `草案`

---

## 1. 核心原則與架構決策

### 1.1. 技術選型與權衡 (Token 儲存策略)

我們將選擇 `localStorage` 來儲存 JWT (JSON Web Token)。此決策基於以下考量：

-   **優點**:
    -   **API 簡單易用**: `localStorage` 提供直觀的 `setItem()`, `getItem()`, `removeItem()` 方法，易於開發者操作。
    -   **跨分頁共享**: 儲存在 `localStorage` 中的 Token 可以被同源 (same-origin) 的所有瀏覽器分頁共享，方便使用者在多個分頁間保持登入狀態。
    -   **持久化儲存**: Token 會在瀏覽器關閉後依然存在，使用者無需每次開啟瀏覽器都重新登入，提升使用者體驗。

-   **主要安全風險 (XSS 攻擊)**:
    -   `localStorage` 中的數據**容易受到跨站腳本 (XSS) 攻擊**。一旦攻擊者成功在頁面中注入惡意 JavaScript 程式碼，他們就可以直接存取 `localStorage` 中的所有數據，包括 JWT Token。攻擊者獲取 Token 後，即可冒充使用者發送請求，造成會話劫持 (Session Hijacking)。

-   **基礎緩解措施**:
    -   **內容安全策略 (Content Security Policy, CSP)**: 實施嚴格的 CSP，限制頁面可以載入的腳本、樣式和其他資源的來源。這能有效防禦大多數 XSS 攻擊，因為它阻止了惡意腳本的載入和執行。
    -   **輸入淨化 (Input Sanitization)**: 對所有來自使用者或外部來源的輸入數據進行嚴格的驗證、過濾和淨化，防止惡意程式碼（如 `<script>` 標籤）被儲存到資料庫或直接顯示在頁面上。
    -   **輸出編碼 (Output Encoding)**: 在將任何來自使用者或不可信來源的數據渲染到 DOM 之前，對其進行適當的編碼（例如 HTML 實體編碼）。這可以防止瀏覽器將惡意數據解釋為可執行程式碼。
    -   **Token 有效期短**: 設定 JWT 的有效期限盡可能短（例如 15-30 分鐘）。即使 Token 被盜，其生命週期也有限，降低了攻擊的窗口。應搭配 Refresh Token 機制來無感刷新 Token，但 Refresh Token 應儲存在更安全的 `HttpOnly` Cookie 中，這屬於後端和更複雜的前端範疇。
    -   **不儲存敏感資訊**: JWT 的 Payload 應只包含非敏感的公開資訊（如使用者 ID、角色），不應包含密碼、信用卡號等敏感數據。

### 1.2. API 客戶端攔截器 (API Client Interceptor)

我們將在 `api.js` 模組中建立一個集中的 `apiFetch` 封裝函式（已實現）。其核心職責是：在**每個**發出的請求中，自動從 `localStorage` 讀取 Token 並將其附加到 `Authorization: Bearer <token>` 標頭中。這確保了所有需要認證的 API 請求都能自動攜帶 Token，簡化了業務邏輯的開發。

---

## 2. 前端認證狀態機 (Frontend Auth State Machine)

我們將在前端的 `state` 物件中，維護一個完整的認證狀態機，而不僅僅是一個布林值。這使得 UI 能夠更精確地反映認證過程中的不同階段，提供更優質的使用者體驗。

-   **狀態定義**:
    -   `authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'`
        -   `idle`: 應用程式初始狀態，或認證流程未啟動。
        -   `loading`: 正在進行登入、註冊或 Token 驗證等認證相關的非同步操作。
        -   `authenticated`: 使用者已成功登入並通過驗證，具備訪問受保護資源的權限。
        -   `unauthenticated`: 使用者未登入，或其 Token 無效/已過期，無法訪問受保護資源。
        -   `error`: 在認證過程中發生了錯誤（例如網路問題、憑證錯誤）。
    -   `user: { id, name, email } | null`: 儲存已認證使用者的基本資訊。在 `unauthenticated` 或 `error` 狀態下為 `null`。
    -   `error: string | null`: 儲存認證過程中發生的具體錯誤訊息，用於向使用者顯示。

-   **設計理由**:
    -   **精確的 UI 反饋**: 能夠根據 `authStatus` 精確地控制 UI 元素（例如，在 `loading` 狀態下禁用登入按鈕並顯示載入指示器，在 `error` 狀態下顯示錯誤訊息）。
    -   **清晰的邏輯流**: 狀態機使得認證流程的邏輯更加清晰和可預測，減少了條件判斷的複雜性。
    -   **優雅的錯誤處理**: 能夠將認證錯誤與其他應用程式錯誤區分開來，並提供專門的處理和顯示。

---

## 3. 核心流程圖 (Core Flowcharts)

以下流程圖使用 Mermaid.js 語法，展示了認證相關的核心流程及其伴隨的 UI 狀態變化。

### 3.1. 使用者登入流程

````mermaid
graph TD
    A[使用者輸入憑證] --> B{點擊登入};
    B --> C{前端表單驗證}; 
    C -- 成功 --> D{更新狀態: authStatus='loading', error=null};
    D --> E[UI: 禁用登入按鈕/顯示載入指示器];
    E --> F[發送 POST /auth/login 請求];
    F -- 成功 (200 OK, with token) --> G{儲存 Token 到 localStorage};
    G --> H{更新狀態: authStatus='authenticated', user data, error=null};
    H --> I[UI: 導向主應用/儀表板];
    F -- 失敗 (401/403/500) --> J{更新狀態: authStatus='error', error='錯誤訊息'}; 
    J --> K[UI: 顯示錯誤訊息/啟用按鈕];
````

### 3.2. 使用者登出流程

````mermaid
graph TD
    A[使用者點擊登出] --> B{更新狀態: authStatus='loading'};
    B --> C[UI: 禁用所有互動/顯示載入];
    C --> D{清除 localStorage 中的 Token};
    D --> E{清除前端狀態};
    E --> F[更新狀態: authStatus='unauthenticated', error=null];
    F --> G[UI: 導向登入頁面];
    G -- (可選) 發送 API 請求 --> H[後端清除 Session/Token];
````

### 3.3. 應用程式啟動時的認證檢查流程

````mermaid
graph TD
    A[應用程式啟動] --> B{檢查 localStorage 是否有 Token?};
    B -- 無 Token --> C{更新狀態: authStatus='unauthenticated'};
    C --> D[UI: 顯示登入頁面];
    B -- 有 Token --> E{更新狀態: authStatus='loading'};
    E --> F[UI: 顯示載入指示器];
    F --> G[發送 GET /users/me 請求];
    G -- 成功 --> H{更新狀態: authStatus='authenticated'};
    H --> I[UI: 載入主應用數據/顯示儀表板];
    G -- 失敗 --> J{清除 localStorage 中的 Token};
    J --> K{更新狀態: authStatus='unauthenticated', error='Token 無效/過期'}; 
    K --> L[UI: 顯示登入頁面];
````

---

## 4. 路由與授權：路由守衛 (Routing & Authorization: Route Guards)

### 4.1. 概念闡述

「路由守衛」就像是應用程式中每個「房間」門口的保全。當使用者嘗試進入某個「房間」（即訪問某個路由或頁面）時，保全會先檢查他們是否具備進入的「通行證」（即是否已認證或具備特定權限）。如果沒有，保全就會阻止他們進入，並將他們帶到指定的地方（例如登入頁面）。

### 4.2. 職責定義

-   **公開路由 (Public Routes)**:
    -   例如 `/login`, `/register`。這些路由不需要任何認證，任何人都可以訪問。
    -   路由守衛會確保已登入的使用者不會被困在這些頁面。如果 `authStatus` 為 `authenticated`，則會自動將使用者導向主應用（例如儀表板）。

-   **私有路由 (Private Routes)**:
    -   例如 `/dashboard`, `/settings`, `/review`。這些路由包含敏感或個人化數據，必須在進入前由「路由守衛」檢查 `state.authStatus` 是否為 `authenticated`。

-   **無權限處理**:
    -   若檢查失敗（即 `authStatus` 不是 `authenticated`），路由守衛必須立即將使用者**重新導向 (Redirect)** 至登入頁面，並可選地附帶一個提示訊息，告知使用者需要登入才能訪問該頁面。

---

## 5. 錯誤處理與 Token 過期策略

### 5.1. 集中處理

`api.js` 中的 `apiFetch` 函式將作為 API 客戶端攔截器，負責攔截所有從後端返回的 API 回應。這是處理 Token 過期和認證錯誤的關鍵點，因為它允許我們在單一位置處理這些全域性的問題，而無需在每個 API 呼叫處重複邏輯。

### 5.2. 標準流程

當 `apiFetch` 偵測到後端返回 `401 Unauthorized` 狀態碼時，這表示當前使用的 Token 無效或已過期。此時，`apiFetch` 必須觸發一個**全域的登出程序**：

1.  **清除 `localStorage` 中的 `authToken`**: 移除無效的 Token，防止其被再次使用。
2.  **重設前端 `state` 中的認證相關狀態**: 將 `isAuthenticated` 設為 `false`，`user` 設為 `null`，`authStatus` 設為 `unauthenticated`。這會立即更新 UI，反映使用者已登出。
3.  **將使用者重新導向到登入頁面**: 確保使用者被帶到正確的入口點，並可選地顯示一個訊息，告知他們會話已過期。

這樣做的好處是，所有元件都不需要單獨處理 `401` 錯誤，只需專注於自身的業務邏輯。任何 `401` 錯誤都會自動觸發一個安全且一致的登出流程。
