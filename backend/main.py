from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import sqlite3
import json
import os
import uuid
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "docs.db"
security = HTTPBearer(auto_error=False)


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL, created_at TEXT NOT NULL)""")
    c.execute("""CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY, title TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        owner_id TEXT NOT NULL, created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL)""")
    c.execute("""CREATE TABLE IF NOT EXISTS shares (
        id TEXT PRIMARY KEY, document_id TEXT NOT NULL,
        shared_with_id TEXT NOT NULL, created_at TEXT NOT NULL,
        UNIQUE(document_id, shared_with_id))""")
    now = datetime.utcnow().isoformat()
    c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?)", ("user-alice", "alice@ajaia.dev", "Alice", now))
    c.execute("INSERT OR IGNORE INTO users VALUES (?,?,?,?)", ("user-bob", "bob@ajaia.dev", "Bob", now))
    conn.commit()
    conn.close()


init_db()


def current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: sqlite3.Connection = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.execute("SELECT * FROM users WHERE id = ?", (credentials.credentials,)).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return dict(user)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/login")
async def login(request: Request, db: sqlite3.Connection = Depends(get_db)):
    body = await request.json()
    email = body.get("email", "").strip().lower()
    user = db.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Unknown email. Use alice@ajaia.dev or bob@ajaia.dev")
    return {"token": user["id"], "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


@app.get("/users")
def list_users(db: sqlite3.Connection = Depends(get_db)):
    return [dict(r) for r in db.execute("SELECT id, email, name FROM users").fetchall()]


@app.get("/documents")
def list_documents(user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    uid = user["id"]
    owned = db.execute("SELECT * FROM documents WHERE owner_id = ? ORDER BY updated_at DESC", (uid,)).fetchall()
    shared = db.execute("""SELECT d.* FROM documents d
        JOIN shares s ON d.id = s.document_id
        WHERE s.shared_with_id = ? ORDER BY d.updated_at DESC""", (uid,)).fetchall()

    def enrich(row, rel):
        d = dict(row)
        d["relationship"] = rel
        owner = db.execute("SELECT name FROM users WHERE id = ?", (d["owner_id"],)).fetchone()
        d["owner_name"] = owner["name"] if owner else "Unknown"
        return d

    return {"owned": [enrich(r, "owner") for r in owned], "shared": [enrich(r, "shared") for r in shared]}


@app.post("/documents")
async def create_document(request: Request, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    body = await request.json()
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    title = body.get("title", "Untitled Document")
    content = body.get("content", "")
    db.execute("INSERT INTO documents VALUES (?,?,?,?,?,?)", (doc_id, title, content, user["id"], now, now))
    db.commit()
    return dict(db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone())


@app.get("/documents/{doc_id}")
def get_document(doc_id: str, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    uid = user["id"]
    is_owner = doc["owner_id"] == uid
    is_shared = db.execute("SELECT 1 FROM shares WHERE document_id = ? AND shared_with_id = ?", (doc_id, uid)).fetchone()
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Access denied")
    result = dict(doc)
    result["relationship"] = "owner" if is_owner else "shared"
    owner = db.execute("SELECT name FROM users WHERE id = ?", (doc["owner_id"],)).fetchone()
    result["owner_name"] = owner["name"] if owner else "Unknown"
    return result


@app.patch("/documents/{doc_id}")
async def update_document(doc_id: str, request: Request, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    uid = user["id"]
    is_owner = doc["owner_id"] == uid
    is_shared = db.execute("SELECT 1 FROM shares WHERE document_id = ? AND shared_with_id = ?", (doc_id, uid)).fetchone()
    if not is_owner and not is_shared:
        raise HTTPException(status_code=403, detail="Access denied")
    body = await request.json()
    updates = {}
    if "title" in body:
        updates["title"] = body["title"]
    if "content" in body:
        updates["content"] = body["content"]
    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        db.execute(f"UPDATE documents SET {set_clause} WHERE id = ?", (*updates.values(), doc_id))
        db.commit()
    return dict(db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone())


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can delete")
    db.execute("DELETE FROM shares WHERE document_id = ?", (doc_id,))
    db.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    db.commit()
    return {"ok": True}


@app.get("/documents/{doc_id}/shares")
def list_shares(doc_id: str, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc or doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can view shares")
    rows = db.execute("""SELECT u.id, u.name, u.email FROM shares s
        JOIN users u ON s.shared_with_id = u.id WHERE s.document_id = ?""", (doc_id,)).fetchall()
    return [dict(r) for r in rows]


@app.post("/documents/{doc_id}/shares")
async def share_document(doc_id: str, request: Request, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc or doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can share")
    body = await request.json()
    email = body.get("email", "").strip().lower()
    target = db.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["id"] == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")
    try:
        db.execute("INSERT INTO shares VALUES (?,?,?,?)", (str(uuid.uuid4()), doc_id, target["id"], datetime.utcnow().isoformat()))
        db.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Already shared")
    return {"ok": True, "shared_with": dict(target)}


@app.delete("/documents/{doc_id}/shares/{user_id}")
def unshare(doc_id: str, user_id: str, user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    doc = db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()
    if not doc or doc["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can remove shares")
    db.execute("DELETE FROM shares WHERE document_id = ? AND shared_with_id = ?", (doc_id, user_id))
    db.commit()
    return {"ok": True}


@app.post("/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(current_user), db: sqlite3.Connection = Depends(get_db)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in {".txt", ".md"}:
        raise HTTPException(status_code=415, detail=f"Only .txt and .md files supported")
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except:
        raise HTTPException(status_code=400, detail="File must be UTF-8 text")
    paragraphs = [{"type": "paragraph", "content": [{"type": "text", "text": line}] if line.strip() else []} for line in text.splitlines()]
    content = json.dumps({"type": "doc", "content": paragraphs or [{"type": "paragraph"}]})
    title = os.path.splitext(file.filename or "Upload")[0]
    doc_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    db.execute("INSERT INTO documents VALUES (?,?,?,?,?,?)", (doc_id, title, content, user["id"], now, now))
    db.commit()
    return dict(db.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone())
