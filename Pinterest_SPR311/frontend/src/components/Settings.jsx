import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../api/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./Settings.css";

const Settings = () => {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    bio: "",
    avatarUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const data = await authService.getCurrentUser();
      setUserData({
        username: data.username || "",
        email: data.email || "",
        bio: data.bio || "",
        avatarUrl: data.avatarUrl || "",
      });
      // Устанавливаем превью аватара
      if (data.avatarUrl) {
        const fullAvatarUrl = data.avatarUrl.startsWith("http")
          ? data.avatarUrl
          : `http://localhost:5001${data.avatarUrl}`;
        setAvatarPreview(fullAvatarUrl);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Не вдалося завантажити дані користувача");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка типа файла
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Невірний формат файлу. Дозволені: JPG, PNG, GIF, WEBP");
        return;
      }

      // Проверка размера (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Розмір файлу не може перевищувати 5MB");
        return;
      }

      setAvatarFile(file);
      setError("");

      // Создаем превью
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const profileData = {
        username: userData.username,
        bio: userData.bio || "",
        avatarFile: avatarFile,
        // Если загружен файл, не отправляем URL, иначе отправляем URL если он изменился
        avatarUrl: avatarFile ? null : userData.avatarUrl || null,
      };

      console.log("Sending profile data:", {
        username: profileData.username,
        bio: profileData.bio,
        hasAvatarFile: !!profileData.avatarFile,
        avatarUrl: profileData.avatarUrl,
      });

      const result = await authService.updateProfile(profileData);

      console.log("Profile update result:", result);

      // Обновляем локальные данные
      setUserData((prev) => ({
        ...prev,
        username: result.username,
        bio: result.bio,
        avatarUrl: result.avatarUrl,
      }));

      // Обновляем превью аватара
      if (result.avatarUrl) {
        const fullAvatarUrl = result.avatarUrl.startsWith("http")
          ? result.avatarUrl
          : `http://localhost:5001${result.avatarUrl}`;
        setAvatarPreview(fullAvatarUrl);
      }

      setAvatarFile(null);

      // Обновляем данные пользователя в контексте
      if (updateUser) {
        await updateUser();
      }

      setMessage(result.message || "Налаштування успішно збережено!");

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError(
        err.response?.data?.message || "Не вдалося зберегти налаштування"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-page">
        <Navbar />
        <div className="settings-container">
          <div className="settings-content">
            <h1>Налаштування</h1>
            <p>Будь ласка, увійдіть, щоб переглянути налаштування.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="settings-page">
        <Navbar />
        <div className="settings-container">
          <div className="settings-content">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <Navbar />
      <div className="home-layout">
        <Sidebar />
        <div className="settings-container">
          <div className="settings-content">
            <h1>Налаштування</h1>

            {message && (
              <div className="settings-message success">{message}</div>
            )}
            {error && <div className="settings-message error">{error}</div>}

            <form onSubmit={handleSave} className="settings-form">
              <div className="settings-section">
                <h2>Профіль</h2>

                <div className="form-group">
                  <label htmlFor="username">Ім'я користувача</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={userData.username}
                    onChange={handleInputChange}
                    placeholder="Введіть ім'я користувача"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Електронна пошта</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleInputChange}
                    placeholder="Введіть електронну пошту"
                    disabled
                  />
                  <small>Електронну пошту не можна змінити</small>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Про себе</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={userData.bio}
                    onChange={handleInputChange}
                    placeholder="Розкажіть про себе"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="avatar">Аватар</label>

                  {avatarPreview && (
                    <div className="avatar-preview">
                      <img src={avatarPreview} alt="Avatar preview" />
                    </div>
                  )}

                  <input
                    type="file"
                    id="avatar"
                    name="avatar"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    className="avatar-input"
                  />
                  <small>
                    Завантажте зображення (JPG, PNG, GIF, WEBP, макс. 5MB)
                  </small>

                  {!avatarFile && userData.avatarUrl && (
                    <div className="avatar-url-fallback">
                      <small>Або введіть URL:</small>
                      <input
                        type="url"
                        id="avatarUrl"
                        name="avatarUrl"
                        value={userData.avatarUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/avatar.jpg"
                        className="avatar-url-input"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="settings-actions">
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? "Збереження..." : "Зберегти зміни"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
