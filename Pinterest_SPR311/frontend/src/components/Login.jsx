import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import './Auth.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [validationErrors, setValidationErrors] = useState({})
  const { login, error } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errors = {}

    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    const result = await login(formData.email, formData.password)
    if (result.success) {
      navigate(from, { replace: true })
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="auth-card">
        <div className="auth-header">
          <h1>Pinterest Clone</h1>
          <h2>Welcome back</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-button">
            Log in
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <a href="/register" onClick={(e) => {
              e.preventDefault()
              navigate('/register')
            }}>
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

export default Login

