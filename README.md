# AI Skill Indicator System

An AI-based system that helps organizations assess employee skill levels, find skill gaps, and recommend courses. Built as an academic project.

## How It Works

- **Employees** fill out their own skill profiles.
- **Managers** rate employees on the skills required for their designation.
- **AI prediction engine** combines both inputs to generate skill scores, identify gaps, and recommend courses.
- **HR** creates accounts (there is no public registration) and views organization-wide analytics.

### ML Strategy

1. **Bootstrap formula** (used at the start): Manager Rating x 60% + Profile Points x 40%.
2. **RandomForest model** (scikit-learn): the system switches to it automatically once 30-50 real records have been collected.

## User Roles

| Role | What they can do |
|------|------------------|
| Employee | Fill profile, view predicted skill scores, gaps and recommended courses |
| Manager | Review and rate employees, view pending/completed reviews |
| HR | Create accounts, manage required skills and courses, view analytics dashboard |

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT authentication
- **ML Service:** Python, FastAPI, scikit-learn, pandas, joblib

## Project Structure

```
skill-indicator-project/
├── backend/       # Express API, MongoDB models, controllers, routes, seed scripts
├── frontend/      # React app
└── ml-service/    # FastAPI microservice (skill prediction model)
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.11+
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/zainabfatima2979/Skills-Prediction-System.git
cd Skills-Prediction-System
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (this file is not uploaded to GitHub). Add your own values, for example:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Optionally seed the database:

```bash
node seedFirstHR.js
node seedCourses.js
node seed.js
```

Start the server:

```bash
node server.js
```

### 3. ML Service

```bash
cd ml-service
pip install -r requirements.txt
```

Start the service (replace `app` with your main file name if different):

```bash
uvicorn app:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

Start the app:

```bash
npm start
```

## Notes

- `.env` files and `node_modules/` are excluded from the repository. Create your own `.env` files after cloning.
- Seed scripts create the required skills, the first HR account and demo data.

## Author

Zainab Fatima