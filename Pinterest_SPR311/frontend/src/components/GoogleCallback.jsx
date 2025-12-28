import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GoogleCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { handleGoogleCallback } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (token) {
      localStorage.setItem('token', token)
      handleGoogleCallback().then((result) => {
        if (result.success) {
          navigate('/', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      })
    } else {
      navigate('/', { replace: true })
    }
  }, [searchParams, navigate, handleGoogleCallback])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Completing sign in...</div>
    </div>
  )
}

export default GoogleCallback

