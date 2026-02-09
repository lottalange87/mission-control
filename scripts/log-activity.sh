#!/bin/bash
# Log an activity to Mission Control
# Usage: log-activity.sh <actionType> <details> <result>
SITE_URL="https://abundant-sardine-148.convex.site"
ACTION_TYPE="${1:-unknown}"
DETAILS="${2:-No details}"
RESULT="${3:-success}"

curl -s -X POST "$SITE_URL/log" \
  -H "Content-Type: application/json" \
  -d "{\"actionType\":\"$ACTION_TYPE\",\"details\":\"$DETAILS\",\"result\":\"$RESULT\"}" > /dev/null 2>&1 &
