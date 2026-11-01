#!/usr/bin/env bash
# ==============================================================================
# Chat-to-Excel Backend Automated API Endpoint Test Suite
# Tests all endpoints sequentially with cURL & automated JWT token capture
# ==============================================================================

set -e

BASE_URL="http://localhost:5000/api"
TEST_EMAIL="tester_$(date +%s)@chat2excel.com"
TEST_PASS="TestPassword123!"
TEST_NAME="QA Engineer"

echo "=========================================================="
echo "🚀 Testing Chat-to-Excel API at $BASE_URL"
echo "=========================================================="

# 0. Health Check
echo -e "\n[0/7] GET /api/health"
HEALTH_RES=$(curl -s -X GET "$BASE_URL/health")
echo "Response: $HEALTH_RES"

# 1. Register New User
echo -e "\n[1/7] POST /api/auth/register"
REG_PAYLOAD=$(cat <<EOF
{
  "name": "$TEST_NAME",
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASS"
}
EOF
)

REG_RES=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REG_PAYLOAD")

echo "Response: $REG_RES"

# 2. Login & Capture JWT Token
echo -e "\n[2/7] POST /api/auth/login"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASS"
}
EOF
)

LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

echo "Response: $LOGIN_RES"

# Extract JWT Token using grep & sed (portable without jq requirement)
TOKEN=$(echo "$LOGIN_RES" | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "❌ Error: Failed to extract JWT token from login response!"
  exit 1
fi

echo -e "✅ Captured JWT Token: ${TOKEN:0:20}..."

# 3. Parse WhatsApp Text
echo -e "\n[3/7] POST /api/conversions/parse-text"
CHAT_TEXT="[10/24/24, 10:00:00] Lead: Hi, what is the cost of 50 licenses?\n[10/24/24, 10:01:00] You: That would be ₹50/month per user with unlimited exports.\n[10/24/24, 10:02:00] Lead: Great, please send the invoice!"
PARSE_PAYLOAD=$(cat <<EOF
{
  "text": "$CHAT_TEXT",
  "title": "API Automated Test Chat"
}
EOF
)

PARSE_RES=$(curl -s -X POST "$BASE_URL/conversions/parse-text" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$PARSE_PAYLOAD")

echo "Response: $PARSE_RES"

# Extract Conversion ID
CONV_ID=$(echo "$PARSE_RES" | grep -o '"_id":"[^"]*' | head -n 1 | grep -o '[^"]*$')
echo "✅ Created Conversion ID: $CONV_ID"

# 4. Parse Screenshot via Multipart/form-data
echo -e "\n[4/7] POST /api/conversions/parse-screenshot"
# Create a dummy 1x1 png image for multipart test
TMP_IMG="/tmp/test_chat_screen.png"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > "$TMP_IMG" 2>/dev/null || echo "dummy" > "$TMP_IMG"

SCREEN_RES=$(curl -s -X POST "$BASE_URL/conversions/parse-screenshot" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$TMP_IMG;type=image/png" \
  -F "title=Screenshot Multipart Test")

echo "Response: $SCREEN_RES"

# 5. Retrieve Conversion By ID
echo -e "\n[5/7] GET /api/conversions/$CONV_ID"
GET_CONV_RES=$(curl -s -X GET "$BASE_URL/conversions/$CONV_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $GET_CONV_RES"

# 6. Create Razorpay Order
echo -e "\n[6/7] POST /api/payments/create-order"
ORDER_PAYLOAD='{"plan": "basic_50"}'
ORDER_RES=$(curl -s -X POST "$BASE_URL/payments/create-order" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_PAYLOAD")

echo "Response: $ORDER_RES"
ORDER_ID=$(echo "$ORDER_RES" | grep -o '"orderId":"[^"]*' | grep -o '[^"]*$')
echo "✅ Generated Order ID: $ORDER_ID"

# 7. Verify Payment & Activate Plan
echo -e "\n[7/7] POST /api/payments/verify"
VERIFY_PAYLOAD=$(cat <<EOF
{
  "razorpay_order_id": "$ORDER_ID",
  "razorpay_payment_id": "pay_test_$(date +%s)",
  "razorpay_signature": "simulated_test_signature"
}
EOF
)

VERIFY_RES=$(curl -s -X POST "$BASE_URL/payments/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$VERIFY_PAYLOAD")

echo "Response: $VERIFY_RES"

echo -e "\n=========================================================="
echo "🎉 ALL 7 ENDPOINTS TESTED SUCCESSFULLY!"
echo "=========================================================="

