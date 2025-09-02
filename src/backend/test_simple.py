"""
Simple test app to verify Render deployment
"""
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "War Room API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "war-room-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
