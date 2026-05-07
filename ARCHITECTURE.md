# Architecture Note

## What I Prioritized and Why

### 1. Tiptap for the editor (not a textarea)

The editing experience is the core of the product. I chose Tiptap (built on ProseMirror) because it produces a structured JSON document model rather than raw HTML — this makes content portable, diffable, and safe to persist. The tradeoff is a heavier frontend dependency, but it's the right call for any editor that needs to survive real use.

### 2. SQLite over Postgres for this scope

SQLite is zero-setup, file-based, and sufficient for a demo with two users. Using Postgres would add a running service requirement that complicates local setup and deployment for reviewers. The schema is simple enough that migrating to Postgres is a `pip install psycopg2` and a connection string change — nothing about the application logic would change.

### 3. Token = user ID (intentional demo shortcut)

Authentication is the part I most deliberately simplified. A production system would use JWTs with hashed passwords and proper expiry. For this demo, the token is just the user's database ID passed in the `Authorization: Bearer` header. This keeps the focus on the document and sharing logic, which is what the assessment actually evaluates. The simplification is clearly documented everywhere.

### 4. Autosave with debounce

Rather than a "save" button as the primary flow (which creates anxiety around data loss), I implemented 1.5-second debounced autosave. The manual save button is still present for power users. This pattern is familiar from Notion/Google Docs and sets correct user expectations.

### 5. Content stored as Tiptap JSON

Documents are persisted as serialized Tiptap JSON blobs in a `TEXT` column. This is simpler than a normalized block model and fully sufficient for this scope. A production system might normalize blocks for searchability, but that would add significant complexity for no benefit at demo scale.

## Data Model

```
users
  id TEXT PK
  email TEXT UNIQUE
  name TEXT
  created_at TEXT

documents
  id TEXT PK
  title TEXT
  content TEXT          -- Tiptap JSON blob
  owner_id TEXT FK→users
  created_at TEXT
  updated_at TEXT

shares
  id TEXT PK
  document_id TEXT FK→documents
  shared_with_id TEXT FK→users
  created_at TEXT
  UNIQUE(document_id, shared_with_id)
```

## Request Flow

```
Browser → Vite dev server (/api proxy) → FastAPI
                OR
Browser → Vercel CDN → Render (FastAPI, prod)
```

All API routes are protected with a `Bearer` token header. FastAPI's dependency injection resolves the current user on every protected route, and access control is checked inline before any read or write operation.

## File Upload Flow

```
User selects .txt/.md → FormData POST /upload
→ FastAPI validates extension + decodes UTF-8
→ Splits on newlines → builds Tiptap paragraph nodes
→ Inserts as new document → returns doc ID
→ Frontend navigates directly to editor
```

## Tradeoffs I'd Revisit in Production

| Decision | Shortcut taken | Production approach |
|----------|---------------|---------------------|
| Auth | Token = user ID | JWT with bcrypt passwords |
| DB | SQLite | Postgres + connection pool |
| Sharing | Edit-only | Role enum (viewer/editor/owner) |
| Collab | Last-write-wins | Yjs CRDT + WebSocket |
| Content storage | JSON blob | Normalized block table |
| File upload | UTF-8 text only | Mammoth for .docx, markdown parser for .md |
