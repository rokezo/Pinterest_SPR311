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
  const [accounts, setAccounts] = useState([])
  const [currentAccountId, setCurrentAccountId] = useState(null)

  const getAccountsFromStorage = () => {
    try {
      const stored = localStorage.getItem('accounts')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveAccountsToStorage = (accountsList) => {
    localStorage.setItem('accounts', JSON.stringify(accountsList))
  }

  const getCurrentAccountIdFromStorage = () => {
    try {
      return localStorage.getItem('currentAccountId')
    } catch {
      return null
    }
  }

  const saveCurrentAccountIdToStorage = (id) => {
    if (id) {
      localStorage.setItem('currentAccountId', id)
    } else {
      localStorage.removeItem('currentAccountId')
    }
  }

  useEffect(() => {
    const storedAccounts = getAccountsFromStorage()
    const storedCurrentId = getCurrentAccountIdFromStorage()
    
    setAccounts(storedAccounts)
    
    if (storedCurrentId && storedAccounts.length > 0) {
      const currentAccount = storedAccounts.find(acc => acc.id === storedCurrentId)
      if (currentAccount) {
        setCurrentAccountId(storedCurrentId)
        localStorage.setItem('token', currentAccount.token)
        loadUser()
        return
      }
    }
    
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
      
      const storedCurrentId = getCurrentAccountIdFromStorage()
      if (storedCurrentId) {
        const storedAccounts = getAccountsFromStorage()
        const updatedAccounts = storedAccounts.map(acc => 
          acc.id === storedCurrentId 
            ? { ...acc, username: userData.username, avatarUrl: userData.avatarUrl }
            : acc
        )
        saveAccountsToStorage(updatedAccounts)
        setAccounts(updatedAccounts)
      }
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

  const addAccount = async (token, userData) => {
    const storedAccounts = getAccountsFromStorage()
    const accountId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newAccount = {
      id: accountId,
      token,
      username: userData.username,
      email: userData.email,
      avatarUrl: userData.avatarUrl || null,
    }
    
    const updatedAccounts = [...storedAccounts, newAccount]
    saveAccountsToStorage(updatedAccounts)
    setAccounts(updatedAccounts)
    
    return accountId
  }

  const switchAccount = async (accountId) => {
    const storedAccounts = getAccountsFromStorage()
    const account = storedAccounts.find(acc => acc.id === accountId)
    
    if (account) {
      localStorage.setItem('token', account.token)
      setCurrentAccountId(accountId)
      saveCurrentAccountIdToStorage(accountId)
      await loadUser()
    }
  }

  const removeAccount = (accountId) => {
    const storedAccounts = getAccountsFromStorage()
    const updatedAccounts = storedAccounts.filter(acc => acc.id !== accountId)
    saveAccountsToStorage(updatedAccounts)
    setAccounts(updatedAccounts)
    
    if (currentAccountId === accountId) {
      if (updatedAccounts.length > 0) {
        const firstAccount = updatedAccounts[0]
        switchAccount(firstAccount.id)
      } else {
        logout()
      }
    }
  }

  const login = async (email, password, addAsNewAccount = false) => {
    try {
      setError(null)
      const response = await authService.login(email, password)
      localStorage.setItem('token', response.token)
      
      const userData = await authService.getCurrentUser()
      
      if (addAsNewAccount) {
        const accountId = await addAccount(response.token, userData)
        setCurrentAccountId(accountId)
        saveCurrentAccountIdToStorage(accountId)
      } else {
        const storedAccounts = getAccountsFromStorage()
        const existingAccount = storedAccounts.find(acc => acc.email === userData.email)
        
        if (existingAccount) {
          const updatedAccounts = storedAccounts.map(acc => 
            acc.id === existingAccount.id 
              ? { ...acc, token: response.token, username: userData.username, avatarUrl: userData.avatarUrl }
              : acc
          )
          saveAccountsToStorage(updatedAccounts)
          setAccounts(updatedAccounts)
          setCurrentAccountId(existingAccount.id)
          saveCurrentAccountIdToStorage(existingAccount.id)
        } else {
          const accountId = await addAccount(response.token, userData)
          setCurrentAccountId(accountId)
          saveCurrentAccountIdToStorage(accountId)
        }
      }
      
      await loadUser()
      return { success: true }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (email, password, username, addAsNewAccount = false) => {
    try {
      setError(null)
      const response = await authService.register(email, password, username)
      if (!response || !response.token) {
        throw new Error('Invalid response from server')
      }
      localStorage.setItem('token', response.token)
      
      const userData = await authService.getCurrentUser()
      
      if (addAsNewAccount) {
        const accountId = await addAccount(response.token, userData)
        setCurrentAccountId(accountId)
        saveCurrentAccountIdToStorage(accountId)
      } else {
        const accountId = await addAccount(response.token, userData)
        setCurrentAccountId(accountId)
        saveCurrentAccountIdToStorage(accountId)
      }
      
      await loadUser()
      return { success: true }
    } catch (err) {
      console.error('Registration error:', err)
      let errorMessage = 'Registration failed. Please try again.'
      
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.statusText || errorMessage
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please check if the server is running.'
      } else {
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
    setCurrentAccountId(null)
    saveCurrentAccountIdToStorage(null)
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    accounts,
    currentAccountId,
    switchAccount,
    removeAccount,
    addAccount: async (token, userData) => {
      const accountId = await addAccount(token, userData)
      setCurrentAccountId(accountId)
      saveCurrentAccountIdToStorage(accountId)
      await loadUser()
      return accountId
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

