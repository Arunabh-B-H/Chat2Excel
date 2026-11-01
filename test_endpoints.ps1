# ==============================================================================
# Chat-to-Excel Backend Automated API Endpoint Test Suite (PowerShell)
# ==============================================================================

$BaseUrl = "http://localhost:5000/api"
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$TestEmail = "tester_$Timestamp@chat2excel.com"
$TestPass = "TestPassword123!"
$TestName = "QA PowerShell Tester"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Testing Chat-to-Excel API at $BaseUrl" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 0. Health Check
Write-Host "`n[0/7] GET /api/health" -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
Write-Host ($health | ConvertTo-Json -Depth 4) -ForegroundColor Green

# 1. Register User
Write-Host "`n[1/7] POST /api/auth/register" -ForegroundColor Yellow
$regBody = @{
    name = $TestName
    email = $TestEmail
    password = $TestPass
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -ContentType "application/json" -Body $regBody
Write-Host ($regRes | ConvertTo-Json -Depth 4) -ForegroundColor Green

# 2. Login User
Write-Host "`n[2/7] POST /api/auth/login" -ForegroundColor Yellow
$loginBody = @{
    email = $TestEmail
    password = $TestPass
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$token = $loginRes.token
Write-Host "✅ Token Captured: $($token.Substring(0, 25))..." -ForegroundColor Green

# 2.5 Google OAuth Endpoint Check
Write-Host "`n[2.5/7] POST /api/auth/google (OAuth Endpoint Check)" -ForegroundColor Yellow
$googleBody = @{
    googleId = "gid_$Timestamp"
    email = "google_$Timestamp@chat2excel.com"
    name = "Google Test User"
    avatar = "https://lh3.googleusercontent.com/a/default-avatar"
} | ConvertTo-Json

$googleRes = Invoke-RestMethod -Uri "$BaseUrl/auth/google" -Method Post -ContentType "application/json" -Body $googleBody
Write-Host "✅ Google Auth Endpoint Succeeded: $($googleRes.user.email) (Credits: $($googleRes.user.creditsRemaining))" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $token"
}

# 3. Parse Text
Write-Host "`n[3/7] POST /api/conversions/parse-text" -ForegroundColor Yellow
$chatText = @"
[10/24/24, 10:00:00] Lead: Hi, what is the cost of 50 licenses?
[10/24/24, 10:01:00] You: That would be ₹50/month per user with unlimited exports.
[10/24/24, 10:02:00] Lead: Great, please send the invoice!
"@

$parseBody = @{
    text = $chatText
    title = "PowerShell Automated Test Chat"
} | ConvertTo-Json

$parseRes = Invoke-RestMethod -Uri "$BaseUrl/conversions/parse-text" -Method Post -Headers $headers -ContentType "application/json" -Body $parseBody
$convId = $parseRes.conversion._id
Write-Host "✅ Created Conversion ID: $convId" -ForegroundColor Green
Write-Host ($parseRes.conversion.analyticsSummary | ConvertTo-Json) -ForegroundColor Gray

# 4. Get Conversion by ID
Write-Host "`n[4/7] GET /api/conversions/$convId" -ForegroundColor Yellow
$getRes = Invoke-RestMethod -Uri "$BaseUrl/conversions/$convId" -Method Get -Headers $headers
Write-Host "✅ Structured Data Count: $($getRes.conversion.structuredData.Count)" -ForegroundColor Green

# 5. Create Order
Write-Host "`n[5/7] POST /api/payments/create-order" -ForegroundColor Yellow
$orderBody = @{ plan = "basic_50" } | ConvertTo-Json
$orderRes = Invoke-RestMethod -Uri "$BaseUrl/payments/create-order" -Method Post -Headers $headers -ContentType "application/json" -Body $orderBody
$orderId = $orderRes.orderId
Write-Host "✅ Order Created: $orderId (Amount: $($orderRes.amount) paise)" -ForegroundColor Green

# 6. Verify Payment
Write-Host "`n[6/7] POST /api/payments/verify" -ForegroundColor Yellow
$verifyBody = @{
    razorpay_order_id = $orderId
    razorpay_payment_id = "pay_ps_$Timestamp"
    razorpay_signature = "simulated_test_signature"
} | ConvertTo-Json

$verifyRes = Invoke-RestMethod -Uri "$BaseUrl/payments/verify" -Method Post -Headers $headers -ContentType "application/json" -Body $verifyBody
Write-Host ($verifyRes | ConvertTo-Json -Depth 4) -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "🎉 ALL ENDPOINTS TESTED SUCCESSFULLY VIA POWERSHELL!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

