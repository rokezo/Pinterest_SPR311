import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

const AuthModal = ({ isOpen, onClose, initialMode = 'login', addAsNewAccount = false }) => {
  const [mode, setMode] = useState(initialMode)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })
  const [validationErrors, setValidationErrors] = useState({})
  const { login, register, error } = useAuth()

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
      errors.email = 'Електронна пошта обов\'язкова'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Невірна електронна пошта'
    }

    if (mode === 'register') {
      if (!formData.username) {
        errors.username = 'Ім\'я користувача обов\'язкове'
      } else if (formData.username.length < 3) {
        errors.username = 'Ім\'я користувача має містити мінімум 3 символи'
      } else if (formData.username.length > 50) {
        errors.username = 'Ім\'я користувача має бути менше 50 символів'
      }
    }

    if (!formData.password) {
      errors.password = 'Пароль обов\'язковий'
    } else if (mode === 'register' && formData.password.length < 6) {
      errors.password = 'Пароль має містити мінімум 6 символів'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    let result
    if (mode === 'login') {
      result = await login(formData.email, formData.password, addAsNewAccount)
    } else {
      result = await register(
        formData.email,
        formData.password,
        formData.username,
        addAsNewAccount
      )
    }

    if (result.success) {
      onClose()
      setFormData({ email: '', password: '', username: '' })
      setValidationErrors({})
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setFormData({ email: '', password: '', username: '' })
    setValidationErrors({})
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ×
        </button>

        <div className="auth-modal-header">
          <h1>Pinterest Clone</h1>
          <h2>{mode === 'login' ? 'Ласкаво просимо назад' : 'Створіть обліковий запис'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {error && <div className="error-message">{error}</div>}

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="username">Ім'я користувача</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={validationErrors.username ? 'error' : ''}
                placeholder="Оберіть ім'я користувача"
              />
              {validationErrors.username && (
                <span className="field-error">{validationErrors.username}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Електронна пошта</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={validationErrors.email ? 'error' : ''}
              placeholder="Введіть вашу електронну пошту"
            />
            {validationErrors.email && (
              <span className="field-error">{validationErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={validationErrors.password ? 'error' : ''}
              placeholder={
                mode === 'login'
                  ? 'Введіть ваш пароль'
                  : 'Створіть пароль'
              }
            />
            {validationErrors.password && (
              <span className="field-error">{validationErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-modal-button">
            {mode === 'login' ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p>
              Немає облікового запису?{' '}
              <button
                className="link-button"
                onClick={() => switchMode('register')}
              >
                Зареєструватися
              </button>
            </p>
          ) : (
            <p>
              Вже є обліковий запис?{' '}
              <button
                className="link-button"
                onClick={() => switchMode('login')}
              >
                Увійти
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal

