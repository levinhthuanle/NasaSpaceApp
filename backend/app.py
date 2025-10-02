import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.gemini import initialize_gemini
from api.endpoints import flowers, health

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Flower Information API",
    description="Backend API tương tác với Gemini AI để cung cấp thông tin về các loài hoa",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên cấu hình cụ thể hơn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router với tất cả endpoints
app.include_router(health.router)
app.include_router(flowers.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🌸 Flower API Server starting up...")
    
    # Khởi tạo Gemini service
    success, message = initialize_gemini()
    if success:
        print("✅ Gemini AI initialized successfully!")
    else:
        print(f"⚠️  Warning: {message}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app", 
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )