#!/bin/bash

# Script to fix Meta API client calls
cd /Users/rodericandrews/WarRoom_Development/1.0-war-room/src/api/meta

# Fix the call patterns
for file in ads.ts adsets.ts audiences.ts campaigns.ts; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Replace client.request({ method, path, data }) with client.request(path, { method, body })
    sed -i '' -E 's/this\.client\.request<([^>]+)>\(\{[[:space:]]*method: '\''([A-Z]+)'\'','[[:space:]]*path: `([^`]+)`,[[:space:]]*data: \{([^}]+)\}[[:space:]]*\}\)/this.client.request<\1>(`\3`, { method: '\''\2'\'', body: {\4} })/g' "$file"
    
    # Replace client.request({ method, path, params }) with client.request(path, { method, params })
    sed -i '' -E 's/this\.client\.request<([^>]+)>\(\{[[:space:]]*method: '\''([A-Z]+)'\'','[[:space:]]*path: `([^`]+)`,[[:space:]]*params: \{([^}]+)\}[[:space:]]*\}\)/this.client.request<\1>(`\3`, { method: '\''\2'\'', params: {\4} })/g' "$file"
    
    # Remove access_token from body/params (handled by client)
    sed -i '' -E 's/, access_token: this\.client\.getAccessToken\(\)//g' "$file"
    sed -i '' -E 's/access_token: this\.client\.getAccessToken\(\), //g' "$file"
    sed -i '' -E 's/access_token: this\.client\.getAccessToken\(\)//g' "$file"
    
    # Fix error handling
    sed -i '' -E 's/error\.message/error instanceof Error \? error\.message : String(error)/g' "$file"
  fi
done

echo "API calls fixed!"