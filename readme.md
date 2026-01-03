# FinLy – Autonomous Finance Agent

## Setup
```bash
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt

# FinLy - Complete Setup Guide

## System Overview
S
Your FinLy application now has a **3-tier architecture**:

```
┌──────────────────────┐
│  React Frontend      │  Port 3000
│  (Vite + React)      │
└──────┬───────────────┘
       │
       ├─ Fetch salaries, bills, receivables
       ├─ Submit analysis requests
       └─ Display results
       │
       ▼
┌──────────────────────┐
│  Node.js Backend     │  Port 8000
│  (Express + MongoDB) │
└──────┬───────────────┘
       │
       ├─ CRUD operations for financial data
       ├─ Store analysis results
       ├─ Manage memory (replaces client_memory.json)
       └─ Forward analysis to Python backend
       │
       ▼
┌──────────────────────┐
│  Python Backend      │  Port 8001
│  (FastAPI + Agents)  │
└──────────────────────┘
       │
       └─ LangGraph agent logic
       └─ Risk analysis, Decision, Action
```

## Prerequisites

1. **Node.js** (v18+)
2. **Python** (v3.10+)
3. **MongoDB** (local or Atlas)

## Setup Instructions

### 1. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB and start the service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string (e.g., `mongodb+srv://username:password@cluster.mongodb.net/finly`)

### 2. Backend Setup

```bash
cd backend

# The setup script creates .env from .env.example
.\setup.bat

# Edit .env and add your MongoDB URI
notepad .env
```

Update `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/finly  # or your Atlas URI
PYTHON_BACKEND_URL=http://localhost:8001
PORT=8000
```

### 3. Python Backend Setup (Agent Logic)

The Python backend runs on port **8001** now (changed from 8000).

```bash
# From root directory
python -m app.server
```

### 4. Node Backend Start

```bash
cd backend
npm run dev
```

You should see:
```
🚀 FinLy Backend running on port 8000
✅ Connected to MongoDB
📊 MongoDB URI: mongodb://localhost:27017/finly
```

### 5. Frontend Start

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`

## Database Collections

The Node backend automatically creates these collections:

### Financial Data
- **salaries**: `{ employee, amount, due_in_days, createdAt }`
- **bills**: `{ type, amount, due_in_days, createdAt }`
- **receivables**: `{ client, email, amount, due_in_days, createdAt }`

### Agent Data
- **memories**: Replaces `client_memory.json`
  ```json
  {
    "timestamp": "2025-12-29T...",
    "clients": ["acme", "..."],
    "strategy": "COLLECT_RECEIVABLE",
    "action_taken": "EMAIL_PAYMENT_REMINDER_MULTI",
    "result": "SENT",
    "details": { ... }
  }
  ```

- **analysisresults**: Stores complete analysis outputs
  ```json
  {
    "risk_analysis": { ... },
    "sub_goal": { ... },
    "decision": { ... },
    "action_log": { ... },
    "memory_updates": { ... },
    "createdAt": "2025-12-29T..."
  }
  ```

## API Endpoints

### Data Management (Port 8000)

```bash
# Salaries
GET    /api/salaries
POST   /api/salaries
DELETE /api/salaries/:id

# Bills
GET    /api/bills
POST   /api/bills
DELETE /api/bills/:id

# Receivables
GET    /api/receivables
POST   /api/receivables
DELETE /api/receivables/:id

# Memory
GET    /api/memory
POST   /api/memory

# Analysis Results
GET    /api/analysis-results
GET    /api/analysis-results/latest
```

### Analysis (Port 8000)

```bash
POST /run-analysis
```

Request body:
```json
{
  "cash_balance": 150000,
  "preferences": {
    "dont_delay_salaries": true,
    "avoid_vendor_damage": true
  }
}
```

The analysis endpoint:
1. Fetches salaries, bills, receivables from MongoDB
2. Calculates financial metrics
3. Calls Python backend (port 8001) for agent logic
4. Saves results and memory to MongoDB
5. Returns analysis to frontend

## Running the Complete Stack

Open **3 terminals**:

**Terminal 1 - Python Backend**:
```bash
python -m app.server
```

**Terminal 2 - Node Backend**:
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend**:
```bash
cd frontend
npm run dev
```

## Viewing Your Data

### Using MongoDB Compass

1. Download: https://www.mongodb.com/try/download/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse database: `finly`
4. View collections: salaries, bills, receivables, memories, analysisresults

### Using MongoDB Shell

```bash
mongosh
use finly
db.salaries.find().pretty()
db.memories.find().sort({timestamp: -1}).limit(5)
db.analysisresults.find().sort({createdAt: -1}).limit(1)
```

## Migrating Existing Data

If you have existing data in `client_memory.json`:

```bash
# Create a migration script
node migrate-memory.js
```

## Troubleshooting

### MongoDB Connection Error

```
❌ MongoDB connection error: MongooseServerSelectionError
```

**Fix**: Ensure MongoDB is running
```bash
mongod
```

### Python Backend Not Found

```
❌ Python backend error: ECONNREFUSED 127.0.0.1:8001
```

**Fix**: Start Python backend
```bash
python -m app.server
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::8000
```

**Fix**: Kill the process or change PORT in `.env`

## Next Steps

1. โœ… MongoDB is now storing all your data persistently
2. โœ… `client_memory.json` is replaced with `memories` collection
3. โœ… Deletion works via DELETE endpoints
4. โœ… All analysis results are saved automatically
5. โœ… Frontend can fetch historical data from MongoDB

Your FinLy system is now fully operational with MongoDB! ๐Ÿš€
