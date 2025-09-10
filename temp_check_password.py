from werkzeug.security import check_password_hash

# 從 'flask show-users' 指令得到的 test01 使用者的雜湊值
stored_hash = "scrypt:32768:8:1$OtH6YPkmfknGYHEA$353f3514fd80258eaecb72ce5985a98885c4a611aa52699883cf03c0284ca0aa14d4d38f3bac76e5ccaaa51ef82c84e3abc2ecc30380184dc08fe3e78538fe78"

# 您提供的原始密碼
password_to_check = "test01"

# 進行比對
result = check_password_hash(stored_hash, password_to_check)

print(f"比對結果：密碼 'test01' 是否匹配資料庫中的雜湊值？ -> {result}")
