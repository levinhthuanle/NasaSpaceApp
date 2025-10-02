#!/usr/bin/env python3
"""
Test script cho Flower Information API
Kiểm tra các endpoint của API
"""

import asyncio
import httpx
from datetime import datetime

# Cấu hình API
BASE_URL = "http://127.0.0.1:8000"

async def test_health_check():
    """Test health check endpoint"""
    print("🔍 Testing health check...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            print(f"✅ Health check: {response.status_code}")
            print(f"   Response: {response.json()}")
        except Exception as e:
            print(f"❌ Health check failed: {e}")

async def test_flower_location_api():
    """Test main flower location API"""
    print("\n🌸 Testing flower location API...")
    
    test_data = {
        "country": "Vietnam",
        "city": "Ho Chi Minh City", 
        "district": "District 1",
        "current_time": datetime.now().isoformat(),
        "season": "autumn",
        "climate_info": "tropical",
        "additional_info": "Tìm hoa phù hợp trồng trong vườn nhỏ, dễ chăm sóc"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/flowers/location",
                json=test_data
            )
            print(f"✅ Flower location API: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Success: {result['success']}")
                print(f"   Message: {result['message']}")
                
                if 'data' in result and result['data']:
                    gemini_response = result['data'].get('gemini_response', '')
                    if gemini_response:
                        print(f"   Gemini Response (first 200 chars): {gemini_response[:200]}...")
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Flower location API failed: {e}")

async def test_chat_api():
    """Test chat API"""
    print("\n💬 Testing chat API...")
    
    test_message = {
        "message": "Hoa sen có ý nghĩa gì trong văn hóa Việt Nam?"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(
                f"{BASE_URL}/api/v1/flowers/chat",
                json=test_message
            )
            print(f"✅ Chat API: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Success: {result['success']}")
                if 'response' in result:
                    print(f"   Response (first 200 chars): {result['response'][:200]}...")
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Chat API failed: {e}")

async def test_examples_api():
    """Test examples API"""
    print("\n📋 Testing examples API...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/api/v1/flowers/examples")
            print(f"✅ Examples API: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"   Success: {result['success']}")
                print(f"   Number of examples: {len(result.get('examples', []))}")
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Examples API failed: {e}")

async def main():
    """Chạy tất cả tests"""
    print("🚀 Starting API Tests...")
    print(f"📍 Base URL: {BASE_URL}")
    print("=" * 50)
    
    await test_health_check()
    await test_flower_location_api()
    await test_chat_api()
    await test_examples_api()
    
    print("\n" + "=" * 50)
    print("🏁 Tests completed!")
    print("\n💡 Để test thủ công:")
    print(f"   - Mở trình duyệt: {BASE_URL}/docs")
    print(f"   - Health check: {BASE_URL}/health")

if __name__ == "__main__":
    asyncio.run(main())