# app.py

from app import create_app

# 透過應用程式工廠建立 app 實例
app = create_app()

if __name__ == '__main__':
    # 這裡的 host='0.0.0.0' 讓你的作業系統可以從外部網路訪問此應用
    # debug=True 會在程式碼變更時自動重載，這是由 .flaskenv 控制的
    app.run(host='0.0.0.0')
