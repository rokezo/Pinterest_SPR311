import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthModal from "./AuthModal";
import "./Navbar.css";

const Navbar = () => {
  const {
    isAuthenticated,
    user,
    logout,
    accounts,
    currentAccountId,
    switchAccount,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [addAsNewAccount, setAddAsNewAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuTimeoutRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  const openAuthModal = (mode, asNewAccount = false) => {
    setAuthModalMode(mode);
    setAddAsNewAccount(asNewAccount);
    setAuthModalOpen(true);
    setShowSettingsMenu(false);
  };

  const handleAddAccount = () => {
    openAuthModal("login", true);
  };

  const handleSwitchAccount = async (accountId) => {
    await switchAccount(accountId);
    setShowSettingsMenu(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSettingsMenuEnter = () => {
    if (settingsMenuTimeoutRef.current) {
      clearTimeout(settingsMenuTimeoutRef.current);
      settingsMenuTimeoutRef.current = null;
    }
    setShowSettingsMenu(true);
  };

  const handleSettingsMenuLeave = () => {
    settingsMenuTimeoutRef.current = setTimeout(() => {
      setShowSettingsMenu(false);
    }, 300);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-icon">P</span>
            <span className="logo-text">Pinterest</span>
          </div>
        </div>

        <div className="navbar-center">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Пошук"
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <div
                className="user-avatar"
                onClick={() => navigate("/boards")}
                style={{ cursor: "pointer" }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={
                      user.avatarUrl.startsWith("http")
                        ? user.avatarUrl
                        : `http://localhost:5001${user.avatarUrl}`
                    }
                    alt={user?.username || "User"}
                    className="avatar-image"
                  />
                ) : (
                  <span className="avatar-initial">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div
                className="settings-menu"
                onMouseEnter={handleSettingsMenuEnter}
                onMouseLeave={handleSettingsMenuLeave}
              >
                <button className="settings-button" title="Налаштування">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                </button>
                {showSettingsMenu && (
                  <div
                    className="settings-dropdown"
                    onMouseEnter={handleSettingsMenuEnter}
                    onMouseLeave={handleSettingsMenuLeave}
                  >
                    <div className="user-info">
                      <strong>{user?.username}</strong>
                      <span>{user?.email}</span>
                    </div>

                    {accounts && accounts.length > 0 && (
                      <div className="accounts-list">
                        <div className="accounts-divider"></div>
                        {accounts.map((account) => (
                          <button
                            key={account.id}
                            className={`account-item ${
                              currentAccountId === account.id ? "active" : ""
                            }`}
                            onClick={() => handleSwitchAccount(account.id)}
                          >
                            <div className="account-avatar-small">
                              {account.avatarUrl ? (
                                <img
                                  src={
                                    account.avatarUrl.startsWith("http")
                                      ? account.avatarUrl
                                      : `http://localhost:5001${account.avatarUrl}`
                                  }
                                  alt={account.username}
                                />
                              ) : (
                                <span>
                                  {account.username?.[0]?.toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div className="account-info-small">
                              <strong>{account.username}</strong>
                              <span>{account.email}</span>
                            </div>
                            {currentAccountId === account.id && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="check-icon"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </button>
                        ))}
                        <div className="accounts-divider"></div>
                      </div>
                    )}

                    <button
                      className="dropdown-item add-account-btn"
                      onClick={handleAddAccount}
                    >
                      <svg
                        width="16"
                        height="16"
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
                      Додати акаунт
                    </button>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Вийти
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="nav-button login-btn"
                onClick={() => openAuthModal("login")}
              >
                Увійти
              </button>
              <button
                className="nav-button signup-btn"
                onClick={() => openAuthModal("register")}
              >
                Зареєструватися
              </button>
            </>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAddAsNewAccount(false);
        }}
        initialMode={authModalMode}
        addAsNewAccount={addAsNewAccount}
      />
    </nav>
  );
};

export default Navbar;
