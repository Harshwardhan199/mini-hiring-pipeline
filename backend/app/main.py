from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.candidates import models
from app.candidates.router import router as candidates_router
from app.database.connection import Base, engine
from app.search.router import router as search_router


app = FastAPI(title="Mini Hiring Pipeline")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

app.include_router(candidates_router)
app.include_router(search_router)


@app.get("/health")
def health():
    return {"status": "ok"}