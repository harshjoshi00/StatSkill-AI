# StatSkill AI - System Architecture

StatSkill AI is an enterprise-grade AI platform designed for capacity building, skill intelligence, and targeted training in India's Official Statistical System (e.g., MOSPI, NSO, NSSO, State Statistical Bureaus).

## Closed-Loop Skill Intelligence Flow

```
[Official Profile & Self-Assessment]
                 │
                 ▼
     [Competency Scoring Engine]
                 │
                 ▼
       [Skill Gap Analyzer]
                 │
                 ▼
[Hybrid Course Recommendation Engine]
                 │
                 ▼
    [Learning & Document RAG]
                 │
                 ▼
     [AI MCQ & Quiz Generator]
                 │
                 ▼
     [Adaptive Assessment]
                 │
                 ▼
   [Dynamic Competency Score Update] ──(Loop Closes)──┐
                 ▲                                   │
                 └───────────────────────────────────┘
```

## Core Modules
1. **Frontend**: Next.js App Router + TypeScript + Tailwind CSS + Lucide Icons + Recharts multi-tab Admin Console & Employee Portal.
2. **Backend**: FastAPI with modular service-repository architecture, custom Pydantic v2 schemas, and JWT OAuth2 security.
3. **Database & Vector Store**: SQLite / PostgreSQL with JSON vector embeddings, continuous competency history tracking, and full relational integrity.
4. **AI/RAG Engine**: Cosine similarity vector matching, PyMuPDF / python-pptx document chunking, RAG context retrieval, and AI quiz generation.
5. **Predictive ML Analytics (Phase 8)**: Explainable `RandomForestClassifier` / `XGBoostClassifier` workforce risk prediction model evaluating 10 feature dimensions (match %, open gaps, critical deficits, max gap size, training status, assessment pass rates, scores, experience) to output risk probabilities, feature explanations, and targeted training interventions without mutating actual competency levels.

## Phase 8 Admin APIs
- `GET /api/v1/admin/analytics`: Real DB aggregate metrics (employees, departments, roles, match %, gaps, quiz stats, missing skills).
- `GET /api/v1/admin/competency-overview`: Workforce aggregate competency analysis & department/role breakdowns.
- `GET /api/v1/admin/training-effectiveness`: Course completion rates, pre vs post competency gains, quiz performance.
- `GET /api/v1/admin/predictions`: Explainable ML workforce risk predictions, risk probabilities, contributing factors.
- `GET /api/v1/admin/workforce-summary`: Executive workforce readiness summary and strategic interventions.

