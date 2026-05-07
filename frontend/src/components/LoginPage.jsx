import React, { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      const res = await api.login(email.trim())
      login(res.user, res.token)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (e) => {
    setEmail(e)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoText}>Ajaia</span>
          <span style={styles.logoDocs}>Docs</span>
        </div>
        <p style={styles.tagline}>A lightweight collaborative document editor</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <hr className="divider" />

        <p style={styles.hint}>Demo accounts — click to autofill:</p>
        <div style={styles.seeds}>
          {['alice@ajaia.dev', 'bob@ajaia.dev'].map(e => (
            <button key={e} className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => quickLogin(e)}>
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--parchment)',
    padding: 24,
  },
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius)',
    padding: '40px 36px',
    width: '100%',
    maxWidth: 400,
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
  },
  logo: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  logoText: {
    fontFamily: 'var(--font-serif)',
    fontSize: 30,
    color: 'var(--ink)',
  },
  logoDocs: {
    fontFamily: 'var(--font-serif)',
    fontSize: 30,
    color: 'var(--accent)',
  },
  tagline: {
    color: 'var(--ink-muted)',
    fontSize: 14,
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink)',
    letterSpacing: '0.02em',
  },
  hint: {
    fontSize: 12.5,
    color: 'var(--ink-muted)',
    marginBottom: 10,
  },
  seeds: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
}
