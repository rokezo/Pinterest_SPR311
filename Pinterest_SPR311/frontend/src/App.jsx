import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import PinDetail from './components/PinDetail'
import GoogleCallback from './components/GoogleCallback'
import Settings from './components/Settings'
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
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

