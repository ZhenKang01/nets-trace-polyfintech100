from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from seed import seed
from routes.transactions import router as txn_router
from routes.wrapped import router as wrapped_router
from routes.pools import router as pools_router

app = FastAPI(title="NETS Wrapped API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    seed()


app.include_router(txn_router, tags=["transactions"])
app.include_router(wrapped_router, tags=["wrapped"])
app.include_router(pools_router, tags=["pools"])


@app.get("/health")
def health():
    return {"status": "ok"}
