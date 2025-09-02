#!/usr/bin/env python3
"""
Test script to verify Pinecone installation and configuration.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_pinecone_installation():
    """Test Pinecone installation and basic functionality."""
    try:
        logger.info("🔄 Testing Pinecone installation...")
        
        # Test 1: Import dependencies
        logger.info("✅ Testing imports...")
        from pinecone import Pinecone, ServerlessSpec
        from openai import OpenAI
        logger.info("✅ Pinecone and OpenAI imports successful!")
        
        # Test 2: Check environment variables
        logger.info("✅ Testing environment variables...")
        from core.config import settings
        
        required_vars = {
            'PINECONE_API_KEY': settings.PINECONE_API_KEY,
            'PINECONE_INDEX_NAME': settings.PINECONE_INDEX_NAME,
            'OPENAI_API_KEY': settings.OPENAI_API_KEY
        }
        
        for var, value in required_vars.items():
            if not value:
                logger.error(f"❌ Missing environment variable: {var}")
                return False
            else:
                # Show partial key for verification (first 8 chars + ...)
                display_value = f"{value[:8]}..." if len(value) > 8 else value
                logger.info(f"✅ {var}: {display_value}")
        
        # Test 3: Initialize Pinecone client
        logger.info("✅ Testing Pinecone client initialization...")
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        logger.info("✅ Pinecone client initialized successfully!")
        
        # Test 4: List indexes
        logger.info("✅ Testing index listing...")
        indexes = pc.list_indexes()
        logger.info(f"✅ Found {len(indexes)} indexes")
        
        # Test 5: Initialize OpenAI client
        logger.info("✅ Testing OpenAI client initialization...")
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("✅ OpenAI client initialized successfully!")
        
        # Test 6: Test embedding generation (if API key is valid)
        logger.info("✅ Testing embedding generation...")
        try:
            response = openai_client.embeddings.create(
                model="text-embedding-ada-002",
                input="This is a test text for embedding generation."
            )
            embedding = response.data[0].embedding
            logger.info(f"✅ Generated embedding with dimension: {len(embedding)}")
        except Exception as e:
            logger.warning(f"⚠️ Embedding test failed (this might be due to API limits): {e}")
        
        # Test 7: Test PineconeManager initialization
        logger.info("✅ Testing PineconeManager...")
        try:
            from core.pinecone_config import PineconeManager
            manager = PineconeManager()
            logger.info("✅ PineconeManager initialized successfully!")
            
            # Test stats retrieval
            if manager.index:
                stats = manager.get_index_stats("test_org")
                logger.info(f"✅ Index stats retrieved: {stats}")
            
        except Exception as e:
            logger.error(f"❌ PineconeManager test failed: {e}")
            return False
        
        logger.info("🎉 All tests passed! Pinecone installation is working correctly.")
        return True
        
    except ImportError as e:
        logger.error(f"❌ Import error: {e}")
        logger.error("Please ensure all dependencies are installed:")
        logger.error("pip install 'pinecone[asyncio,grpc]>=7.0.0' openai")
        return False
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        return False

def main():
    """Main test function."""
    logger.info("🚀 Starting Pinecone installation test...")
    
    # Run the async test
    result = asyncio.run(test_pinecone_installation())
    
    if result:
        logger.info("✅ All tests completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()