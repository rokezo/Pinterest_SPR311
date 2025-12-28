import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import PinDetail from './components/PinDetail'
import GoogleCallback from './components/GoogleCallback'
import Settings from './components/Settings'
import BoardsPage from './components/BoardsPage'
import BoardDetail from './components/BoardDetail'
import UserProfile from './components/UserProfile'
import './App.css'

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pin/:id" element={<PinDetail />} />
          <Route path="/auth/google-callback" element={<GoogleCallback />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          <Route path="/user/:id" element={<UserProfile />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

