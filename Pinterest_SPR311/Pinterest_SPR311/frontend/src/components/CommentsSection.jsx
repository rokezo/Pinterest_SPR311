import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { commentsService } from "../api/comments";
import "./CommentsSection.css";

const CommentsSection = ({ pinId, initialComments = [] }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setComments(initialComments);
    } else {
      loadComments();
    }
  }, [pinId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await commentsService.getComments(pinId);
      setComments(data || []);
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Не вдалося завантажити коментарі");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("Будь ласка, увійдіть в систему");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const comment = await commentsService.createComment(pinId, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Не вдалося додати коментар. Спробуйте ще раз."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей коментар?")) {
      return;
    }

    try {
      await commentsService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(
        err.response?.data?.message || "Не вдалося видалити коментар. Спробуйте ще раз."
      );
    }
  };

  const handleUsernameClick = (userId, e) => {
    e.stopPropagation();
    navigate(`/user/${userId}`);
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
    return date.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>Коментарі ({comments.length})</h3>
      </div>

      {error && <div className="comments-error">{error}</div>}

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="comments-form">
          <div className="comments-input-wrapper">
            {user?.avatarUrl ? (
              <img
                src={
                  user.avatarUrl?.startsWith("http") || user.avatarUrl?.startsWith("//")
                    ? user.avatarUrl
                    : `http://localhost:5001${user.avatarUrl}`
                }
                alt={user.username}
                className="comments-avatar"
              />
            ) : (
              <div className="comments-avatar-placeholder">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <input
              type="text"
              className="comments-input"
              placeholder="Додайте коментар..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
              disabled={submitting}
            />
            <button
              type="submit"
              className="comments-submit-btn"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? "..." : "Опублікувати"}
            </button>
          </div>
        </form>
      )}

      {!isAuthenticated && (
        <div className="comments-login-prompt">
          <p>Увійдіть, щоб залишити коментар</p>
        </div>
      )}

      {loading ? (
        <div className="comments-loading">Завантаження коментарів...</div>
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          <p>Поки що немає коментарів. Будьте першим!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-avatar-wrapper">
                {comment.userAvatarUrl ? (
                  <img
                    src={
                      comment.userAvatarUrl?.startsWith("http") ||
                      comment.userAvatarUrl?.startsWith("//")
                        ? comment.userAvatarUrl
                        : `http://localhost:5001${comment.userAvatarUrl}`
                    }
                    alt={comment.username}
                    className="comment-avatar"
                  />
                ) : (
                  <div className="comment-avatar-placeholder">
                    {comment.username?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="comment-content">
                <div className="comment-header">
                  <span
                    className="comment-username"
                    onClick={(e) => handleUsernameClick(comment.userId, e)}
                  >
                    {comment.username}
                  </span>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
                {comment.isOwner && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Видалити
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
