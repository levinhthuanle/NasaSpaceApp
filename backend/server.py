#!/usr/bin/env python3
"""
Flower Information API Server
Khởi chạy server backend cho ứng dụng thông tin hoa
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# Thêm thư mục backend vào Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def main():
    """Khởi chạy server"""
    # Load environment variables
    load_dotenv()
    
    # Server configuration
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    print("🌸 Starting Flower Information API Server...")
    print(f"🌐 Server will run at: http://{host}:{port}")
    print(f"🐛 Debug mode: {debug}")
    
    # Check if Gemini API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  WARNING: GEMINI_API_KEY not found in environment variables")
        print("💡 Please set your Gemini API key in .env file or environment variables")
        print("📖 Get your API key from: https://aistudio.google.com/apikey")
        return
    
    try:
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=debug,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()