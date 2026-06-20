from fastapi import APIRouter, HTTPException
from database import get_db

router = APIRouter()


@router.get("/users")
def list_users():
    conn = get_db()
    rows = conn.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/users/{user_id}")
def get_user(user_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


@router.get("/users/{user_id}/transactions")
def get_transactions(user_id: str, limit: int = 50, offset: int = 0):
    conn = get_db()
    user = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    rows = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, time DESC LIMIT ? OFFSET ?",
        (user_id, limit, offset)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
