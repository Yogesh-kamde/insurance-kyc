import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import CustomerPortal from './pages/CustomerPortal'
import RegulatorDashboard from './pages/RegulatorDashboard'
import InsurerDashboard from './pages/InsurerDashboard'
import AssessorDashboard from './pages/AssessorDashboard'
import PayoutDashboard from './pages/PayoutDashboard'

const API = 'http://localhost:3000'
const socket = io('http://localhost:3000')
axios.defaults.withCredentials = true
function App() {
  const [token, setToken] = useState(null)
  const [role, setRole] = useState(null)
  const [username, setUsername] = useState('')
  const [customerID, setCustomerID] = useState(null)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [notification, setNotification] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [signUpForm, setSignUpForm] = useState({ username: '', password: '', fullName: '', contact: '', address: '', income: '', identityProof: '' })
  const [signUpMessage, setSignUpMessage] = useState('')
  const [loading, setLoading] = useState(false)

 useEffect(() => {
    const savedRole = localStorage.getItem('role')
    const savedUsername = localStorage.getItem('username')
    const savedCustomerID = localStorage.getItem('customerID')
    if (savedRole) {
        setToken(true)
        setRole(savedRole)
        setUsername(savedUsername)
        setCustomerID(savedCustomerID)
    }
}, [])

  const handleLogin = async () => {
    setLoading(true)
    try {
        const res = await axios.post(`${API}/auth/login`, form)
        // Token is in HttpOnly cookie — not in response
        setRole(res.data.role)
        setUsername(res.data.username)
        setCustomerID(res.data.customerID)
        // Save non-sensitive data to localStorage
        localStorage.setItem('role', res.data.role)
        localStorage.setItem('username', res.data.username)
        localStorage.setItem('customerID', res.data.customerID || '')
        setToken(true)  // just a flag — actual token is in cookie
        setError('')
    } catch (err) {
        setError(err.response?.data?.error || 'Login failed')
    } finally {
        setLoading(false)
    }
}

  const handleSignUp = async () => {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/auth/register`, signUpForm)
      setSignUpMessage(`✅ Registered! Your Customer ID: ${res.data.customerID}. Please login.`)
      setIsSignUp(false)
    } catch (err) {
      setSignUpMessage(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await axios.post(`${API}/auth/logout`)
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('customerID')
    setToken(null)
    setRole(null)
    setUsername('')
    setCustomerID(null)
    setForm({ username: '', password: '' })
}

  const roleColors = {
    customer: '#2196F3',
    regulator: '#4CAF50',
    insurer: '#FF9800',
    assessor: '#9C27B0',
    payout: '#F44336'
  }

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565C0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '40px',
          width: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '40px' }}>🏥</div>
            <h1 style={{ margin: '8px 0 4px', color: '#1a237e', fontSize: '24px' }}>InsureChain</h1>
            <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Blockchain Insurance Platform</p>
          </div>

          {!isSignUp ? (
            <>
              <h3 style={{ margin: '0 0 20px', color: '#333' }}>Welcome Back</h3>
              {signUpMessage && (
                <div style={{ background: '#e8f5e9', border: '1px solid #4CAF50', borderRadius: '8px', padding: '10px', marginBottom: '15px', color: '#2e7d32', fontSize: '13px' }}>
                  {signUpMessage}
                </div>
              )}
              <input
                placeholder="👤  Username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="🔒  Password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={inputStyle}
              />
              {error && <p style={{ color: '#f44336', fontSize: '13px', margin: '5px 0' }}>{error}</p>}
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{ ...btnStyle('#1976D2'), width: '100%', padding: '12px', fontSize: '16px', marginTop: '10px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                New customer?{' '}
                <span onClick={() => setIsSignUp(true)} style={{ color: '#1976D2', cursor: 'pointer', fontWeight: 'bold' }}>
                  Sign Up
                </span>
              </p>

              {/* Role badges */}
              <div style={{ marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <p style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginBottom: '10px' }}>AVAILABLE ROLES</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {[
                    { role: 'Customer', icon: '👤', color: '#2196F3' },
                    { role: 'Regulator', icon: '🏛', color: '#4CAF50' },
                    { role: 'Insurer', icon: '🏢', color: '#FF9800' },
                    { role: 'Assessor', icon: '🔍', color: '#9C27B0' },
                    { role: 'Payout', icon: '💰', color: '#F44336' },
                  ].map(r => (
                    <span key={r.role} style={{
                      background: r.color + '15',
                      color: r.color,
                      border: `1px solid ${r.color}30`,
                      borderRadius: '20px',
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {r.icon} {r.role}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 20px', color: '#333' }}>Customer Registration</h3>
              {[
                { key: 'username', placeholder: '👤  Username' },
                { key: 'password', placeholder: '🔒  Password', type: 'password' },
                { key: 'fullName', placeholder: '📝  Full Name' },
                { key: 'contact', placeholder: '📱  Contact Number' },
                { key: 'address', placeholder: '🏠  Address' },
                { key: 'income', placeholder: '💰  Annual Income' },
                { key: 'identityProof', placeholder: '🪪  Identity Proof (Aadhar/PAN)' },
              ].map(field => (
                <input
                  key={field.key}
                  placeholder={field.placeholder}
                  type={field.type || 'text'}
                  value={signUpForm[field.key]}
                  onChange={e => setSignUpForm({ ...signUpForm, [field.key]: e.target.value })}
                  style={inputStyle}
                />
              ))}
              {signUpMessage && <p style={{ color: '#f44336', fontSize: '13px' }}>{signUpMessage}</p>}
              <button
                onClick={handleSignUp}
                disabled={loading}
                style={{ ...btnStyle('#4CAF50'), width: '100%', padding: '12px', fontSize: '16px', marginTop: '10px' }}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px', color: '#666' }}>
                Already have an account?{' '}
                <span onClick={() => setIsSignUp(false)} style={{ color: '#1976D2', cursor: 'pointer', fontWeight: 'bold' }}>
                  Login
                </span>
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Notification banner */}
      {notification && (
        <div style={{
          background: notification.status === 'APPROVED' || notification.status === 'ASSESSED' ? '#4CAF50' : '#f44336',
          color: '#fff',
          padding: '12px 20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '15px'
        }}>
          🔔 {notification.message}
        </div>
      )}

      {/* Navbar */}
      <div style={{
        background: '#1a237e',
        color: '#fff',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏥</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>InsureChain</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>Blockchain Insurance Platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{
            background: roleColors[role] + '30',
            color: '#fff',
            border: `1px solid ${roleColors[role]}`,
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '13px',
            fontWeight: 'bold'
          }}>
            {role?.toUpperCase()}
          </span>
          <span style={{ fontSize: '14px' }}>👤 {username}</span>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Portal */}
      {role === 'customer' && <CustomerPortal token={token} customerID={customerID} />}
      {role === 'regulator' && <RegulatorDashboard token={token} />}
      {role === 'insurer' && <InsurerDashboard token={token} />}
      {role === 'assessor' && <AssessorDashboard token={token} />}
      {role === 'payout' && <PayoutDashboard token={token} />}
    </div>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '11px 14px',
  margin: '8px 0',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border 0.2s'
}

const btnStyle = (color) => ({
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold'
})

export default App