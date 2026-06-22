from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from seed import seed
from routes.transactions import router as txn_router
from routes.wrapped import router as wrapped_router
from routes.pools import router as pools_router
from routes.roam import router as roam_router
from routes.user_pools import router as user_pools_router

app = FastAPI(title="NETS Trace API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174"],
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
app.include_router(roam_router, tags=["roam"])
app.include_router(user_pools_router, tags=["user-pools"])


@app.get("/health")
def health():
    return {"status": "ok"}
