#!/bin/bash
# ERGIO Vercel Environment Variables Setup
# Run this script to set all required environment variables on Vercel
# Usage: bash setup_vercel_env.sh <VERCEL_PERSONAL_TOKEN>
# Get your token from: https://vercel.com/account/tokens

TOKEN=$1
PROJECT="ergio"  # Change if your Vercel project name is different

if [ -z "$TOKEN" ]; then
  echo "Usage: bash setup_vercel_env.sh <VERCEL_PERSONAL_TOKEN>"
  echo "Get your token from: https://vercel.com/account/tokens"
  exit 1
fi

# Environment variables to set
declare -A ENV_VARS=(
  ["SUPABASE_URL"]="https://owcxfzlanlrulflsyvlr.supabase.co"
  ["SUPABASE_ANON_KEY"]="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93Y3hmemxhbmxydWxmbHN5dmxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzI5NDIsImV4cCI6MjA5OTc0ODk0Mn0.k6IISu8k8QoU1CGLF0U3319qqDvEIwYY8PPXXvwfbAw"
  ["SUPABASE_SERVICE_KEY"]="YOUR_SERVICE_ROLE_KEY"
  ["GROQ_API_KEY"]="YOUR_GROQ_API_KEY"
  ["OPENROUTER_API_KEY"]="YOUR_OPENROUTER_KEY"
  ["PAYSTACK_SECRET_KEY"]="YOUR_PAYSTACK_SECRET_KEY"
  ["PAYSTACK_PUBLIC_KEY"]="YOUR_PAYSTACK_PUBLIC_KEY"
  ["RESEND_API_KEY"]="YOUR_RESEND_API_KEY"
)

for key in "${!ENV_VARS[@]}"; do
  value="${ENV_VARS[$key]}"
  echo "Setting $key..."
  curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT/env" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"value\":\"$value\",\"type\":\"encrypted\",\"target\":[\"production\",\"preview\",\"development\"]}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  {d.get(\"key\",\"?\")} - {d.get(\"value\",\"?\")[:20]}...' if 'key' in d else f'  Error: {d.get(\"error\",{}).get(\"message\",\"?\")}')" 2>/dev/null
done

echo ""
echo "Done! All environment variables set on Vercel."
echo "Redeploy with: npx vercel --prod"
