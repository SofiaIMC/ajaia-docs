import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { api } from '../api'
import { useAuth } from '../AuthContext'
import { useToast } from '../Toast'
import ShareModal from './ShareModal'
import {
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Share2, Save, Check, Loader2
} from 'lucide-react'

const AUTOSAVE_DELAY = 1500

export default function Editor({ docId, onBack }) {
  const { user } = useAuth()
  const toast = useToast()
  const [doc, setDoc] = useState(null)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState('saved') // 'saved' | 'saving' | 'unsaved'
  const [showShare, setShowShare] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const saveTimer = useRef(null)
  const isOwner = doc?.owner_id === user?.id

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: '',
    onUpdate: () => {
      setSaveState('unsaved')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(saveContent, AUTOSAVE_DELAY)
    },
    editorProps: {
      attributes: { class: 'tiptap-editor' },
    },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const d = await api.docs.get(docId)
        setDoc(d)
        setTitle(d.title)
        if (d.content) {
          try {
            const parsed = typeof d.content === 'string' ? JSON.parse(d.content) : d.content
            editor?.commands.setContent(parsed)
          } catch {
            editor?.commands.setContent(`<p>${d.content}</p>`)
          }
        }
        setSaveState('saved')
      } catch (err) {
        toast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }
    if (editor) load()
  }, [docId, editor])

  const saveContent = useCallback(async () => {
    if (!editor) return
    setSaveState('saving')
    try {
      await api.docs.update(docId, { content: JSON.stringify(editor.getJSON()) })
      setSaveState('saved')
    } catch (err) {
      setSaveState('unsaved')
      toast('Auto-save failed: ' + err.message, 'error')
    }
  }, [editor, docId])

  const saveTitle = async () => {
    if (!title.trim() || title === doc?.title) return
    try {
      const updated = await api.docs.update(docId, { title: title.trim() })
      setDoc(updated)
      toast('Title updated')
    } catch (err) {
      toast(err.message, 'error')
      setTitle(doc?.title || '')
    }
    setEditingTitle(false)
  }

  const handleManualSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await saveContent()
    toast('Saved')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Top bar */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button className="btn btn-ghost" onClick={onBack} style={{ gap: 4 }}>
            <ArrowLeft size={15} />
            <span style={{ fontSize: 13 }}>All docs</span>
          </button>

          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(doc?.title || ''); setEditingTitle(false) } }}
              autoFocus
              style={{ ...styles.titleInput, display: 'inline-block' }}
            />
          ) : (
            <span style={styles.titleDisplay} onClick={() => setEditingTitle(true)} title="Click to rename">
              {title || 'Untitled Document'}
            </span>
          )}

          {doc && (
            <span className={`badge badge-${doc.relationship}`} style={{ fontSize: 10 }}>
              {doc.relationship === 'owner' ? 'Owner' : `Shared by ${doc.owner_name}`}
            </span>
          )}
        </div>

        <div style={styles.headerRight}>
          <SaveIndicator state={saveState} />
          <button className="btn btn-ghost" onClick={handleManualSave} title="Save now">
            <Save size={14} />
          </button>
          {isOwner && (
            <button className="btn btn-secondary" onClick={() => setShowShare(true)} style={{ gap: 6 }}>
              <Share2 size={14} />
              Share
            </button>
          )}
        </div>
      </header>

      {/* Toolbar */}
      {editor && <Toolbar editor={editor} />}

      {/* Editor */}
      <div style={styles.editorWrap}>
        <div style={styles.page_sheet}>
          <EditorContent editor={editor} />
        </div>
      </div>

      {showShare && (
        <ShareModal docId={docId} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}

function SaveIndicator({ state }) {
  return (
    <div style={styles.saveIndicator}>
      {state === 'saving' && <><Loader2 size={12} style={{ animation: 'spin 600ms linear infinite' }} /> Saving…</>}
      {state === 'saved' && <><Check size={12} /> Saved</>}
      {state === 'unsaved' && <span style={{ color: 'var(--ink-faint)' }}>Unsaved changes</span>}
    </div>
  )
}

function Toolbar({ editor }) {
  const btn = (active) => ({
    ...styles.toolBtn,
    background: active ? 'var(--parchment-dark)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-muted)',
  })

  return (
    <div style={styles.toolbar}>
      <ToolGroup>
        {/* Headings */}
        {[1, 2, 3].map(level => (
          <button
            key={level}
            style={btn(editor.isActive('heading', { level }))}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}
        <button
          style={btn(!editor.isActive('heading'))}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        >
          P
        </button>
      </ToolGroup>

      <div style={styles.sep} />

      <ToolGroup>
        <button style={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <Bold size={14} />
        </button>
        <button style={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <Italic size={14} />
        </button>
        <button style={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <UnderlineIcon size={14} />
        </button>
      </ToolGroup>

      <div style={styles.sep} />

      <ToolGroup>
        <button style={btn(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">
          <AlignLeft size={14} />
        </button>
        <button style={btn(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center">
          <AlignCenter size={14} />
        </button>
        <button style={btn(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">
          <AlignRight size={14} />
        </button>
      </ToolGroup>

      <div style={styles.sep} />

      <ToolGroup>
        <button style={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List size={14} />
        </button>
        <button style={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered size={14} />
        </button>
      </ToolGroup>
    </div>
  )
}

function ToolGroup({ children }) {
  return <div style={{ display: 'flex', gap: 2 }}>{children}</div>
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--parchment)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'var(--white)',
    borderBottom: '1px solid var(--border)',
    gap: 12,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  titleDisplay: {
    fontFamily: 'var(--font-serif)',
    fontSize: 17,
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 320,
    borderBottom: '1px dashed transparent',
    transition: 'border-color 150ms',
  },
  titleInput: {
    fontFamily: 'var(--font-serif)',
    fontSize: 17,
    padding: '2px 6px',
    border: '1.5px solid var(--accent)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--white)',
    outline: 'none',
    width: 280,
  },
  saveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--ink-muted)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px',
    background: 'var(--white)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  toolBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 28,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 120ms',
    fontFamily: 'var(--font-sans)',
    fontSize: 12.5,
    fontWeight: 700,
  },
  sep: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    margin: '0 4px',
  },
  editorWrap: {
    flex: 1,
    overflow: 'auto',
    padding: '40px 24px',
    display: 'flex',
    justifyContent: 'center',
  },
  page_sheet: {
    background: 'var(--white)',
    width: '100%',
    maxWidth: 760,
    minHeight: '100%',
    padding: '60px 72px',
    boxShadow: 'var(--shadow-md)',
    borderRadius: 'var(--radius)',
  },
}
