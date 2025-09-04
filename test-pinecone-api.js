/**
 * Pinecone API Test Script - PROOF IT WORKS
 * Tests actual Pinecone API calls with live credentials
 */

import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = 'pcsk_6KTgtT_Mnamw4mQoAsFzw1wESTsArujRo7349XPfJ9juJCM2xK1sVYKwQQFoJJmDDni5uG';
const PINECONE_ENVIRONMENT = 'us-east-1';
const INDEX_NAME = 'warroom';

async function testPineconeIntegration() {
  console.log('🔍 Testing Pinecone Integration...\n');
  
  try {
    // Initialize Pinecone client
    console.log('1. Initializing Pinecone client...');
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY
    });
    console.log('✅ Pinecone client initialized successfully\n');

    // Get index reference
    console.log('2. Connecting to index:', INDEX_NAME);
    const index = pinecone.index(INDEX_NAME);
    console.log('✅ Connected to index successfully\n');

    // Test index stats
    console.log('3. Getting index statistics...');
    const stats = await index.describeIndexStats();
    console.log('✅ Index Stats:');
    console.log(`   - Total Records: ${stats.totalRecordCount?.toLocaleString() || 0}`);
    console.log(`   - Vector Dimension: ${stats.dimension || 'Unknown'}`);
    console.log(`   - Index Fullness: ${stats.indexFullness || 'Unknown'}\n`);

    // Test upsert (store a test vector)
    console.log('4. Testing document storage (upsert)...');
    const vectorDimension = stats.dimension || 1024; // Use actual index dimension
    const testVector = Array(vectorDimension).fill(0).map(() => Math.random() - 0.5);
    const upsertResult = await index.upsert([
      {
        id: `test_${Date.now()}`,
        values: testVector,
        metadata: {
          title: 'Live Pinecone API Test',
          content: 'This document proves Pinecone integration is working',
          timestamp: new Date().toISOString(),
          source: 'api_test_script',
          type: 'integration_test'
        }
      }
    ]);
    console.log('✅ Document stored successfully:', upsertResult);
    console.log('✅ Vector upserted to Pinecone index\n');

    // Test query (vector search)
    console.log('5. Testing vector search...');
    const queryVector = Array(vectorDimension).fill(0).map(() => Math.random() - 0.5);
    const queryResult = await index.query({
      vector: queryVector,
      topK: 3,
      includeMetadata: true
    });
    
    console.log('✅ Vector search completed!');
    console.log(`   - Found ${queryResult.matches?.length || 0} matches`);
    if (queryResult.matches && queryResult.matches.length > 0) {
      queryResult.matches.forEach((match, idx) => {
        console.log(`   ${idx + 1}. ID: ${match.id}`);
        console.log(`      Score: ${match.score?.toFixed(4)}`);
        if (match.metadata) {
          console.log(`      Title: ${match.metadata.title || 'N/A'}`);
          console.log(`      Type: ${match.metadata.type || 'N/A'}`);
        }
      });
    }
    console.log();

    // Final success message
    console.log('🎉 PINECONE INTEGRATION TEST PASSED!');
    console.log('✅ All operations successful:');
    console.log('   - Client initialization ✅');
    console.log('   - Index connection ✅'); 
    console.log('   - Statistics retrieval ✅');
    console.log('   - Document storage (upsert) ✅');
    console.log('   - Vector search (query) ✅');
    console.log('\n🚀 Pinecone is fully operational and ready for production use!');

  } catch (error) {
    console.error('❌ Pinecone integration test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('🔑 Check your PINECONE_API_KEY');
    }
    if (error.message.includes('index')) {
      console.error('📊 Check your index name and configuration');
    }
    
    process.exit(1);
  }
}

// Run the test
testPineconeIntegration().catch(console.error);