import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import PinDetail from './components/PinDetail'
import './App.css'

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pin/:id" element={<PinDetail />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App

