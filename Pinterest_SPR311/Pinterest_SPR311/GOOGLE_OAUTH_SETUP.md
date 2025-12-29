# Настройка Google OAuth - Пошаговая инструкция

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите на https://console.cloud.google.com/
2. Войдите в свой Google аккаунт
3. Нажмите на выпадающий список проектов вверху страницы
4. Нажмите "Новый проект" (New Project)
5. Введите название проекта (например: "Pinterest Clone")
6. Нажмите "Создать" (Create)

## Шаг 2: Включение Google+ API

1. В меню слева выберите "APIs & Services" → "Library"
2. В поиске введите "Google+ API" или "Google Identity"
3. Выберите "Google+ API" или "Google Identity Services API"
4. Нажмите "Enable" (Включить)

## Шаг 3: Создание OAuth 2.0 Credentials

1. В меню слева выберите "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth client ID"
3. Если появится запрос на настройку OAuth consent screen:
   - Выберите "External" (Внешний)
   - Нажмите "Create"
   - Заполните обязательные поля:
     - App name: "Pinterest Clone" (или любое другое название)
     - User support email: ваш email
     - Developer contact information: ваш email
   - Нажмите "Save and Continue"
   - На шаге "Scopes" нажмите "Save and Continue"
   - На шаге "Test users" (если нужно) нажмите "Save and Continue"
   - Нажмите "Back to Dashboard"

4. Теперь создайте OAuth client ID:
   - Application type: выберите "Web application"
   - Name: "Pinterest Clone Web Client" (или любое другое название)
   - Authorized JavaScript origins:
     - Добавьте: `http://localhost:5001`
     - Добавьте: `http://localhost:5173`
   - Authorized redirect URIs:
     - Добавьте: `http://localhost:5001/api/Auth/google-callback`
   - Нажмите "Create"

5. Скопируйте:
   - **Client ID** (например: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
   - **Client Secret** (например: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

## Шаг 4: Настройка в проекте

1. Откройте файл: `Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API/appsettings.json`

2. Замените значения в секции "Google":
```json
"Google": {
  "ClientId": "ВАШ_CLIENT_ID_СЮДА",
  "ClientSecret": "ВАШ_CLIENT_SECRET_СЮДА"
}
```

Например:
```json
"Google": {
  "ClientId": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "ClientSecret": "GOCSPX-abcdefghijklmnopqrstuvwxyz"
}
```

3. Сохраните файл

## Шаг 5: Перезапуск сервера

1. Остановите backend сервер (если запущен)
2. Запустите заново:
```bash
cd Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API
dotnet run
```

## Шаг 6: Проверка

1. Откройте frontend приложение
2. Нажмите "Увійти" или "Зареєструватися"
3. Нажмите кнопку "Продовжити з Google"
4. Должно открыться окно Google для авторизации
5. После авторизации вы будете автоматически залогинены

## Важные замечания:

- **Для production**: Вам нужно будет добавить реальные домены в "Authorized JavaScript origins" и "Authorized redirect URIs"
- **Client Secret**: Храните в секрете, не коммитьте в публичный репозиторий
- **OAuth Consent Screen**: Для production нужно будет пройти верификацию Google

## Решение проблем:

- Если кнопка Google не работает: проверьте, что Client ID и Client Secret правильно указаны в appsettings.json
- Если ошибка "redirect_uri_mismatch": проверьте, что redirect URI точно совпадает с указанным в Google Console
- Если ошибка "access_denied": проверьте настройки OAuth consent screen

