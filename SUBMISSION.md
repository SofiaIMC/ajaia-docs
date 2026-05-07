# Submission

## Contents of This Folder

| File / Folder | Description |
|---------------|-------------|
| `backend/` | Python FastAPI application |
| `backend/main.py` | All API routes, auth, DB init |
| `backend/requirements.txt` | Python dependencies |
| `backend/test_main.py` | Automated test suite (pytest) |
| `frontend/` | React + Vite application |
| `frontend/src/` | All React source files |
| `README.md` | Setup instructions, feature list, scope decisions |
| `ARCHITECTURE.md` | Technical decisions and data model |
| `AI_WORKFLOW.md` | How AI tools were used |
| `SUBMISSION.md` | This file |
| `video.txt` | Walkthrough video URL |

## Live Deployment

- **Frontend:** `[[Vercel URL]](https://ajaia-docs-navy.vercel.app)`
- **Backend API:** `[[Render URL]](https://ajaia-docs-production-44ff.up.railway.app)`

## Demo Credentials

| User | Email | Password |
|------|-------|----------|
| Alice | alice@ajaia.dev | *(no password — click email on login screen)* |
| Bob | bob@ajaia.dev | *(no password — click email on login screen)* |

## To Demonstrate Sharing

1. Log in as **Alice**
2. Create a document and write some content
3. Click **Share** → enter `bob@ajaia.dev`
4. Log out, log in as **Bob**
5. See the document appear under "Shared with me" with a green badge

## What Is Working

- ✅ Document creation, rename, edit, delete
- ✅ Rich text: bold, italic, underline, H1/H2/H3, bullet list, numbered list, text alignment
- ✅ Autosave (1.5s debounce) + manual save
- ✅ File upload (.txt, .md → new editable document)
- ✅ Sharing: grant access by email, revoke access
- ✅ Dashboard: owned vs shared documents with badges
- ✅ Persistence across refresh (SQLite)
- ✅ Automated test suite (15 tests)
- ✅ Error handling + toast notifications

## What Is Incomplete / Not Included

- ❌ Real-time collaboration (WebSocket/CRDT)
- ❌ Password-based authentication (token = user ID, demo only)
- ❌ Role-based share permissions (read vs edit)
- ❌ .docx file import
- ❌ Export to PDF or Markdown
- ❌ Document version history

## What I'd Build Next (2–4 more hours)

1. JWT auth with hashed passwords
2. Read-only vs editor share roles
3. Markdown export
4. Conflict detection on concurrent edits
