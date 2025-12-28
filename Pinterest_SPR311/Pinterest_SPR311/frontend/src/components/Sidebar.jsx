import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationsService } from "../api/notifications";
import CreatePinModal from "./CreatePinModal";
import CreateBoardModal from "./CreateBoardModal";
import CreateCollageModal from "./CreateCollageModal";
import NotificationsModal from "./NotificationsModal";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [compassHovered, setCompassHovered] = useState(false);
  const [compassPosition, setCompassPosition] = useState({ top: 0, left: 0 });
  const compassTimeoutRef = useRef(null);
  const compassButtonRef = useRef(null);
  const [createHovered, setCreateHovered] = useState(false);
  const [createPosition, setCreatePosition] = useState({ top: 0, left: 0 });
  const createTimeoutRef = useRef(null);
  const createButtonRef = useRef(null);
  const [createPinModalOpen, setCreatePinModalOpen] = useState(false);
  const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
  const [createCollageModalOpen, setCreateCollageModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const categories = [
    { name: "Краса", query: "beauty" },
    { name: "Їжа", query: "food" },
    { name: "Мистецтво", query: "art" },
    { name: "Подорожі", query: "travel" },
    { name: "Мода", query: "fashion" },
    { name: "Дизайн", query: "design" },
    { name: "Природа", query: "nature" },
    { name: "Архітектура", query: "architecture" },
    { name: "Тварини", query: "animals" },
    { name: "Спорт", query: "sport" },
  ];

  const handleCategoryClick = (query) => {
    console.log("Category clicked:", query);
    setCompassHovered(false);
    setSearchParams({ q: query });
    if (window.location.pathname !== "/") {
      navigate("/");
    }
  };

  const handleHomeClick = () => {
    setSearchParams({});
    navigate("/");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleBoardsClick = () => {
    navigate("/boards");
  };

  const handleNotificationsClick = () => {
    setNotificationsModalOpen(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsService.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      console.error("Error loading unread count:", err);
    }
  };

  const handleCreateItemClick = (type) => {
    setCreateHovered(false);
    if (type === "pin") {
      setCreatePinModalOpen(true);
    } else if (type === "board") {
      setCreateBoardModalOpen(true);
    } else if (type === "collage") {
      setCreateCollageModalOpen(true);
    }
  };

  const handleCreateClick = (e) => {
    e.stopPropagation();

    if (compassTimeoutRef.current) {
      clearTimeout(compassTimeoutRef.current);
      compassTimeoutRef.current = null;
    }
    setCompassHovered(false);

    if (createButtonRef.current) {
      const rect = createButtonRef.current.getBoundingClientRect();
      setCreatePosition({ top: rect.top, left: rect.right + 8 });
    }

    setCreateHovered(!createHovered);
  };

  const handleCreateDropdownEnter = () => {
    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = null;
    }
  };

  const handleCreateMenuLeave = () => {
    createTimeoutRef.current = setTimeout(() => {
      setCreateHovered(false);
    }, 300);
  };

  const handleCompassMenuEnter = (e) => {
    if (compassTimeoutRef.current) {
      clearTimeout(compassTimeoutRef.current);
      compassTimeoutRef.current = null;
    }

    if (createTimeoutRef.current) {
      clearTimeout(createTimeoutRef.current);
      createTimeoutRef.current = null;
    }
    setCreateHovered(false);

    if (compassButtonRef.current) {
      const rect = compassButtonRef.current.getBoundingClientRect();
      setCompassPosition({ top: rect.top, left: rect.right + 8 });
    }

    setCompassHovered(true);
  };

  const handleCompassDropdownEnter = () => {
    if (compassTimeoutRef.current) {
      clearTimeout(compassTimeoutRef.current);
      compassTimeoutRef.current = null;
    }
  };

  const handleCompassMenuLeave = () => {
    compassTimeoutRef.current = setTimeout(() => {
      setCompassHovered(false);
    }, 500);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        createHovered &&
        createButtonRef.current &&
        !createButtonRef.current.contains(event.target)
      ) {
        const dropdown = document.querySelector(".create-dropdown");
        if (dropdown && !dropdown.contains(event.target)) {
          setCreateHovered(false);
        }
      }
    };

    if (createHovered) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [createHovered]);

  const handleTooltipPosition = (e) => {
    const text = e.currentTarget.querySelector(".sidebar-text");
    if (text) {
      const rect = e.currentTarget.getBoundingClientRect();
      text.style.left = `${rect.right + 12}px`;
      text.style.top = `${rect.top + rect.height / 2}px`;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <button
          className="sidebar-item sidebar-home"
          onClick={handleHomeClick}
          onMouseEnter={handleTooltipPosition}
        >
          <span className="sidebar-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </span>
          <span className="sidebar-text">Головна</span>
        </button>

        <div className="sidebar-create-wrapper">
          <button
            ref={createButtonRef}
            className={`sidebar-item sidebar-create ${
              createHovered ? "menu-open" : ""
            }`}
            onClick={handleCreateClick}
            onMouseEnter={!createHovered ? handleTooltipPosition : undefined}
          >
            <span className="sidebar-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </span>
            <span className="sidebar-text">Створити</span>
          </button>
        </div>

        {createHovered && (
          <div
            className="create-dropdown"
            style={{
              position: "fixed",
              top: `${createPosition.top}px`,
              left: `${createPosition.left}px`,
              zIndex: 10000,
            }}
            onMouseEnter={handleCreateDropdownEnter}
            onMouseLeave={handleCreateMenuLeave}
          >
            <button
              className="create-dropdown-item"
              onClick={() => handleCreateItemClick("pin")}
            >
              <span className="create-dropdown-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </span>
              <span>Пін</span>
            </button>
            <button
              className="create-dropdown-item"
              onClick={() => handleCreateItemClick("board")}
            >
              <span className="create-dropdown-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </span>
              <span>Дошка</span>
            </button>
            <button
              className="create-dropdown-item"
              onClick={() => handleCreateItemClick("collage")}
            >
              <span className="create-dropdown-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </span>
              <span>Колаж</span>
            </button>
          </div>
        )}

        <button
          className="sidebar-item"
          onClick={handleBoardsClick}
          onMouseEnter={handleTooltipPosition}
        >
          <span className="sidebar-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </span>
          <span className="sidebar-text">Мої дошки</span>
        </button>

        <div
          className="sidebar-compass-wrapper"
          onMouseEnter={handleCompassMenuEnter}
          onMouseLeave={handleCompassMenuLeave}
        >
          <button
            ref={compassButtonRef}
            className="sidebar-item sidebar-compass"
          >
            <span className="sidebar-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2v6m0 8v6M2 12h6m8 0h6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24"></path>
              </svg>
            </span>
          </button>
        </div>

        {compassHovered && (
          <div
            className="compass-dropdown"
            style={{
              position: "fixed",
              top: `${compassPosition.top}px`,
              left: `${compassPosition.left}px`,
              zIndex: 10000,
            }}
            onMouseEnter={handleCompassDropdownEnter}
            onMouseLeave={handleCompassMenuLeave}
          >
            {categories.map((category) => (
              <button
                key={category.query}
                className="compass-dropdown-item"
                onClick={() => {
                  handleCategoryClick(category.query);
                  setCompassHovered(false);
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {isAuthenticated && (
          <button
            className="sidebar-item sidebar-notifications"
            onClick={handleNotificationsClick}
            onMouseEnter={handleTooltipPosition}
          >
            <span className="sidebar-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </span>
            {unreadCount > 0 && (
              <span className="sidebar-notification-badge">{unreadCount}</span>
            )}
            <span className="sidebar-text">Сповіщення</span>
          </button>
        )}

        <button
          className="sidebar-item sidebar-settings"
          onClick={handleSettingsClick}
          onMouseEnter={handleTooltipPosition}
        >
          <span className="sidebar-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
            </svg>
          </span>
          <span className="sidebar-text">Налаштування</span>
        </button>
      </div>

      <CreatePinModal
        isOpen={createPinModalOpen}
        onClose={() => setCreatePinModalOpen(false)}
        onSuccess={() => {
          navigate("/");
        }}
      />

      <CreateBoardModal
        isOpen={createBoardModalOpen}
        onClose={() => setCreateBoardModalOpen(false)}
        onSuccess={() => {
          console.log("Board created successfully");
        }}
      />

      <CreateCollageModal
        isOpen={createCollageModalOpen}
        onClose={() => setCreateCollageModalOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        onNotificationClick={() => {
          loadUnreadCount();
        }}
      />
    </aside>
  );
};

export default Sidebar;
