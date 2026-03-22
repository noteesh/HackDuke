from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from call_router import router as call_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(call_router)

@app.get("/")
async def root():
    return {"status": "ok"}