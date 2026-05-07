# AI Workflow Note

## Tools Used

- **Claude (Anthropic)** — primary coding assistant for scaffolding, boilerplate, and component generation
- **No other AI tools** used for this submission

---

## Where AI Materially Sped Up My Work

### 1. FastAPI boilerplate (saved ~45 min)
Setting up the full CRUD scaffold for documents and shares — including SQLite initialization, dependency injection for auth, and Pydantic models — would normally take close to an hour of careful typing. Claude generated a complete, working first draft that I then edited for correctness and scope.

### 2. Tiptap toolbar component (saved ~30 min)
The editor toolbar is repetitive JSX — one button per formatting action, each needing the right `editor.isActive()` check, `chain().focus()` call, and active state styling. Claude generated the full toolbar in one pass. I verified each action against the Tiptap documentation and adjusted the heading/paragraph toggle logic.

### 3. CSS design system (saved ~20 min)
The global CSS variables, button variants, modal, and toast styles were scaffolded by Claude based on a design direction I specified (editorial, serif + sans, muted red accent). I adjusted the color palette, removed some over-engineered hover effects, and tuned font sizing.

### 4. Test suite (saved ~25 min)
Claude wrote the initial pytest test file covering auth, CRUD, sharing, and file upload. I reviewed every test case, caught one incorrect assumption (the unauthenticated access test expected 401 but FastAPI's HTTPBearer returns 403 with `auto_error=False`), and corrected it.

---

## What AI-Generated Output I Changed or Rejected

| Area | What Claude generated | What I changed |
|------|----------------------|----------------|
| Auth middleware | `HTTPBearer` with `auto_error=True` | Changed to `auto_error=False` and manual 401 handling for cleaner error messages |
| Autosave | `useCallback` saving on every keystroke | Added 1.5s debounce timer — Claude's version would have hammered the API |
| Share modal | Dropdown of all users | Changed to email input — more realistic UX and doesn't expose user enumeration |
| Tiptap content storage | Storing as raw HTML | Rejected — changed to JSON (`editor.getJSON()`) which is safer and more portable |
| Delete confirmation | No confirmation step | Added `confirm()` dialog — obvious omission from generated code |
| File upload | Accepted `.docx` | Removed — Claude included a .docx handler that required `python-docx` but didn't actually parse formatting properly; better to scope down and be honest about it |

---

## How I Verified Correctness, UX Quality, and Reliability

**Correctness:** Ran the full pytest suite after each backend change. Manually tested every API endpoint via the FastAPI `/docs` Swagger UI before wiring the frontend.

**UX quality:** Walked through the full user flow as both Alice and Bob: created a doc, formatted content, renamed the title, shared with the other user, verified the badge change, tested revoke. Checked that error states (wrong email, unsupported file type) show user-facing messages not raw stack traces.

**Implementation reliability:** Reviewed all generated async/await patterns in the frontend — Claude occasionally omits error handling in `.then()` chains; I ensured every `api.*` call is wrapped in try/catch with a `toast(..., 'error')` fallback. Verified the autosave timer is properly cleared in the `onUpdate` handler to prevent stale closures.

---

## Summary

AI accelerated the scaffolding work — roughly 2 hours of typing compressed to 30 minutes of review and editing. Every piece of generated output was read, tested, and in several cases corrected before inclusion. The product decisions (scope cuts, auth simplification, JSON over HTML storage, email-based sharing) were all made independently.
