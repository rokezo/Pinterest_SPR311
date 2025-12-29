-- SQL скрипт для создания таблицы Views
-- Выполните этот скрипт в вашей базе данных SQLite

-- Создание таблицы Views
CREATE TABLE IF NOT EXISTS "Views" (
    "Id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "UserId" INTEGER NOT NULL,
    "PinId" INTEGER NOT NULL,
    "ViewedAt" TEXT NOT NULL,
    FOREIGN KEY("UserId") REFERENCES "Users"("Id") ON DELETE CASCADE,
    FOREIGN KEY("PinId") REFERENCES "Pins"("Id") ON DELETE CASCADE
);

-- Создание индекса для быстрого поиска просмотров
CREATE INDEX IF NOT EXISTS "IX_Views_UserId" ON "Views"("UserId");
CREATE INDEX IF NOT EXISTS "IX_Views_PinId" ON "Views"("PinId");

