import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [compassHovered, setCompassHovered] = useState(false)
  const [compassPosition, setCompassPosition] = useState({ top: 0, left: 0 })
  const compassTimeoutRef = useRef(null)

  const categories = [
    { name: 'Beauty', query: 'beauty' },
    { name: 'Food', query: 'food' },
    { name: 'Art', query: 'art' },
    { name: 'Travel', query: 'travel' },
    { name: 'Fashion', query: 'fashion' },
    { name: 'Design', query: 'design' },
    { name: 'Nature', query: 'nature' },
    { name: 'Architecture', query: 'architecture' },
    { name: 'Animals', query: 'animals' },
    { name: 'Sports', query: 'sport' }
  ]

  const handleCategoryClick = (query) => {
    console.log('Category clicked:', query)
    setCompassHovered(false)
    setSearchParams({ q: query })
    if (window.location.pathname !== '/') {
      navigate('/')
    }
  }

  const handleHomeClick = () => {
    setSearchParams({})
    navigate('/')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  const handleCompassMenuEnter = (e) => {
    // Отменяем таймер скрытия, если он был установлен
    if (compassTimeoutRef.current) {
      clearTimeout(compassTimeoutRef.current)
      compassTimeoutRef.current = null
    }
    
    // Обновляем позицию меню
    if (e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect()
      setCompassPosition({ top: rect.top, left: rect.right + 8 })
    }
    
    setCompassHovered(true)
  }

  const handleCompassMenuLeave = () => {
    // Устанавливаем задержку перед скрытием меню (300ms)
    compassTimeoutRef.current = setTimeout(() => {
      setCompassHovered(false)
    }, 300)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <button 
          className="sidebar-item sidebar-home"
          onClick={handleHomeClick}
        >
          <span className="sidebar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </span>
          <span className="sidebar-text">Home</span>
        </button>

        <div 
          className="sidebar-compass-wrapper"
          onMouseEnter={handleCompassMenuEnter}
          onMouseLeave={handleCompassMenuLeave}
        >
          <button className="sidebar-item sidebar-compass">
            <span className="sidebar-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2v6m0 8v6M2 12h6m8 0h6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24"></path>
              </svg>
            </span>
            <span className="sidebar-text">Explore</span>
          </button>
        </div>
        
        {compassHovered && (
          <div 
            className="compass-dropdown"
            style={{ 
              position: 'fixed',
              top: `${compassPosition.top}px`,
              left: `${compassPosition.left}px`,
              zIndex: 10000
            }}
            onMouseEnter={handleCompassMenuEnter}
            onMouseLeave={handleCompassMenuLeave}
          >
            {categories.map((category) => (
              <button
                key={category.query}
                className="compass-dropdown-item"
                onClick={() => {
                  handleCategoryClick(category.query)
                  setCompassHovered(false)
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        <button 
          className="sidebar-item sidebar-settings"
          onClick={handleSettingsClick}
        >
          <span className="sidebar-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
            </svg>
          </span>
          <span className="sidebar-text">Settings</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

