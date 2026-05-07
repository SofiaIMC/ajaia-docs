import React, { useState, useEffect } from 'react'
import { api } from '../api'
import { useToast } from '../Toast'
import { X, UserPlus, Trash2, User } from 'lucide-react'

export default function ShareModal({ docId, onClose }) {
  const toast = useToast()
  const [shares, setShares] = useState([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const loadShares = async () => {
    try {
      const s = await api.shares.list(docId)
      setShares(s)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadShares() }, [docId])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setAdding(true)
    try {
      await api.shares.add(docId, email.trim())
      toast(`Shared with ${email.trim()}`)
      setEmail('')
      loadShares()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId, name) => {
    try {
      await api.shares.remove(docId, userId)
      toast(`Removed ${name}`)
      loadShares()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Share document</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '4px 6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Add share form */}
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
          <button className="btn btn-primary" type="submit" disabled={adding} style={{ flexShrink: 0 }}>
            {adding
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <UserPlus size={14} />
            }
            Add
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12 }}>
          Demo users: <code>alice@ajaia.dev</code> · <code>bob@ajaia.dev</code>
        </p>

        {/* Current shares */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>
            Currently shared with
          </p>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <span className="spinner" />
            </div>
          ) : shares.length === 0 ? (
            <p style={{ color: 'var(--ink-muted)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
              Not shared with anyone yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shares.map(s => (
                <div key={s.id} style={styles.shareRow}>
                  <div style={styles.avatar}>{s.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{s.email}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Can edit</span>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleRemove(s.id, s.name)}
                    style={{ padding: '4px 6px', color: 'var(--accent)' }}
                    title="Remove access"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  shareRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    background: 'var(--parchment)',
    borderRadius: 'var(--radius-sm)',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--shared-badge)',
    color: 'var(--white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
}
