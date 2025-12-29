import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsService } from "../api/notifications";
import PinCard from "./PinCard";
import "./NotificationsModal.css";
import "./PinGrid.css";

const NotificationsModal = ({ isOpen, onClose, onNotificationClick }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [recommendedPins, setRecommendedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("notifications");

  useEffect(() => {
    if (isOpen) {
      loadNotifications(1);
    }
  }, [isOpen]);

  const loadNotifications = async (pageNum = 1) => {
    try {
      setLoading(true);
      const data = await notificationsService.getNotifications(pageNum, 20);
      console.log("Notifications data:", data);
      if (pageNum === 1) {
        setNotifications(data.notifications || []);
        setRecommendedPins(data.recommendedPins || []);
      } else {
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
      }
      setHasMore(pageNum < (data.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setNotifications([]);
      setRecommendedPins([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationsService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }

    if (notification.pinId) {
      navigate(`/pin/${notification.pinId}`);
      onClose();
    } else if (notification.userId) {
      navigate(`/user/${notification.userId}`);
      onClose();
    }

    if (onNotificationClick) {
      onNotificationClick();
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      if (onNotificationClick) {
        onNotificationClick();
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "щойно";
    if (diffMins < 60) return `${diffMins} хв тому`;
    if (diffHours < 24) return `${diffHours} год тому`;
    if (diffDays < 7) return `${diffDays} дн тому`;
    return date.toLocaleDateString("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div
        className="notifications-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notifications-modal-header">
          <div className="notifications-modal-tabs">
            <button
              className={`notifications-tab ${activeTab === "notifications" ? "active" : ""}`}
              onClick={() => setActiveTab("notifications")}
            >
              Сповіщення
            </button>
            <button
              className={`notifications-tab ${activeTab === "recommended" ? "active" : ""}`}
              onClick={() => setActiveTab("recommended")}
            >
              Рекомендації
            </button>
          </div>
          {activeTab === "notifications" && unreadCount > 0 && (
            <button
              className="notifications-mark-all-read"
              onClick={handleMarkAllAsRead}
            >
              Позначити всі як прочитані
            </button>
          )}
          <button className="notifications-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="notifications-modal-content">
          {loading ? (
            <div className="notifications-loading">Завантаження...</div>
          ) : activeTab === "notifications" ? (
            notifications.length === 0 ? (
              <div className="notifications-empty">
                <p>У вас немає сповіщень</p>
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.avatarUrl && (
                      <div className="notification-avatar">
                        <img
                          src={
                            notification.avatarUrl?.startsWith("http") ||
                            notification.avatarUrl?.startsWith("//")
                              ? notification.avatarUrl
                              : `http://localhost:5001${notification.avatarUrl}`
                          }
                          alt={notification.username || ""}
                        />
                      </div>
                    )}
                    <div className="notification-content">
                      <p className="notification-message">
                        {notification.message || "Нове сповіщення"}
                      </p>
                      <span className="notification-time">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="notification-dot"></div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            recommendedPins.length === 0 ? (
              <div className="notifications-empty">
                <p>Поки що немає рекомендацій</p>
                <p className="notifications-empty-hint">
                  Переглядайте більше пінів, щоб отримувати персоналізовані рекомендації
                </p>
              </div>
            ) : (
              <div className="notifications-recommended">
                <div className="notifications-recommended-header">
                  <h3>Рекомендовані для вас</h3>
                  <p className="notifications-recommended-subtitle">
                    На основі ваших переглядів
                  </p>
                </div>
                <div className="pin-grid">
                  {recommendedPins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} hideSaveButton={true} hideDownloadButton={true} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;

