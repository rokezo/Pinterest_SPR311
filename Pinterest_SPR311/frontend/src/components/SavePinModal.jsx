import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { boardsService } from "../api/boards";
import CreateBoardModal from "./CreateBoardModal";
import "./SavePinModal.css";

const SavePinModal = ({ isOpen, onClose, pinId, onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createBoardModalOpen, setCreateBoardModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        loadBoards();
      } else {
        setError("Будь ласка, увійдіть в систему, щоб зберегти пін");
        setLoading(false);
      }
    }
  }, [isOpen, isAuthenticated]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await boardsService.getUserBoards();
      setBoards(data || []);
    } catch (err) {
      console.error("Error loading boards:", err);
      setError("Не вдалося завантажити дошки");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToBoard = async (boardId) => {
    if (!pinId) return;

    try {
      setSaving(true);
      setError("");
      await boardsService.addPinToBoard(boardId, pinId);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes("already")) {
        setError("Цей пін вже збережено в цю дошку");
      } else {
        setError(
          err.response?.data?.message || "Не вдалося зберегти пін. Спробуйте ще раз."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBoard = () => {
    setCreateBoardModalOpen(true);
  };

  const handleBoardCreated = () => {
    setCreateBoardModalOpen(false);
    loadBoards();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="save-pin-modal-overlay" onClick={onClose}>
        <div
          className="save-pin-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="save-pin-modal-close" onClick={onClose}>
            ×
          </button>

          <div className="save-pin-modal-header">
            <h2>Зберегти пін</h2>
          </div>

          <div className="save-pin-modal-content">
            {error && <div className="save-pin-error">{error}</div>}

            {!isAuthenticated ? (
              <div className="save-pin-empty">
                <p>Будь ласка, увійдіть в систему, щоб зберегти пін</p>
              </div>
            ) : loading ? (
              <div className="save-pin-loading">
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <>
                <button
                  className="save-pin-create-board-btn"
                  onClick={handleCreateBoard}
                >
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
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Створити дошку</span>
                </button>

                {boards.length > 0 ? (
                  <div className="save-pin-boards-list">
                    <div className="save-pin-boards-label">Виберіть дошку</div>
                    {boards.map((board) => (
                      <button
                        key={board.id}
                        className="save-pin-board-item"
                        onClick={() => handleSaveToBoard(board.id)}
                        disabled={saving}
                      >
                        <div className="save-pin-board-cover">
                          {board.coverImages && board.coverImages.length > 0 ? (
                            <div className="save-pin-board-cover-grid">
                              {board.coverImages.slice(0, 4).map((imageUrl, index) => (
                                <div key={index} className="save-pin-board-cover-item">
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
                            <div className="save-pin-board-cover-empty">
                              <svg
                                width="24"
                                height="24"
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
                        <div className="save-pin-board-info">
                          <div className="save-pin-board-name">{board.name}</div>
                          <div className="save-pin-board-count">
                            {board.pinsCount} {board.pinsCount === 1 ? "пін" : "пінів"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="save-pin-empty">
                    <p>У вас поки немає дошок</p>
                    <p className="save-pin-empty-hint">
                      Створіть дошку, щоб зберегти пін
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <CreateBoardModal
        isOpen={createBoardModalOpen}
        onClose={() => setCreateBoardModalOpen(false)}
        onSuccess={handleBoardCreated}
      />
    </>
  );
};

export default SavePinModal;

