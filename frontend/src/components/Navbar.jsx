import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import AuthModal from './AuthModal'
import './Navbar.css'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')

  const handleLogout = () => {
    logout()
  }

  const openAuthModal = (mode) => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
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
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search"
              className="search-input"
            />
          </div>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <button className="nav-button" onClick={() => navigate('/create')}>
                Create
              </button>
              <div className="user-menu">
                <div className="user-avatar">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="user-dropdown">
                  <div className="user-info">
                    <strong>{user?.username}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
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

