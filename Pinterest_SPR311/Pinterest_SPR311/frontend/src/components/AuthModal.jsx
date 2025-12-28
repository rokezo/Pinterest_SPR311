import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
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
  const { login, register, loginWithGoogle, error } = useAuth()

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
      result = await login(formData.email, formData.password)
    } else {
      result = await register(
        formData.email,
        formData.password,
        formData.username
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

        <button
          type="button"
          onClick={loginWithGoogle}
          className="google-login-button"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20454Z"
              fill="#4285F4"
            />
            <path
              d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65409 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65409 3.57955 9 3.57955Z"
              fill="#EA4335"
            />
          </svg>
          Продовжити з Google
        </button>

        <div className="auth-divider">
          <span>АБО</span>
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

