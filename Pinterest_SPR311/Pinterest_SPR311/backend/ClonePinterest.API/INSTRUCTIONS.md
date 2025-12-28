# Инструкция по добавлению таблиц Follow и Views

## Вариант 1: Использование SQL скрипта (рекомендуется)

1. Найдите файл базы данных SQLite (обычно `clonepinterest.db` в папке `ClonePinterest.API`)

2. Выполните SQL скрипт одним из способов:

### Способ A: Через командную строку
```bash
cd Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API
sqlite3 clonepinterest.db < add_follow_and_message_tables.sql
```

### Способ B: Через SQLite Browser или другой SQL клиент
- Откройте базу данных `clonepinterest.db`
- Откройте файл `add_follow_and_message_tables.sql`
- Скопируйте и выполните SQL команды

### Способ C: Через Python скрипт
```bash
cd Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API
python3 -c "import sqlite3; conn = sqlite3.connect('clonepinterest.db'); conn.executescript(open('add_follow_and_message_tables.sql').read()); conn.commit(); conn.close(); print('Таблицы созданы успешно!')"
```

## Вариант 2: Автоматическое создание при запуске (если база данных пустая)

Если вы удалите базу данных, Entity Framework автоматически создаст все таблицы при первом запуске приложения.

1. Удалите файл `clonepinterest.db`
2. Запустите backend приложение
3. Таблицы будут созданы автоматически

## Проверка

После выполнения скрипта проверьте, что таблицы созданы:

```bash
sqlite3 clonepinterest.db ".tables"
```

Вы должны увидеть таблицы `Follows` и `Views` в списке.

## Создание таблицы Views

Выполните аналогично:

```bash
cd Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API
python3 -c "import sqlite3; conn = sqlite3.connect('clonepinterest.db'); conn.executescript(open('add_views_table.sql').read()); conn.commit(); conn.close(); print('Таблица Views создана успешно!')"
```

Или откройте базу данных и выполните SQL из файла `add_views_table.sql`.

