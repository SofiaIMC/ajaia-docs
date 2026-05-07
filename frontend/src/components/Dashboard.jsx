import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../Toast'
import {
  FilePlus, Upload, LogOut, FileText, Users, Trash2, ChevronRight
} from 'lucide-react'

export default function Dashboard({ onOpenDoc }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [owned, setOwned] = useState([])
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    try {
      const res = await api.docs.list()
      setOwned(res.owned)
      setShared(res.shared)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleNew = async () => {
    try {
      const doc = await api.docs.create({ title: 'Untitled Document' })
      onOpenDoc(doc.id)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    try {
      await api.docs.delete(id)
      toast('Document deleted')
      load()
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const doc = await api.upload(file)
      toast(`"${doc.title}" imported`)
      onOpenDoc(doc.id)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.brandWrap}>
          <span style={styles.brand}>Ajaia</span>
          <span style={styles.brandAccent}>Docs</span>
        </div>

        <div style={styles.sideActions}>
          <button className="btn btn-primary" onClick={handleNew} style={{ width: '100%', justifyContent: 'center' }}>
            <FilePlus size={15} />
            New Document
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {uploading
              ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              : <Upload size={15} />
            }
            {uploading ? 'Importing…' : 'Upload .txt / .md'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div style={styles.sideNav}>
          <div style={styles.navItem} data-active="true">
            <FileText size={15} />
            All documents
          </div>
        </div>

        <div style={styles.sideFooter}>
          <div style={styles.userChip}>
            <div style={styles.avatar}>{user.name[0]}</div>
            <div>
              <div style={styles.userName}>{user.name}</div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={logout} style={{ padding: '6px 8px' }} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.mainInner}>
          <h1 style={styles.heading}>My Documents</h1>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
              <span className="spinner" />
            </div>
          ) : (
            <>
              {/* Owned */}
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  <FileText size={14} style={{ opacity: 0.5 }} /> Owned by me
                </h2>
                {owned.length === 0 ? (
                  <div className="empty-state">
                    <FileText size={36} />
                    <p>No documents yet. Create one to get started.</p>
                  </div>
                ) : (
                  <div style={styles.grid}>
                    {owned.map(doc => (
                      <DocCard
                        key={doc.id}
                        doc={doc}
                        onOpen={() => onOpenDoc(doc.id)}
                        onDelete={(e) => handleDelete(e, doc.id)}
                        fmt={fmt}
                        showDelete
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Shared */}
              {shared.length > 0 && (
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>
                    <Users size={14} style={{ opacity: 0.5 }} /> Shared with me
                  </h2>
                  <div style={styles.grid}>
                    {shared.map(doc => (
                      <DocCard
                        key={doc.id}
                        doc={doc}
                        onOpen={() => onOpenDoc(doc.id)}
                        fmt={fmt}
                        showDelete={false}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function DocCard({ doc, onOpen, onDelete, fmt, showDelete }) {
  return (
    <div style={styles.card} onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen()}>
      <div style={styles.cardTop}>
        <FileText size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.cardTitle}>{doc.title || 'Untitled'}</div>
          <div style={styles.cardMeta}>
            {doc.relationship === 'shared'
              ? `Shared by ${doc.owner_name}`
              : `Updated ${fmt(doc.updated_at)}`
            }
          </div>
        </div>
        <span className={`badge badge-${doc.relationship}`}>
          {doc.relationship === 'owner' ? 'Owner' : 'Shared'}
        </span>
      </div>
      <div style={styles.cardBottom}>
        <span style={styles.cardDate}>{fmt(doc.updated_at)}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {showDelete && (
            <button className="btn btn-ghost" onClick={onDelete} style={{ padding: '4px 6px' }} title="Delete">
              <Trash2 size={13} />
            </button>
          )}
          <button className="btn btn-ghost" style={{ padding: '4px 6px' }}>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    background: 'var(--white)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px',
    gap: 20,
  },
  brandWrap: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 5,
    paddingLeft: 4,
  },
  brand: {
    fontFamily: 'var(--font-serif)',
    fontSize: 22,
    color: 'var(--ink)',
  },
  brandAccent: {
    fontFamily: 'var(--font-serif)',
    fontSize: 22,
    color: 'var(--accent)',
  },
  sideActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sideNav: {
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13.5,
    color: 'var(--ink-muted)',
    cursor: 'pointer',
    background: 'var(--parchment)',
    fontWeight: 500,
  },
  sideFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 4px 0',
    borderTop: '1px solid var(--border)',
  },
  userChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: 'var(--white)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink)',
  },
  userEmail: {
    fontSize: 11.5,
    color: 'var(--ink-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '40px 48px',
  },
  mainInner: {
    maxWidth: 900,
  },
  heading: {
    fontFamily: 'var(--font-serif)',
    fontSize: 32,
    marginBottom: 32,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--ink-muted)',
    marginBottom: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  card: {
    background: 'var(--white)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    cursor: 'pointer',
    transition: 'box-shadow var(--transition), border-color var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    fontSize: 12,
    color: 'var(--ink-muted)',
    marginTop: 1,
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontSize: 12,
    color: 'var(--ink-faint)',
  },
}
