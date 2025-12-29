import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { boardsService } from "../api/boards";
import { pinsService } from "../api/pins";
import { usersService } from "../api/users";
import PinCard from "./PinCard";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "./BoardsPage.css";
import "./PinGrid.css";

const BoardsPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("boards");
  const [boards, setBoards] = useState([]);
  const [pins, setPins] = useState([]);
  const [collages, setCollages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadProfile();
    loadData();
  }, [isAuthenticated, navigate, activeTab]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await usersService.getUserProfile(user.id);
      setProfile(data);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "boards") {
        const data = await boardsService.getUserBoards();
        setBoards(data || []);
      } else if (activeTab === "pins") {
        const data = await pinsService.getMyPins(1, 50);
        setPins(data.pins || []);
      } else if (activeTab === "collages") {
        const data = await pinsService.getMyCollages(1, 50);
        setCollages(data.pins || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Не вдалося завантажити дані");
    } finally {
      setLoading(false);
    }
  };

  const handleBoardClick = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="home-layout">
          <Sidebar />
          <main className="home-main">
            <div className="boards-loading">
              <div className="loading-spinner"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="home-layout">
          <Sidebar />
          <main className="home-main">
            <div className="boards-error">{error}</div>
          </main>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === "boards") {
      if (boards.length === 0) {
        return (
          <div className="boards-empty">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: "16px", color: "#8e8e8e" }}
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <h2>Створіть свою першу дошку</h2>
            <p>Зберігайте піни в організованих колекціях</p>
          </div>
        );
      }

      return (
        <div className="boards-grid">
          {boards.map((board) => (
            <div
              key={board.id}
              className="board-card"
              onClick={() => handleBoardClick(board.id)}
            >
              <div className="board-cover">
                {board.coverImages && board.coverImages.length > 0 ? (
                  <div className="board-cover-grid">
                    {board.coverImages.slice(0, 4).map((imageUrl, index) => (
                      <div key={index} className="board-cover-item">
                        <img
                          src={
                            imageUrl?.startsWith("http") || imageUrl?.startsWith("//")
                              ? imageUrl
                              : `http://localhost:5001${imageUrl}`
                          }
                          alt=""
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="board-cover-empty">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7"></rect>
                      <rect x="14" y="3" width="7" height="7"></rect>
                      <rect x="14" y="14" width="7" height="7"></rect>
                      <rect x="3" y="14" width="7" height="7"></rect>
                    </svg>
                  </div>
                )}
              </div>
              <div className="board-info">
                <h3 className="board-name">{board.name}</h3>
                <p className="board-pins-count">
                  {board.pinsCount === 0
                    ? "Порожня дошка"
                    : `${board.pinsCount} ${board.pinsCount === 1 ? "пін" : "пінів"}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "pins") {
      if (pins.length === 0) {
        return (
          <div className="boards-empty">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: "16px", color: "#8e8e8e" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <h2>У вас поки немає пінів</h2>
            <p>Створіть свій перший пін</p>
          </div>
        );
      }

      return (
        <div className="pin-grid">
          {pins.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      );
    }

    if (activeTab === "collages") {
      if (collages.length === 0) {
        return (
          <div className="boards-empty">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: "16px", color: "#8e8e8e" }}
            >
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <h2>У вас поки немає колажів</h2>
            <p>Створіть свій перший колаж</p>
          </div>
        );
      }

      return (
        <div className="pin-grid">
          {collages.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      );
    }

    return null;
  };

  const getCount = () => {
    if (activeTab === "boards") return boards.length;
    if (activeTab === "pins") return pins.length;
    if (activeTab === "collages") return collages.length;
    return 0;
  };

  const getSubtitle = () => {
    const count = getCount();
    if (activeTab === "boards") {
      return count === 0
        ? "У вас поки немає дошок"
        : `${count} ${count === 1 ? "дошка" : "дошок"}`;
    }
    if (activeTab === "pins") {
      return count === 0
        ? "У вас поки немає пінів"
        : `${count} ${count === 1 ? "пін" : "пінів"}`;
    }
    if (activeTab === "collages") {
      return count === 0
        ? "У вас поки немає колажів"
        : `${count} ${count === 1 ? "колаж" : "колажів"}`;
    }
    return "";
  };

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-layout">
        <Sidebar />
        <main className="home-main">
          <div className="boards-page">
            {profile && (
              <div className="boards-profile-header">
                <div className="boards-profile-avatar">
                  {profile.avatarUrl ? (
                    <img
                      src={
                        profile.avatarUrl?.startsWith("http") ||
                        profile.avatarUrl?.startsWith("//")
                          ? profile.avatarUrl
                          : `http://localhost:5001${profile.avatarUrl}`
                      }
                      alt={profile.username}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="boards-profile-avatar-placeholder"
                    style={{ display: profile.avatarUrl ? "none" : "flex" }}
                  >
                    {profile.username?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </div>
                <div className="boards-profile-info">
                  <h1 className="boards-profile-username">{profile.username}</h1>
                  {profile.bio && (
                    <p className="boards-profile-bio">{profile.bio}</p>
                  )}
                  <div className="boards-profile-stats">
                    <div className="boards-profile-stat">
                      <span className="boards-profile-stat-value">
                        {profile.pinsCount || 0}
                      </span>
                      <span className="boards-profile-stat-label">пінів</span>
                    </div>
                    <div className="boards-profile-stat">
                      <span className="boards-profile-stat-value">
                        {profile.followersCount || 0}
                      </span>
                      <span className="boards-profile-stat-label">
                        підписників
                      </span>
                    </div>
                    <div className="boards-profile-stat">
                      <span className="boards-profile-stat-value">
                        {profile.followingCount || 0}
                      </span>
                      <span className="boards-profile-stat-label">
                        підписок
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="boards-tabs">
              <button
                className={`boards-tab ${activeTab === "pins" ? "active" : ""}`}
                onClick={() => setActiveTab("pins")}
              >
                Піни
              </button>
              <button
                className={`boards-tab ${activeTab === "boards" ? "active" : ""}`}
                onClick={() => setActiveTab("boards")}
              >
                Дошки
              </button>
              <button
                className={`boards-tab ${activeTab === "collages" ? "active" : ""}`}
                onClick={() => setActiveTab("collages")}
              >
                Колажі
              </button>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BoardsPage;
