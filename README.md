# WTH Trivia Challenge — New Relic Nerdpack

A Jeopardy-style trivia game that runs inside the New Relic platform as a Nerdpack. Teams and trivia board data are loaded from New Relic custom events via NRQL.

## Prerequisites

- Node.js 18+
- [New Relic CLI (`nr1`)](https://developer.newrelic.com/build-tools/new-relic-one-cli/)
- A New Relic account with an Ingest License key and a User API key

## Quick Start

```bash
cd nerdpack-trivia-challenge

# Install dependencies
npm install

# Generate a unique UUID for this Nerdpack
nr1 nerdpack:uuid -gf

# Serve locally (opens in New Relic at https://one.newrelic.com/?nerdpacks=local)
nr1 nerdpack:serve
```

## Seeding Custom Events

The game reads from two custom event types in your New Relic account. You need to seed them using the [Event API](https://docs.newrelic.com/docs/data-apis/ingest-apis/event-api/introduction-event-api/).

### 1. TriviaTeam Events

Each event needs a `teamName` attribute:

```bash
export NEW_RELIC_ACCOUNT_ID="YOUR_ACCOUNT_ID"
export NEW_RELIC_INGEST_KEY="YOUR_INGEST_LICENSE_KEY"

curl -X POST "https://insights-collector.newrelic.com/v1/accounts/${NEW_RELIC_ACCOUNT_ID}/events" \
  -H "Content-Type: application/json" \
  -H "Api-Key: ${NEW_RELIC_INGEST_KEY}" \
  -d '[
    { "eventType": "TriviaTeam", "teamName": "Team Azure" },
    { "eventType": "TriviaTeam", "teamName": "Team DevRel" },
    { "eventType": "TriviaTeam", "teamName": "Team GTM-CA" }
  ]'
```

### 2. TriviaBoard Events

Each event needs `category`, `value`, `prompt`, and `answer` attributes:

```bash
curl -X POST "https://insights-collector.newrelic.com/v1/accounts/${NEW_RELIC_ACCOUNT_ID}/events" \
  -H "Content-Type: application/json" \
  -H "Api-Key: ${NEW_RELIC_INGEST_KEY}" \
  -d '[
    {
      "eventType": "TriviaBoard",
      "category": "NRQL Basics",
      "value": 100,
      "prompt": "What keyword is used to filter results in NRQL?",
      "answer": "WHERE"
    },
    {
      "eventType": "TriviaBoard",
      "category": "NRQL Basics",
      "value": 200,
      "prompt": "What NRQL function returns the average of a numeric attribute?",
      "answer": "average()"
    },
    {
      "eventType": "TriviaBoard",
      "category": "Observability 101",
      "value": 100,
      "prompt": "What are the three pillars of observability?",
      "answer": "Metrics, Logs, and Traces"
    },
    {
      "eventType": "TriviaBoard",
      "category": "Observability 101",
      "value": 200,
      "prompt": "What does APM stand for?",
      "answer": "Application Performance Monitoring"
    }
  ]'
```

> **Tip:** You can send up to 1 MB or ~1000 events per POST request. Send one request per category or batch them all together.

### Bulk Seed Script

The `data/` directory includes pre-built JSON files and a convenience script to seed everything at once:

```
data/
├── insert.sh           # Sends both files to the Event API
├── trivia-teams.json   # TriviaTeam events
└── trivia-board.json   # TriviaBoard events
```

Run it from the `data/` directory:

```bash
export NEW_RELIC_ACCOUNT_ID="YOUR_ACCOUNT_ID"
export NEW_RELIC_LICENSE_KEY="YOUR_INGEST_LICENSE_KEY"

cd data
bash insert.sh
```

Edit the JSON files to customize teams and questions before running the script.

### Verifying Seeded Data

Run these NRQL queries in the New Relic Query Builder to verify:

```sql
-- Check teams
FROM TriviaTeam SELECT uniques(teamName) SINCE 1 week ago

-- Check board questions
FROM TriviaBoard SELECT latest(prompt), latest(answer) FACET category, value SINCE 1 week ago LIMIT MAX
```

## NRQL Queries Used

The Nerdpack uses NerdGraph to run these NRQL queries:

| Data        | Query                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| Teams       | `FROM TriviaTeam SELECT uniques(teamName) SINCE 1 week ago LIMIT MAX`                      |
| Board       | `FROM TriviaBoard SELECT latest(prompt), latest(answer) FACET category, value SINCE 1 week ago LIMIT MAX` |

Using `latest()` with `FACET` ensures deduplication — if you update a question by sending a new event with the same `category` + `value`, the latest prompt/answer is used.

## Deploying

```bash
# Publish the Nerdpack to your account
nr1 nerdpack:publish

# Deploy to the stable channel
nr1 nerdpack:deploy -c STABLE

# Subscribe your account
nr1 nerdpack:subscribe -c STABLE
```

After subscribing, the "WTH Trivia Challenge" launcher will appear in the New Relic Apps page.

## Project Structure

```
nerdpack-trivia-challenge/
├── nr1.json                          # Nerdpack manifest
├── package.json
├── launchers/
│   └── trivia-challenge/
│       └── nr1.json                  # Launcher config
└── nerdlets/
    └── trivia-challenge/
        ├── nr1.json                  # Nerdlet config
        ├── index.js                  # Entry point, state management, data fetching
        ├── styles.scss               # All styles (dark theme, orbital board)
        └── components/
            ├── SetupPhase.js         # Team editing, options, start
            ├── BoardPhase.js         # Orbital board layout
            ├── QuestionPhase.js      # Question, buzzer, answer, scoring
            └── WinnerPhase.js        # Podium and leaderboard
```

## Game Flow

1. **Setup** — Edit team names (loaded from `TriviaTeam` events), configure timer/buzzer, start game
2. **Board** — Orbital layout showing all categories and point values; click a tile to select a question
3. **Question** — Displays the prompt; optionally use buzzer and timer
4. **Answer** — Reveals the answer; award or penalize points per team
5. **Winner** — Podium display with rankings; option to play again
