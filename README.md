# Ajaia Docs

A lightweight collaborative document editor. Create, edit, share, and import documents — built for the Ajaia engineering assessment.

**Live demo:** `[deployed URL]`  
**Demo accounts:** `alice@ajaia.dev` · `bob@ajaia.dev`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite |
| Editor | Tiptap (ProseMirror-based rich text) |
| Backend | Python 3.11 + FastAPI |
| Database | SQLite (file-based, zero setup) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The SQLite database (`docs.db`) is created automatically on first run with two seeded users:
- `alice@ajaia.dev`
- `bob@ajaia.dev`

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/api` → `http://localhost:8000` automatically.

### Running Tests

```bash
cd backend
pip install pytest httpx
pytest test_main.py -v
```

---

## Features

### Document Creation & Editing
- Create new documents from the dashboard
- Click any document title in the editor to rename it inline
- Rich text formatting: **bold**, *italic*, underline, H1/H2/H3 headings, bullet lists, numbered lists, text alignment
- Auto-saves content 1.5 seconds after you stop typing
- Manual save button always available

### File Upload
- Upload `.txt` or `.md` files from the dashboard sidebar
- File content is converted into a new editable Tiptap document
- Other file types are rejected with a clear error message
- Imported document opens immediately for editing

### Sharing
- Owners can share any document via the **Share** button in the editor toolbar
- Enter another user's email to grant them edit access
- Shared users see the document in their "Shared with me" section on the dashboard
- Owners can revoke access at any time from the share modal
- Non-owners do not see the Share button

### Persistence
- All documents and share relationships stored in SQLite
- Document content persisted as Tiptap JSON (preserves formatting)
- Data survives server restarts

---

## Supported File Types for Upload

| Type | Supported |
|------|-----------|
| `.txt` | ✅ |
| `.md` | ✅ |
| `.docx` | ❌ Not supported |
| `.pdf` | ❌ Not supported |

Files must be UTF-8 encoded.

---

## What's Not Included

Given the 4–6 hour timebox, the following were intentionally deprioritized:

- **Real-time collaboration** — no WebSocket/CRDT layer; last-write-wins on save
- **Password auth** — login token is just the user ID (demo only, never production)
- **Role-based permissions** — all shares grant edit access
- **Version history** — no diff/snapshot mechanism
- **Export** — no PDF or Markdown export
- **Image uploads in documents** — no embedded image support

### What I'd build next (2–4 more hours)
1. JWT auth with hashed passwords
2. Read-only vs edit share permissions
3. Conflict-free document versioning (snapshots on save)
4. Export to Markdown
