import React, { useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { ToastProvider } from './Toast'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import Editor from './components/Editor'
import './editor.css'

function AppInner() {
  const { user } = useAuth()
  const [currentDocId, setCurrentDocId] = useState(null)

  if (!user) return <LoginPage />
  if (currentDocId) return <Editor docId={currentDocId} onBack={() => setCurrentDocId(null)} />
  return <Dashboard onOpenDoc={setCurrentDocId} />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  )
}
