import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersService } from "../api/users";
import "./FollowersModal.css";

const FollowersModal = ({ isOpen, onClose, userId, type = "followers" }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [followingStates, setFollowingStates] = useState({});

  useEffect(() => {
    if (isOpen && userId) {
      loadUsers();
    }
  }, [isOpen, userId, type]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data =
        type === "followers"
          ? await usersService.getFollowers(userId, 1, 100)
          : await usersService.getFollowing(userId, 1, 100);

      setUsers(data.users || []);
      const states = {};
      data.users?.forEach((user) => {
        states[user.id] = user.isFollowing;
      });
      setFollowingStates(states);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Не вдалося завантажити список");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    try {
      const isFollowing = followingStates[targetUserId];
      if (isFollowing) {
        await usersService.unfollowUser(targetUserId);
        setFollowingStates((prev) => ({
          ...prev,
          [targetUserId]: false,
        }));
      } else {
        await usersService.followUser(targetUserId);
        setFollowingStates((prev) => ({
          ...prev,
          [targetUserId]: true,
        }));
      }
    } catch (err) {
      console.error("Error following/unfollowing:", err);
    }
  };

  const handleUserClick = (targetUserId) => {
    onClose();
    navigate(`/user/${targetUserId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="followers-modal-overlay" onClick={onClose}>
      <div className="followers-modal" onClick={(e) => e.stopPropagation()}>
        <div className="followers-modal-header">
          <h2>{type === "followers" ? "Підписники" : "Підписки"}</h2>
          <button className="followers-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="followers-modal-content">
          {loading ? (
            <div className="followers-modal-loading">Завантаження...</div>
          ) : error ? (
            <div className="followers-modal-error">{error}</div>
          ) : users.length === 0 ? (
            <div className="followers-modal-empty">
              {type === "followers"
                ? "Поки що немає підписників"
                : "Поки що немає підписок"}
            </div>
          ) : (
            <div className="followers-modal-list">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="followers-modal-item"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="followers-modal-avatar">
                    {user.avatarUrl ? (
                      <img
                        src={
                          user.avatarUrl?.startsWith("http") ||
                          user.avatarUrl?.startsWith("//")
                            ? user.avatarUrl
                            : `http://localhost:5001${user.avatarUrl}`
                        }
                        alt={user.username}
                      />
                    ) : (
                      <div className="followers-modal-avatar-placeholder">
                        {user.username?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div className="followers-modal-info">
                    <div className="followers-modal-username">{user.username}</div>
                    {user.bio && (
                      <div className="followers-modal-bio">{user.bio}</div>
                    )}
                  </div>
                  {!user.isOwnProfile && isAuthenticated && (
                    <button
                      className={`followers-modal-follow-btn ${
                        followingStates[user.id] ? "following" : ""
                      }`}
                      onClick={(e) => handleFollow(user.id, e)}
                    >
                      {followingStates[user.id] ? "Відписатися" : "Підписатися"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;

