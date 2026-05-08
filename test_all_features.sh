#!/bin/bash

API_URL="http://localhost:8000"
TEST_RESULTS="/tmp/testing_report.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Clear previous results
> "$TEST_RESULTS"

log_test() {
  local status=$1
  local feature=$2
  local detail=$3

  if [ "$status" = "PASS" ]; then
    echo -e "${GREEN}✓${NC} $feature"
  elif [ "$status" = "FAIL" ]; then
    echo -e "${RED}✗${NC} $feature"
  elif [ "$status" = "WARN" ]; then
    echo -e "${YELLOW}⚠${NC} $feature"
  else
    echo -e "${BLUE}ℹ${NC} $feature"
  fi

  if [ ! -z "$detail" ]; then
    echo "  → $detail" | tee -a "$TEST_RESULTS"
  fi
  echo "" | tee -a "$TEST_RESULTS"
}

echo "========================================" | tee "$TEST_RESULTS"
echo "VETERINARY CLINIC - COMPREHENSIVE TEST" | tee -a "$TEST_RESULTS"
echo "========================================" | tee -a "$TEST_RESULTS"
echo "" | tee -a "$TEST_RESULTS"

# Test 1: Health Check
echo "=== Testing Backend Health ===" | tee -a "$TEST_RESULTS"
HEALTH=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH" | tail -1)
BODY=$(echo "$HEALTH" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  log_test "PASS" "Backend Health Check" "Status: 200"
else
  log_test "FAIL" "Backend Health Check" "Status: $HTTP_CODE"
fi

# Test 2: Authentication Routes
echo "=== Testing Authentication ===" | tee -a "$TEST_RESULTS"

# Register test user
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testvet'$(date +%s)'@clinic.local",
    "password": "TestPass123!",
    "full_name": "Test Veterinarian",
    "role": "veterinarian",
    "branch_id": 1,
    "specialization": "General Practice"
  }')

REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -1)
if [ "$REGISTER_CODE" = "201" ] || [ "$REGISTER_CODE" = "200" ]; then
  log_test "PASS" "User Registration" "Status: $REGISTER_CODE"
else
  log_test "FAIL" "User Registration" "Status: $REGISTER_CODE"
fi

# Test 3: List Branches
echo "=== Testing Branch Operations ===" | tee -a "$TEST_RESULTS"
BRANCHES=$(curl -s -w "\n%{http_code}" "$API_URL/branches")
BRANCH_CODE=$(echo "$BRANCHES" | tail -1)

if [ "$BRANCH_CODE" = "200" ]; then
  BRANCH_COUNT=$(echo "$BRANCHES" | head -n -1 | grep -o '"branch_id"' | wc -l)
  log_test "PASS" "List Branches" "Status: 200 (Found $BRANCH_COUNT branches)"
else
  log_test "FAIL" "List Branches" "Status: $BRANCH_CODE"
fi

# Test 4: List Veterinarians
echo "=== Testing Veterinarian Operations ===" | tee -a "$TEST_RESULTS"
VETS=$(curl -s -w "\n%{http_code}" "$API_URL/veterinarians")
VETS_CODE=$(echo "$VETS" | tail -1)

if [ "$VETS_CODE" = "200" ]; then
  VET_COUNT=$(echo "$VETS" | head -n -1 | grep -o '"user_id"' | wc -l)
  log_test "PASS" "List Veterinarians" "Status: 200 (Found $VET_COUNT vets)"
else
  log_test "FAIL" "List Veterinarians" "Status: $VETS_CODE"
fi

# Test 5: List Pets
echo "=== Testing Pet Operations ===" | tee -a "$TEST_RESULTS"
PETS=$(curl -s -w "\n%{http_code}" "$API_URL/pets")
PETS_CODE=$(echo "$PETS" | tail -1)

if [ "$PETS_CODE" = "200" ] || [ "$PETS_CODE" = "401" ]; then
  if [ "$PETS_CODE" = "200" ]; then
    log_test "PASS" "List Pets" "Status: 200"
  else
    log_test "WARN" "List Pets" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Pets" "Status: $PETS_CODE"
fi

# Test 6: List Appointments
echo "=== Testing Appointment Operations ===" | tee -a "$TEST_RESULTS"
APPTS=$(curl -s -w "\n%{http_code}" "$API_URL/appointments")
APPTS_CODE=$(echo "$APPTS" | tail -1)

if [ "$APPTS_CODE" = "200" ] || [ "$APPTS_CODE" = "401" ]; then
  if [ "$APPTS_CODE" = "200" ]; then
    log_test "PASS" "List Appointments" "Status: 200"
  else
    log_test "WARN" "List Appointments" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Appointments" "Status: $APPTS_CODE"
fi

# Test 7: List Prescriptions
echo "=== Testing Prescription Operations ===" | tee -a "$TEST_RESULTS"
PRESC=$(curl -s -w "\n%{http_code}" "$API_URL/prescriptions")
PRESC_CODE=$(echo "$PRESC" | tail -1)

if [ "$PRESC_CODE" = "200" ] || [ "$PRESC_CODE" = "401" ]; then
  if [ "$PRESC_CODE" = "200" ]; then
    log_test "PASS" "List Prescriptions" "Status: 200"
  else
    log_test "WARN" "List Prescriptions" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Prescriptions" "Status: $PRESC_CODE"
fi

# Test 8: List Vaccinations
echo "=== Testing Vaccination Operations ===" | tee -a "$TEST_RESULTS"
VACS=$(curl -s -w "\n%{http_code}" "$API_URL/vaccinations")
VACS_CODE=$(echo "$VACS" | tail -1)

if [ "$VACS_CODE" = "200" ] || [ "$VACS_CODE" = "401" ]; then
  if [ "$VACS_CODE" = "200" ]; then
    log_test "PASS" "List Vaccinations" "Status: 200"
  else
    log_test "WARN" "List Vaccinations" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Vaccinations" "Status: $VACS_CODE"
fi

# Test 9: List Inventory
echo "=== Testing Inventory Operations ===" | tee -a "$TEST_RESULTS"
INV=$(curl -s -w "\n%{http_code}" "$API_URL/inventory")
INV_CODE=$(echo "$INV" | tail -1)

if [ "$INV_CODE" = "200" ] || [ "$INV_CODE" = "401" ]; then
  if [ "$INV_CODE" = "200" ]; then
    log_test "PASS" "List Inventory" "Status: 200"
  else
    log_test "WARN" "List Inventory" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Inventory" "Status: $INV_CODE"
fi

# Test 10: List Billing
echo "=== Testing Billing Operations ===" | tee -a "$TEST_RESULTS"
BILL=$(curl -s -w "\n%{http_code}" "$API_URL/billing")
BILL_CODE=$(echo "$BILL" | tail -1)

if [ "$BILL_CODE" = "200" ] || [ "$BILL_CODE" = "401" ]; then
  if [ "$BILL_CODE" = "200" ]; then
    log_test "PASS" "List Billing/Invoices" "Status: 200"
  else
    log_test "WARN" "List Billing/Invoices" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Billing/Invoices" "Status: $BILL_CODE"
fi

# Test 11: List Referrals
echo "=== Testing Referral Operations ===" | tee -a "$TEST_RESULTS"
REFS=$(curl -s -w "\n%{http_code}" "$API_URL/referrals")
REFS_CODE=$(echo "$REFS" | tail -1)

if [ "$REFS_CODE" = "200" ] || [ "$REFS_CODE" = "401" ]; then
  if [ "$REFS_CODE" = "200" ]; then
    log_test "PASS" "List Referrals" "Status: 200"
  else
    log_test "WARN" "List Referrals" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Referrals" "Status: $REFS_CODE"
fi

# Test 12: List Evaluations
echo "=== Testing Evaluation Operations ===" | tee -a "$TEST_RESULTS"
EVALS=$(curl -s -w "\n%{http_code}" "$API_URL/evaluations")
EVALS_CODE=$(echo "$EVALS" | tail -1)

if [ "$EVALS_CODE" = "200" ] || [ "$EVALS_CODE" = "401" ]; then
  if [ "$EVALS_CODE" = "200" ]; then
    log_test "PASS" "List Evaluations" "Status: 200"
  else
    log_test "WARN" "List Evaluations" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Evaluations" "Status: $EVALS_CODE"
fi

# Test 13: List Boarding
echo "=== Testing Boarding Operations ===" | tee -a "$TEST_RESULTS"
BOARD=$(curl -s -w "\n%{http_code}" "$API_URL/boarding")
BOARD_CODE=$(echo "$BOARD" | tail -1)

if [ "$BOARD_CODE" = "200" ] || [ "$BOARD_CODE" = "401" ]; then
  if [ "$BOARD_CODE" = "200" ]; then
    log_test "PASS" "List Boarding" "Status: 200"
  else
    log_test "WARN" "List Boarding" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Boarding" "Status: $BOARD_CODE"
fi

# Test 14: Vaccination Plans
echo "=== Testing Vaccination Plan Operations ===" | tee -a "$TEST_RESULTS"
VPLAN=$(curl -s -w "\n%{http_code}" "$API_URL/vaccination-plans")
VPLAN_CODE=$(echo "$VPLAN" | tail -1)

if [ "$VPLAN_CODE" = "200" ] || [ "$VPLAN_CODE" = "401" ]; then
  if [ "$VPLAN_CODE" = "200" ]; then
    log_test "PASS" "List Vaccination Plans" "Status: 200"
  else
    log_test "WARN" "List Vaccination Plans" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Vaccination Plans" "Status: $VPLAN_CODE"
fi

# Test 15: Medical Records
echo "=== Testing Medical Records ===" | tee -a "$TEST_RESULTS"
MR=$(curl -s -w "\n%{http_code}" "$API_URL/medical-records")
MR_CODE=$(echo "$MR" | tail -1)

if [ "$MR_CODE" = "200" ] || [ "$MR_CODE" = "401" ]; then
  if [ "$MR_CODE" = "200" ]; then
    log_test "PASS" "List Medical Records" "Status: 200"
  else
    log_test "WARN" "List Medical Records" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Medical Records" "Status: $MR_CODE"
fi

# Test 16: Waste Logs
echo "=== Testing Waste Logs ===" | tee -a "$TEST_RESULTS"
WL=$(curl -s -w "\n%{http_code}" "$API_URL/waste-logs")
WL_CODE=$(echo "$WL" | tail -1)

if [ "$WL_CODE" = "200" ] || [ "$WL_CODE" = "401" ]; then
  if [ "$WL_CODE" = "200" ]; then
    log_test "PASS" "List Waste Logs" "Status: 200"
  else
    log_test "WARN" "List Waste Logs" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Waste Logs" "Status: $WL_CODE"
fi

# Test 17: Reports
echo "=== Testing Reports ===" | tee -a "$TEST_RESULTS"
REP=$(curl -s -w "\n%{http_code}" "$API_URL/reports")
REP_CODE=$(echo "$REP" | tail -1)

if [ "$REP_CODE" = "200" ] || [ "$REP_CODE" = "401" ]; then
  if [ "$REP_CODE" = "200" ]; then
    log_test "PASS" "List Reports" "Status: 200"
  else
    log_test "WARN" "List Reports" "Requires authentication (Status: 401)"
  fi
else
  log_test "FAIL" "List Reports" "Status: $REP_CODE"
fi

echo "" | tee -a "$TEST_RESULTS"
echo "========================================" | tee -a "$TEST_RESULTS"
echo "Test Results Summary saved to: $TEST_RESULTS" | tee -a "$TEST_RESULTS"
echo "========================================" | tee -a "$TEST_RESULTS"
