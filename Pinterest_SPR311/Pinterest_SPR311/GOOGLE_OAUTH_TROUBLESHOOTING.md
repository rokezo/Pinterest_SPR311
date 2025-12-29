# Решение проблемы с Google OAuth

## Проблема: "An error occurred. Please try again later."

### Шаг 1: Проверьте настройки в Google Cloud Console

1. Перейдите на https://console.cloud.google.com/
2. Выберите ваш проект
3. Перейдите в "APIs & Services" → "Credentials"
4. Найдите ваш OAuth 2.0 Client ID
5. Убедитесь, что в "Authorized redirect URIs" добавлен **ТОЧНО** такой URI:
   ```
   http://localhost:5001/api/Auth/google-callback
   ```
   
   ⚠️ **ВАЖНО**: URI должен быть точно таким, без лишних слэшей или пробелов!

### Шаг 2: Проверьте appsettings.json

Убедитесь, что в файле `appsettings.json` указаны правильные значения:

```json
"Google": {
  "ClientId": "ваш-client-id.apps.googleusercontent.com",
  "ClientSecret": "GOCSPX-ваш-secret"
}
```

### Шаг 3: Перезапустите backend сервер

После изменения настроек обязательно перезапустите сервер:

```bash
cd Pinterest_SPR311/Pinterest_SPR311/backend/ClonePinterest.API
dotnet run
```

### Шаг 4: Проверьте логи

При запуске сервера проверьте логи. Должно быть сообщение о том, что Google OAuth настроен (или предупреждение, если credentials не найдены).

### Шаг 5: Проверьте в браузере

1. Откройте консоль разработчика (F12)
2. Перейдите на вкладку "Network"
3. Попробуйте войти через Google
4. Посмотрите, какой запрос отправляется и какой ответ приходит

### Возможные проблемы:

1. **Redirect URI mismatch**: 
   - Убедитесь, что в Google Console указан точно такой же URI, как в коде
   - Проверьте, что нет лишних пробелов или символов

2. **Схема Google не зарегистрирована**:
   - Проверьте, что ClientId и ClientSecret не равны "YOUR_GOOGLE_CLIENT_ID" и "YOUR_GOOGLE_CLIENT_SECRET"
   - Проверьте логи при запуске сервера

3. **CORS проблемы**:
   - Убедитесь, что в `Program.cs` правильно настроен CORS
   - Проверьте, что `http://localhost:5173` добавлен в разрешенные origins

4. **Cookies не работают**:
   - В development режиме cookies настроены на `SameSiteMode.None`
   - Убедитесь, что браузер не блокирует cookies

### Дополнительная проверка:

Попробуйте открыть напрямую в браузере:
```
http://localhost:5001/api/Auth/google
```

Если схема Google не настроена, вы увидите сообщение об ошибке. Если все настроено правильно, вас должно перенаправить на страницу авторизации Google.

