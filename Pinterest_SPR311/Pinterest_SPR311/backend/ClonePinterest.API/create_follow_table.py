#!/usr/bin/env python3
import sqlite3
import os

db_path = "clonepinterest.db"

if not os.path.exists(db_path):
    print(f"Ошибка: База данных {db_path} не найдена!")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Создание таблицы Follows...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS "Follows" (
            "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "FollowerId" INTEGER NOT NULL,
            "FollowingId" INTEGER NOT NULL,
            "CreatedAt" TEXT NOT NULL,
            FOREIGN KEY("FollowerId") REFERENCES "Users"("Id") ON DELETE CASCADE,
            FOREIGN KEY("FollowingId") REFERENCES "Users"("Id") ON DELETE CASCADE
        )
    ''')
    
    print("Создание индекса...")
    cursor.execute('''
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Follows_FollowerId_FollowingId" 
        ON "Follows"("FollowerId", "FollowingId")
    ''')
    
    conn.commit()
    conn.close()
    
    print("✓ Таблица Follows успешно создана!")
    print("✓ Индекс успешно создан!")
    
except Exception as e:
    print(f"Ошибка: {e}")
    exit(1)

