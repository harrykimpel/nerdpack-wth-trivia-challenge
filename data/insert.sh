#!/bin/bash

curl -X POST "https://insights-collector.newrelic.com/v1/accounts/$NEW_RELIC_ACCOUNT_ID/events" \
  -H "Content-Type: application/json" \
  -H "Api-Key: $NEW_RELIC_LICENSE_KEY" \
  -d @trivia-teams.json 

curl -X POST "https://insights-collector.newrelic.com/v1/accounts/$NEW_RELIC_ACCOUNT_ID/events" \
  -H "Content-Type: application/json" \
  -H "Api-Key: $NEW_RELIC_LICENSE_KEY" \
  -d @trivia-board.json 