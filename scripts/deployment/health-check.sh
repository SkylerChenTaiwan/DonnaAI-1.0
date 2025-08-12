#!/bin/bash

# Health Check Script for DonnaAI
# Usage: ./health-check.sh [environment]
# Environment: staging | production | local

set -e

# Configuration
ENVIRONMENT=${1:-staging}
MAX_RETRIES=5
RETRY_DELAY=5
TIMEOUT=30

# URLs based on environment
case $ENVIRONMENT in
  production)
    BASE_URL="https://donnaai.com"
    ;;
  staging)
    BASE_URL="https://staging.donnaai.com"
    ;;
  local)
    BASE_URL="http://localhost:3002"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  local status=$1
  local message=$2
  
  case $status in
    success)
      echo -e "${GREEN}✓${NC} $message"
      ;;
    error)
      echo -e "${RED}✗${NC} $message"
      ;;
    warning)
      echo -e "${YELLOW}⚠${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local expected_status=${2:-200}
  local description=$3
  
  local url="${BASE_URL}${endpoint}"
  local response_code
  local retry_count=0
  
  while [ $retry_count -lt $MAX_RETRIES ]; do
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" || echo "000")
    
    if [ "$response_code" = "$expected_status" ]; then
      print_status "success" "$description: $url (${response_code})"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    
    if [ $retry_count -lt $MAX_RETRIES ]; then
      print_status "warning" "$description: Retry $retry_count/$MAX_RETRIES (got ${response_code}, expected ${expected_status})"
      sleep $RETRY_DELAY
    fi
  done
  
  print_status "error" "$description: Failed after $MAX_RETRIES retries (got ${response_code}, expected ${expected_status})"
  return 1
}

# Function to check API health
check_api_health() {
  local endpoint="/api/health"
  local url="${BASE_URL}${endpoint}"
  
  local response=$(curl -s --max-time $TIMEOUT "$url" || echo "{}")
  local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  
  if [ "$status" = "healthy" ]; then
    print_status "success" "API Health: Healthy"
    
    # Check individual services
    local firebase_status=$(echo "$response" | grep -o '"firebase":"[^"]*"' | cut -d'"' -f4)
    local database_status=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$firebase_status" = "connected" ]; then
      print_status "success" "  Firebase: Connected"
    else
      print_status "warning" "  Firebase: $firebase_status"
    fi
    
    if [ "$database_status" = "connected" ]; then
      print_status "success" "  Database: Connected"
    else
      print_status "warning" "  Database: $database_status"
    fi
    
    return 0
  else
    print_status "error" "API Health: $status"
    return 1
  fi
}

# Function to check response time
check_response_time() {
  local endpoint=$1
  local max_time=${2:-3000}
  local description=$3
  
  local url="${BASE_URL}${endpoint}"
  local response_time
  
  response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$url" || echo "999")
  response_time_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
  
  if [ "$response_time_ms" -lt "$max_time" ]; then
    print_status "success" "$description: ${response_time_ms}ms (< ${max_time}ms)"
    return 0
  else
    print_status "error" "$description: ${response_time_ms}ms (> ${max_time}ms)"
    return 1
  fi
}

# Function to check static assets
check_static_assets() {
  local assets=(
    "/favicon.ico"
    "/manifest.json"
    "/robots.txt"
  )
  
  local failed=0
  
  for asset in "${assets[@]}"; do
    if ! check_endpoint "$asset" 200 "Static asset"; then
      failed=$((failed + 1))
    fi
  done
  
  return $failed
}

# Function to check critical features
check_critical_features() {
  local features=(
    "/" "200" "Home page"
    "/login" "200" "Login page"
    "/api/auth/session" "401" "Auth endpoint"
  )
  
  local failed=0
  local i=0
  
  while [ $i -lt ${#features[@]} ]; do
    endpoint="${features[$i]}"
    expected="${features[$((i+1))]}"
    description="${features[$((i+2))]}"
    
    if ! check_endpoint "$endpoint" "$expected" "$description"; then
      failed=$((failed + 1))
    fi
    
    i=$((i+3))
  done
  
  return $failed
}

# Main execution
echo "========================================="
echo "Health Check for $ENVIRONMENT environment"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

total_checks=0
failed_checks=0

# Check main endpoint
echo "Checking main endpoint..."
if ! check_endpoint "/" 200 "Main page"; then
  failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""

# Check API health
echo "Checking API health..."
if ! check_api_health; then
  failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""

# Check response times
echo "Checking response times..."
if ! check_response_time "/" 3000 "Home page response time"; then
  failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

if ! check_response_time "/api/health" 1000 "API health response time"; then
  failed_checks=$((failed_checks + 1))
fi
total_checks=$((total_checks + 1))

echo ""

# Check static assets
echo "Checking static assets..."
check_static_assets
failed_checks=$((failed_checks + $?))
total_checks=$((total_checks + 3))

echo ""

# Check critical features
echo "Checking critical features..."
check_critical_features
failed_checks=$((failed_checks + $?))
total_checks=$((total_checks + 3))

echo ""
echo "========================================="

# Summary
if [ $failed_checks -eq 0 ]; then
  print_status "success" "All health checks passed! ($total_checks/$total_checks)"
  echo "Environment: $ENVIRONMENT is HEALTHY"
  exit 0
else
  print_status "error" "Health checks failed: $failed_checks/$total_checks"
  echo "Environment: $ENVIRONMENT is UNHEALTHY"
  exit 1
fi