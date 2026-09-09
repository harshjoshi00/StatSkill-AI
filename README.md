# StatSkill AI — Skill Intelligence & Personalized Learning Platform

> **AI-Powered Skill Intelligence and Capacity Building Platform for India's Official Statistical System (MOSPI / NSO / NSSO)**

StatSkill AI is a closed-loop, enterprise-grade AI platform designed to transform capacity building for statistical officers across India. The platform creates competency profiles for officials, identifies skill gaps against role requirements, recommends personalized training programmes (including iGOT Karmayogi & NSSTA courses), generates RAG-based AI quizzes from uploaded learning materials, evaluates performance, dynamically updates competency scores, and provides administrator-level workforce predictive analytics via XGBoost.

---

## 🏛️ Project Architecture

```
/project-root
├── /frontend               # Next.js 14, TypeScript, Tailwind CSS, Recharts, Lucide Icons
│   ├── /app                # Next.js App Router (Layouts, Pages, Globals CSS)
│   ├── /components         # Header, Navbar, HealthBadge, Cards, Charts
│   ├── /lib                # API fetch client (api.ts) & UI utilities (utils.ts)
│   └── /services           # Service integration layers
├── /backend                # FastAPI Python application
│   ├── /app
│   │   ├── /api            # API endpoints & health router (/api/v1/health)
│   │   ├── /core           # Settings (config.py) & Database engine (database.py)
│   │   ├── /models         # SQLAlchemy ORM models
│   │   ├── /schemas        # Pydantic validation schemas
│   │   ├── /services       # Core business logic services
│   │   ├── /repositories   # Database query abstractions
│   │   ├── /ai             # LLM provider abstraction & skill extraction
│   │   ├── /ml             # XGBoost predictive models
│   │   ├── /rag            # PyMuPDF / PPTX document chunking & vector search
│   │   ├── /recommendation # Hybrid course recommendation engine
│   │   └── /competency     # Competency scoring & skill-gap engine
├── /data                   # Seed data, sample courses, and competencies
├── /models                 # Trained XGBoost model artifacts
├── /uploads                # Uploaded learning materials (PDF / PPTX / TXT)
├── /docs                   # System documentation (architecture, API, database, AI pipeline)
├── docker-compose.yml      # Orchestrates Frontend, Backend, & Postgres + pgvector
├── .env.example            # Environment variables template
└── README.md               # Master documentation
```

---

## 🚀 Implementation Phases Status

- **Phase 1: Project Architecture & Setup** (Completed)
  - Monorepo setup, FastAPI backend, Next.js frontend, PostgreSQL / SQLite fallback, Docker configuration.
- **Phase 2: Authentication, Role-Based Access Control (RBAC) & Profile System** (Completed)
  - JWT Authentication, Employee & Admin RBAC, Profile management, Department & Job Role master data, Employee skills tracking, and Training History.
- **Phase 3: Competency Scoring Engine & Skill Gap Analysis** (Completed)
  - **Database Mapping**: `role_skill_requirements` table mapping job roles to required skill levels (1–5) and importance (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  - **Competency Levels**: Defined 0 = No Knowledge, 1 = Beginner, 2 = Basic, 3 = Intermediate, 4 = Advanced, 5 = Expert.
  - **Explainable Competency Engine**: `gap = required_level - current_level`. Severity classification (`NO_GAP`, `LOW`, `MEDIUM`, `HIGH`), explainable priority derivation, and automated reasoning string generation.
  - **API Endpoints**:
    - `GET /api/v1/competency`: Full user competency assessment overview & overall match %.
    - `GET /api/v1/competency/summary`: High-level summary count of skills met, gap counts, and match %.
    - `GET /api/v1/competency/gaps`: Detailed list of skill gaps with priority ranking and explainable text reasoning.
    - `GET /api/v1/admin/competency-overview` (ADMIN only): Cadre-wide aggregate analytics, top common missing skills, department and role competency breakdowns.
  - **Employee Dashboard**: Visual competency score gauge, current level vs role target benchmark visualizer, skill-gap cards with severity badges, and explainable text explanations.
  - **Admin Dashboard**: Total officials, officials with skill gaps, high-priority gaps, top common missing skills table, department and role summary tables.
  - **Automated Testing**: Complete pytest suite covering role requirements, gap calculation, gap classification, priority derivation, employee authorization, and admin authorization.
- **Phase 4: AI Skill Extraction & Semantic Matching** (Completed)
  - **Core Flow**: Text/Resume input → phrase extraction → embedding generation → cosine similarity matching against master Skills catalog → employee confirmation → save as `AI_EXTRACTED`.
  - **Semantic Engine**: Uses `SentenceTransformer` (`all-MiniLM-L6-v2` or `BAAI/bge-small-en-v1.5`, configurable via `.env`) with cosine similarity. Includes a zero-dependency deterministic keyword fallback (Jaccard token overlap) if model is unavailable.
  - **Strict Constraints**: No LLM, no RAG, no XGBoost. AI NEVER automatically sets skill levels — employee must specify `current_level` (1–5) upon accepting a suggestion.
  - **Database Persistence**: `ai_skill_suggestions` table storing `user_id`, `extracted_skill`, `matched_skill_id`, `confidence`, `similarity_score`, `source_text_snippet`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`), and `suggested_level` (always `None`).
  - **API Endpoints**:
    - `POST /api/v1/ai/skills/extract`: Extract skill phrases & calculate semantic similarity matches.
    - `POST /api/v1/ai/skills/match`: Match provided phrases against skills catalog.
    - `GET /api/v1/ai/skills/suggestions`: Fetch employee's pending/accepted/rejected AI suggestions.
    - `POST /api/v1/ai/skills/suggestions/{id}/accept`: Confirm AI suggestion & provide `current_level` to update employee skill profile.
    - `POST /api/v1/ai/skills/suggestions/{id}/reject`: Reject AI suggestion.
  - **UI Integration**: Added interactive "AI Skill Discovery" panel to Profile page with text area input, confidence progress bars, source badges, level selector, Accept/Reject controls, and pending suggestions queue.
  - **Automated Testing**: 36 total backend pytest tests passing (Auth, Competency, and AI Skill Extraction).
- **Phase 5: Personalized Learning Recommendation Engine** (Completed)
  - **Core Flow**: Employee → Skill Gaps → Required Skills → Training Catalog → Hybrid Multi-Factor Ranking → Personalized Recommendations.
  - **Hybrid Ranking Algorithm**:
    - **40% Skill-Gap Relevance**: Prioritizes `HIGH` and `CRITICAL` priority gaps.
    - **30% Semantic Similarity**: Reuses Phase 4 embeddings / keyword fallback for profile alignment.
    - **10% Role Relevance**: Extra weight if skill is required for official's job role.
    - **10% Difficulty Fit**: Matches course difficulty (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`) to employee's current skill level.
    - **10% Learning History**: Already completed courses are penalized to prevent duplicates; in-progress courses are flagged.
  - **Demo Training Catalog**: Populated `training_courses` table with courses from iGOT Karmayogi, NSSTA, SWAYAM, and NPTEL across Statistical, Technical, Digital Governance, and Behavioural domains.
  - **API Endpoints**:
    - `GET /api/v1/recommendations`: Fetch personalized course recommendations (with priority, skill_id, and difficulty filters).
    - `GET /api/v1/recommendations/{skill_id}`: Fetch recommendations for a specific skill.
    - `GET /api/v1/training-courses`: List all active training courses.
    - `POST /api/v1/recommendations/{course_id}/start`: Enroll in course / set `IN_PROGRESS`.
    - `POST /api/v1/recommendations/{course_id}/complete`: Complete course / set `COMPLETED`.
  - **Automated Testing**: 43 total backend pytest unit & integration tests passing.
- **Phase 6: RAG-Based Learning Material & AI Quiz Generation** (Completed)
  - **Core Flow**: PDF / PPTX / TXT Document → text extraction (`PyMuPDF` / `python-pptx`) → clean & chunk → sentence embeddings (Phase 4 service) → vector storage (`pgvector` / SQLite JSON) → RAG vector retrieval → `LLMService` (with deterministic **DEMO** mode fallback) → strict MCQ validation → interactive quiz interface → instant scoring & explanations → competency improvement placeholder & course links.
  - **RAG & Parser Pipeline**:
    - PyMuPDF (`fitz`) for PDF text parsing.
    - `python-pptx` (`Presentation`) for slide text parsing.
    - Sentence-aware overlapping chunker (`chunk_text`).
    - Semantic vector similarity retrieval with fallback keyword Jaccard overlap.
  - **Database Persistence**:
    - `learning_materials`: Stored metadata, extracted content text, uploader, course reference.
    - `material_chunks`: Chunk index, chunk text, vector embeddings.
    - `quizzes`: Quiz title, description, question count, DEMO mode flag, creator.
    - `quiz_questions`: Question text, 4 options, validated correct answer, explanation, difficulty, source reference.
    - `quiz_attempts`: Official attempt records, score, percentage, passed status.
    - `quiz_answers`: Per-question employee selection and correctness.
  - **API Endpoints**:
    - `POST /api/v1/learning/materials/upload`: Upload PDF, PPTX, or TXT documents.
    - `GET /api/v1/learning/materials`: List all learning materials.
    - `POST /api/v1/learning/materials/{id}/quiz`: Trigger RAG AI quiz generation.
    - `GET /api/v1/quizzes/{id}`: Fetch quiz questions for attempt.
    - `POST /api/v1/quizzes/{id}/submit`: Submit answers, evaluate score, and persist attempt.
    - `GET /api/v1/quizzes/{id}/result`: Retrieve latest attempt results with explanations and recommended training courses.
  - **UI Integration**: Added interactive **AI Learning & RAG Quiz Generator** section to Employee Dashboard with upload modal, material card grid, generation options modal, question-by-question MCQ player, instant scorecard, detailed question review with explanations, and source context references.
  - **Automated Testing**: 51 total backend pytest unit & integration tests passing.
- **Phase 7: Adaptive Assessment & Continuous Competency Update** (Completed)
  - **Adaptive Scoring**: Score >= 80% advances competency level (+1, max 5) and increases next quiz difficulty; score < 50% recommends lower difficulty & foundational study.
  - **Competency Evidence Tracking**: `CompetencyHistory` audit table recording `old_level`, `new_level`, `score`, `evidence_source`, `adaptive_next_difficulty`, and explainable reason.
  - **API Endpoints**: `POST /api/v1/assessment/evaluate`, `GET /api/v1/assessment/progress`, `GET /api/v1/assessment/history`, `GET /api/v1/competency/progress`.
  - **Automated Testing**: 66 total backend pytest tests passing.
- **Phase 8: Admin Analytics, ML Prediction & Final Integration** (Completed)
  - **Admin Analytics**: Live aggregate database metrics across all employees, departments, roles, skill gaps, training completions, and quiz performance.
  - **Explainable ML Prediction Engine**: `RandomForestClassifier` / `XGBoostClassifier` workforce risk prediction model evaluating 10 feature dimensions to predict training risk probabilities, top contributing feature explanations, and recommended interventions without mutating actual competency levels.
  - **Recharts Admin Dashboard**: Multi-tab Administrator Console featuring interactive Bar/Pie charts for department readiness, role gap distributions, training efficacy, ML risk forecasts, and missing skills.
  - **Phase 8 APIs**: `GET /api/v1/admin/analytics`, `GET /api/v1/admin/competency-overview`, `GET /api/v1/admin/training-effectiveness`, `GET /api/v1/admin/predictions`, `GET /api/v1/admin/workforce-summary`.
  - **Automated Testing**: 74 total backend pytest unit & integration tests passing (100% test suite pass rate).


---

## 🛠️ Quick Start Guide

### Option 1: Running with Docker Compose (Recommended)

Make sure Docker and Docker Compose are installed on your machine.

```bash
# 1. Clone or navigate to the project directory
cd "e:\SIH Project"

# 2. Copy environment template
cp .env.example .env

# 3. Build and launch all services (PostgreSQL + pgvector, Backend, Frontend)
docker-compose up --build
```

Access the applications:
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)

---

### Option 2: Running Locally (Native Setup)

#### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Setup (Next.js)

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials & Demo Mode

StatSkill AI is built with an explicit `DEMO_MODE=true` toggle in `.env.example` to ensure full functionality and fallbacks even when live LLM API keys or PostgreSQL servers are initially offline.

- **Demo Official Account**: `official@statskill.gov.in` / `Official@123`
- **Demo Admin Account**: `admin@statskill.gov.in` / `Admin@123`

---

## 📜 System Requirements

- **Python**: 3.10+
- **Node.js**: 20+
- **PostgreSQL**: 16 with `pgvector` extension enabled
- **Docker**: 24+ & Docker Compose v2+
