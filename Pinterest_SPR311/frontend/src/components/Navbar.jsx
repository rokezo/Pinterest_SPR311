import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthModal from './AuthModal'
import './Navbar.css'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuTimeoutRef = useRef(null)

  const handleLogout = () => {
    logout()
  }

  const openAuthModal = (mode) => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() })
    } else {
      setSearchParams({})
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleUserMenuEnter = () => {
    // Отменяем таймер скрытия, если он был установлен
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
      menuTimeoutRef.current = null
    }
    setShowUserMenu(true)
  }

  const handleUserMenuLeave = () => {
    // Устанавливаем задержку перед скрытием меню (300ms)
    menuTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false)
    }, 300)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="logo" onClick={() => navigate('/')}>
            <span className="logo-icon">P</span>
            <span className="logo-text">Pinterest</span>
          </div>
        </div>

        <div className="navbar-center">
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search"
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </form>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <button className="nav-button" onClick={() => navigate('/create')}>
                Create
              </button>
              <div 
                className="user-menu"
                onMouseEnter={handleUserMenuEnter}
                onMouseLeave={handleUserMenuLeave}
              >
                <div className="user-avatar">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl.startsWith('http') 
                        ? user.avatarUrl 
                        : `http://localhost:5000${user.avatarUrl}`} 
                      alt={user?.username || 'User'} 
                      className="avatar-image"
                    />
                  ) : (
                    <span className="avatar-initial">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                {showUserMenu && (
                  <div 
                    className="user-dropdown"
                    onMouseEnter={handleUserMenuEnter}
                    onMouseLeave={handleUserMenuLeave}
                  >
                    <div className="user-info">
                      <strong>{user?.username}</strong>
                      <span>{user?.email}</span>
                    </div>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                className="nav-button login-btn"
                onClick={() => openAuthModal('login')}
              >
                Log in
              </button>
              <button
                className="nav-button signup-btn"
                onClick={() => openAuthModal('register')}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </nav>
  )
}

export default Navbar

