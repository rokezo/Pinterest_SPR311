import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { boardsService } from "../api/boards";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import PinCard from "./PinCard";
import "./BoardDetail.css";

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    loadBoard();
  }, [id, isAuthenticated, navigate]);

  const loadBoard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await boardsService.getBoard(id);
      setBoard(data);
    } catch (err) {
      console.error("Error loading board:", err);
      setError("Не вдалося завантажити дошку");
    } finally {
      setLoading(false);
    }
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
            <div className="board-detail-loading">
              <div className="loading-spinner"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="home-container">
        <Navbar />
        <div className="home-layout">
          <Sidebar />
          <main className="home-main">
            <div className="board-detail-error">
              {error || "Дошку не знайдено"}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Navbar />
      <div className="home-layout">
        <Sidebar />
        <main className="home-main">
          <div className="board-detail">
            <div className="board-detail-header">
              <h1 className="board-detail-title">{board.name}</h1>
              {board.description && (
                <p className="board-detail-description">{board.description}</p>
              )}
              <div className="board-detail-meta">
                <span className="board-detail-pins-count">
                  {board.pinsCount === 0
                    ? "Порожня дошка"
                    : `${board.pinsCount} ${board.pinsCount === 1 ? "пін" : "пінів"}`}
                </span>
                {board.group && (
                  <span className="board-detail-group">{board.group}</span>
                )}
              </div>
            </div>

            {board.pins && board.pins.length > 0 ? (
              <div className="board-detail-pins">
                <div className="pin-grid">
                  {board.pins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="board-detail-empty">
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
                <h2>Ця дошка порожня</h2>
                <p>Додайте піни до цієї дошки</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default BoardDetail;

