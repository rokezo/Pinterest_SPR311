#!/bin/bash

echo "Заповнення бази даних тестовими даними..."
echo ""
echo "Варіанти:"
echo "1. Маленька база (10 користувачів, по 5 пінів)"
echo "2. Середня база (50 користувачів, по 10 пінів)"
echo "3. Велика база (100 користувачів, по 20 пінів)"
echo "4. Власні параметри"
echo ""
read -p "Виберіть варіант (1-4): " choice

case $choice in
    1)
        usersCount=10
        pinsPerUser=5
        ;;
    2)
        usersCount=50
        pinsPerUser=10
        ;;
    3)
        usersCount=100
        pinsPerUser=20
        ;;
    4)
        read -p "Кількість користувачів: " usersCount
        read -p "Пінів на користувача: " pinsPerUser
        ;;
    *)
        echo "Невірний вибір, використовую середні параметри"
        usersCount=50
        pinsPerUser=10
        ;;
esac

echo ""
echo "Відправляю запит до сервера..."
echo "URL: http://localhost:5000/api/seed/seed?usersCount=$usersCount&pinsPerUser=$pinsPerUser"
echo ""

response=$(curl -s -X POST "http://localhost:5000/api/seed/seed?usersCount=$usersCount&pinsPerUser=$pinsPerUser" \
  -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
    echo "✅ Успішно!"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
else
    echo "❌ Помилка при виконанні запиту"
    echo "Переконайтеся, що сервер запущений на http://localhost:5000"
fi

