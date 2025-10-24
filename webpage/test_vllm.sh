#!/bin/bash

echo "🧪 Testing vLLM Server Connection..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 Endpoint: http://218.50.74.140:40026/v1/chat/completions"
echo ""

# Test the vLLM endpoint
echo "🔄 Sending test request..."
echo ""

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://218.50.74.140:40026/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen2.5-14B-Instruct",
    "messages": [{"role": "user", "content": "Hello, I am testing the connection."}],
    "max_tokens": 50,
    "temperature": 0.7
  }' 2>&1)

# Extract HTTP code
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
response_body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "Response:"
echo "$response_body" | python3 -m json.tool 2>/dev/null || echo "$response_body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ SUCCESS! vLLM server is responding correctly!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Your backend will successfully call the vLLM API! 🎉"
else
    echo "❌ FAILED! HTTP Status Code: $http_code"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Possible issues:"
    echo "1. vLLM server is not running on vast.ai"
    echo "2. IP address or port is incorrect"
    echo "3. Firewall blocking the connection"
    echo "4. Model name mismatch"
    echo ""
    echo "💡 Check your vast.ai instance and verify:"
    echo "   - Instance is running"
    echo "   - Correct IP: 218.50.74.140"
    echo "   - Correct port: 40026"
    echo "   - vLLM service is active"
fi
