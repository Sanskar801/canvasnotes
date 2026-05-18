from fastapi import FastAPI, Form
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

app = FastAPI()


origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


db = {}

@app.get("/")
async def root():
    return {"message": "Hello World"}


class Auth(BaseModel):
    username: str
    email: str
@app.post("/auth")
async def auth(data: Auth):
    if data.username in db:
        return {"username": data.username, "email": db[data.username]["email"]}
    else:
        db[data.username] = {"email": data.email}
        return {"username": data.username, "email": data.email}

