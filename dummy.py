import requests
import json

# vLLM endpoint URL
URL = "http://198.53.64.194:40538/v1/completions"

# Build the payload
payload = {
    "model": "Qwen/Qwen2.5-14B-Instruct",
    "prompt": (
        "You are Detective Morgan, interrogating suspect Alex Carter "
        "in the murder of Professor Grey. Alex is defensive, intelligent, and hiding something. "
        "Maintain realism and emotion.\n\n"
        "Detective: Where were you at 8 PM last night?\nAlex:"
    ),
    "max_tokens": 200,
    "temperature": 0.8,
    "top_p": 0.9
}

# Make the request
response = requests.post(URL, json=payload)

# Parse JSON
try:
    data = response.json()
except Exception as e:
    print("Error decoding JSON:", e)
    print("Raw response:", response.text)
    exit()

# Extract the completion text
output = data.get("choices", [{}])[0].get("text", "").strip()

# Display results neatly
print("\n=== Model Response ===")
print(output)
print("\n=== Metadata ===")
print(json.dumps({
    "model": data.get("model"),
    "id": data.get("id"),
    "usage": data.get("usage"),
    "finish_reason": data.get("choices", [{}])[0].get("finish_reason")
}, indent=2))
