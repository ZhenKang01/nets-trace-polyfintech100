from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from seed import seed
from routes.transactions import router as txn_router
from routes.wrapped import router as wrapped_router
from routes.pools import router as pools_router
from routes.roam import router as roam_router
from routes.user_pools import router as user_pools_router
from routes.roam_trips import router as roam_trips_router
from routes.face_auth import router as face_auth_router

app = FastAPI(title="NETS Trace API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(roam_trips_router, tags=["roam-trips"])
app.include_router(face_auth_router, tags=["auth"])


@app.get("/health")
def health():
    return {"status": "ok"}
