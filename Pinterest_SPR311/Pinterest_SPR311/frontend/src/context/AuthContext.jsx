import React, { createContext, useState, useEffect, useContext } from 'react'
import { authService } from '../api/auth'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      loadUser()
    } else {
      setLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (err) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (err) {
      console.error('Error updating user:', err)
    }
  }

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authService.login(email, password)
      localStorage.setItem('token', response.token)
      // Загружаем полные данные пользователя, включая avatarUrl
      await loadUser()
      return { success: true }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (email, password, username) => {
    try {
      setError(null)
      const response = await authService.register(email, password, username)
      if (!response || !response.token) {
        throw new Error('Invalid response from server')
      }
      localStorage.setItem('token', response.token)
      // Загружаем полные данные пользователя, включая avatarUrl
      await loadUser()
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      let errorMessage = 'Registration failed. Please try again.'
      
      if (err.response) {
        // Сервер ответил с ошибкой
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage
      } else if (err.request) {
        // Запрос был отправлен, но ответа не получено
        errorMessage = 'Cannot connect to server. Please check if the server is running.'
      } else {
        // Ошибка при настройке запроса
        errorMessage = err.message || errorMessage
      }
      
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setError(null)
  }

  const loginWithGoogle = () => {
    authService.googleLogin()
  }

  const handleGoogleCallback = async () => {
    try {
      setError(null)
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (token) {
        localStorage.setItem('token', token)
        await loadUser()
        return { success: true }
      }
      
      return { success: false, error: 'No token received' }
    } catch (err) {
      const errorMessage = 'Google login failed. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginWithGoogle,
    handleGoogleCallback,
    updateUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

