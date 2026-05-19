from contextlib import asynccontextmanager

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from db.database import engine
from db.models import Base
from routes.canvas_routes import router as canvas_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev convenience — use Alembic for prod)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="CanvasNotes API", version="0.1.0", lifespan=lifespan)

# CORS — allow the Vite dev server
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount canvas routes
app.include_router(canvas_router)


@app.get("/")
async def root():
    return {"message": "CanvasNotes API is running"}
