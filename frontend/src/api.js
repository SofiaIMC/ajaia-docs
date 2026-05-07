const BASE = import.meta.env.VITE_API_URL || ''

function getToken() {
  return localStorage.getItem('ajaia_token')
}

async function req(method, path, body, isFormData = false) {
  const token = getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body && !isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }

  return res.json()
}

export const api = {
  login: (email) => req('POST', '/login', { email }),
  users: () => req('GET', '/users'),

  docs: {
    list: () => req('GET', '/documents'),
    get: (id) => req('GET', `/documents/${id}`),
    create: (data) => req('POST', '/documents', data),
    update: (id, data) => req('PATCH', `/documents/${id}`, data),
    delete: (id) => req('DELETE', `/documents/${id}`),
  },

  shares: {
    list: (docId) => req('GET', `/documents/${docId}/shares`),
    add: (docId, email) => req('POST', `/documents/${docId}/shares`, { email }),
    remove: (docId, userId) => req('DELETE', `/documents/${docId}/shares/${userId}`),
  },

  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return req('POST', '/upload', fd, true)
  },
}
