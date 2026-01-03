# FinLy Backend - Node.js + MongoDB

This is the Node.js backend for FinLy that handles data persistence in MongoDB and communicates with the Python agent backend.

## Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 3000)
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  Node.js Backend    │  (Port 8000)
│  - MongoDB CRUD     │
│  - Data Management  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Python Backend     │  (Port 8001)
│  - Agent Logic      │
│  - LangGraph        │
└─────────────────────┘
```

## Collections

The backend creates the following MongoDB collections:

- **salaries**: Employee salary obligations
- **bills**: Fixed bill payments
- **receivables**: Client receivables
- **memories**: Agent interaction history (replaces client_memory.json)
- **analysisresults**: Stores all analysis run outputs

## Setup

1. **Install Dependencies**:
```bash
cd backend
npm install
```

2. **Configure MongoDB**:
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Start the Backend**:
```bash
npm run dev
```

## API Endpoints

### Data Management

- `GET /api/salaries` - Get all salaries
- `POST /api/salaries` - Create new salary
- `DELETE /api/salaries/:id` - Delete salary

- `GET /api/bills` - Get all bills
- `POST /api/bills` - Create new bill
- `DELETE /api/bills/:id` - Delete bill

- `GET /api/receivables` - Get all receivables
- `POST /api/receivables` - Create new receivable
- `DELETE /api/receivables/:id` - Delete receivable

### Memory & Results

- `GET /api/memory` - Get all memory records
- `POST /api/memory` - Add memory record
- `GET /api/analysis-results` - Get all analysis results
- `GET /api/analysis-results/latest` - Get latest analysis

### Analysis

- `POST /run-analysis` - Run financial analysis
  - Fetches data from MongoDB
  - Calls Python backend for agent logic
  - Saves results and memory to MongoDB

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/finly
PYTHON_BACKEND_URL=http://localhost:8001
PORT=8000
```

## Usage with Python Backend

Ensure the Python backend is also running:

```bash
# In the root directory
python -m app.server
```

The Node backend will proxy analysis requests to the Python backend and handle all data persistence in MongoDB.
