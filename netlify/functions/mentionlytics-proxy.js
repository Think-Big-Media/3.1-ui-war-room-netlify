// Simple Mentionlytics proxy for Netlify Edge Functions
exports.handler = async (event, context) => {
  const MENTIONLYTICS_API_TOKEN = process.env.MENTIONLYTICS_API_TOKEN || '0X44tHi275ZqqK2psB4U-Ph-dw2xRkq7T4QVkSBlUz32V0ZcgkXt2dQSni52-fhB7WZyZOoGBPcR23O9oND_h1DE';
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Extract endpoint from path
  const path = event.path.replace('/.netlify/functions/mentionlytics-proxy/', '');
  
  try {
    // Mock data for now (replace with real API calls when ready)
    const mockData = {
      sentiment: {
        positive: 65,
        negative: 15,
        neutral: 20,
        period: '7days',
        timestamp: new Date().toISOString()
      },
      geographic: {
        distribution: [
          { country: 'USA', mentions: 450, sentiment: 72 },
          { country: 'UK', mentions: 230, sentiment: 68 },
          { country: 'Canada', mentions: 180, sentiment: 75 }
        ],
        timestamp: new Date().toISOString()
      },
      mentions: {
        items: [
          {
            id: '1',
            source: 'Twitter',
            text: 'Great campaign strategy!',
            sentiment: 'positive',
            reach: 15000,
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            source: 'Facebook',
            text: 'Interesting political analysis',
            sentiment: 'neutral',
            reach: 8500,
            timestamp: new Date().toISOString()
          }
        ],
        total: 2,
        timestamp: new Date().toISOString()
      },
      validate: {
        status: 'connected',
        service: 'mentionlytics',
        timestamp: new Date().toISOString()
      }
    };

    // Return appropriate mock data based on endpoint
    const response = mockData[path] || mockData.validate;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};