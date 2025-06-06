#!/bin/bash

echo "Testing Quiz Platform Security Features"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Function to make API calls and check response
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local expected_status=$5
    local description=$6

    echo -n "Testing $description... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:7000$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "http://localhost:7000$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓${NC}"
        echo "Response: $body"
    else
        echo -e "${RED}✗${NC}"
        echo "Expected status $expected_status but got $status_code"
        echo "Response: $body"
    fi
    echo
}

# 1. Register an instructor
echo "1. Testing User Registration"
test_endpoint "POST" "/api/users/register" \
    '{"email":"instructor@test.com", "password":"test123", "name":"Test Instructor", "role":"INSTRUCTOR"}' \
    "" 200 "Register instructor"

# Extract token from registration response
instructor_token=$(curl -s -X POST "http://localhost:7000/api/users/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"instructor@test.com", "password":"test123", "name":"Test Instructor", "role":"INSTRUCTOR"}' \
    | jq -r '.token')

# 2. Register a student
echo "2. Testing Student Registration"
test_endpoint "POST" "/api/users/register" \
    '{"email":"student@test.com", "password":"test123", "name":"Test Student", "role":"STUDENT"}' \
    "" 200 "Register student"

# Extract token from student registration
student_token=$(curl -s -X POST "http://localhost:7000/api/users/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"student@test.com", "password":"test123", "name":"Test Student", "role":"STUDENT"}' \
    | jq -r '.token')

# 3. Test login
echo "3. Testing Login"
test_endpoint "POST" "/api/users/login" \
    '{"email":"instructor@test.com", "password":"test123"}' \
    "" 200 "Login with correct credentials"

test_endpoint "POST" "/api/users/login" \
    '{"email":"instructor@test.com", "password":"wrongpassword"}' \
    "" 401 "Login with incorrect credentials"

# 4. Test protected routes
echo "4. Testing Protected Routes"
test_endpoint "GET" "/api/users/1" "" "" 401 "Access protected route without token"

# 5. Test instructor-only routes
echo "5. Testing Instructor-Only Routes"
test_endpoint "POST" "/api/quizzes" \
    '{"title":"Test Quiz", "description":"Test Description"}' \
    "$instructor_token" 200 "Create quiz as instructor"

test_endpoint "POST" "/api/quizzes" \
    '{"title":"Test Quiz", "description":"Test Description"}' \
    "$student_token" 403 "Create quiz as student"

# 6. Test student-only routes
echo "6. Testing Student-Only Routes"
test_endpoint "GET" "/api/quizzes/student" "" "$student_token" 200 "Access student quizzes as student"
test_endpoint "GET" "/api/quizzes/student" "" "$instructor_token" 403 "Access student quizzes as instructor"

# 7. Test profile access
echo "7. Testing Profile Access"
test_endpoint "GET" "/api/users/1" "" "$instructor_token" 200 "Access own profile"
test_endpoint "GET" "/api/users/2" "" "$student_token" 403 "Access other user's profile as student"

echo "Testing Complete!" 