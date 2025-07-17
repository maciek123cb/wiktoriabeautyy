import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { getApiUrl, testApiConnection } from '../config/api'

const LoginForm = ({ onLogin, onBack, onRegisterClick }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [apiStatus, setApiStatus] = useState(null)

  // Test połączenia z API przy ładowaniu komponentu
  useEffect(() => {
    const testApi = async () => {
      try {
        const result = await testApiConnection();
        setApiStatus(result);
      } catch (error) {
        console.error('Błąd testowania API:', error);
        setApiStatus({ success: false, error: error.message });
      }
    };
    
    testApi();
  }, []);
  
  // Walidacja email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Walidacja formularza
  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email jest wymagany'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Nieprawidłowy format email'
    }

    if (!formData.password) {
      newErrors.password = 'Hasło jest wymagane'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Hasło musi mieć minimum 6 znaków'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Obsługa wysyłania formularza
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Spróbuj użyć endpointu testowego, jeśli normalny endpoint nie działa
      // Używamy bezpośredniego endpointu logowania
      const url = '/api/login';
      console.log('Wysyłam żądanie do:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      console.log('Status odpowiedzi:', response.status);
      console.log('Nagłówki odpowiedzi:', response.headers);
      
      const responseText = await response.text();
      console.log('Odpowiedź serwera (text):', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Odpowiedź serwera (JSON):', data);
      } catch (jsonError) {
        console.error('Błąd parsowania JSON:', jsonError);
        setLoginError('Błąd parsowania odpowiedzi serwera');
        return;
      }

      if (data.success) {
        // Zapisz token w localStorage
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        console.log('Zalogowano pomyślnie, dane użytkownika:', data.user);
        onLogin(data.user)
        
        // Przekieruj do panelu administratora, jeśli to admin
        if (data.user.role === 'admin') {
          console.log('Przekierowuję do panelu administratora');
          window.location.href = '/admin';
        }
      } else {
        console.error('Błąd logowania:', data.message);
        setLoginError(data.message)
      }
    } catch (error) {
      console.error('Błąd połączenia z serwerem:', error);
      setLoginError('Błąd połączenia z serwerem: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Usuń błąd dla tego pola
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl font-bold text-gray-800 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Panel Administratora
          </motion.h1>
          <p className="text-gray-600">Zaloguj się do systemu</p>
        </div>

        {loginError && (
          <motion.div
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {loginError}
          </motion.div>
        )}
        
        {apiStatus && (
          <motion.div
            className={`border px-4 py-3 rounded-lg mb-6 ${
              apiStatus.success ? 'bg-green-50 border-green-200 text-green-600' : 'bg-yellow-50 border-yellow-200 text-yellow-600'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="font-medium">Status API: {apiStatus.success ? 'Działa' : 'Problem z połączeniem'}</p>
            <p className="text-sm">{apiStatus.message || apiStatus.error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="admin@example.com"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Hasło */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Admin123!"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Przyciski */}
          <div className="space-y-4">
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </motion.button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="flex-1 text-gray-600 hover:text-primary transition-colors"
              >
                Powrót do strony głównej
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/register'}
                className="flex-1 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Nie masz konta? Zarejestruj się
              </button>
            </div>
            
            <button
              type="button"
              onClick={async () => {
                const result = await testApiConnection();
                setApiStatus(result);
              }}
              className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Testuj połączenie z API
            </button>
          </div>
        </form>

        {/* Dane testowe */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">Dane testowe:</p>
          <p className="text-xs text-gray-500">Email: admin@example.com</p>
          <p className="text-xs text-gray-500">Hasło: Admin123!</p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginForm