from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.profile import router as profile_router
from app.api.v1.competency import router as competency_router
from app.api.v1.admin_competency import router as admin_competency_router
from app.api.v1.ai_skills import router as ai_skills_router
from app.api.v1.recommendation import router as recommendation_router
from app.api.v1.learning import router as learning_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profile_router, prefix="", tags=["Profile & Reference Data"])
api_router.include_router(competency_router, prefix="/competency", tags=["Competency Engine & Skill Gap Analysis"])
api_router.include_router(admin_competency_router, prefix="/admin", tags=["Admin Analytics & Overview"])
api_router.include_router(ai_skills_router, prefix="/ai", tags=["Phase 4 – AI Skill Extraction & Matching"])
api_router.include_router(recommendation_router, prefix="", tags=["Phase 5 – Personalized Learning Recommendation Engine"])
api_router.include_router(learning_router, prefix="", tags=["Phase 6 – RAG Learning Materials & AI Quizzes"])

from app.api.v1.assessment import router as assessment_router
api_router.include_router(assessment_router, prefix="", tags=["Phase 7 – Adaptive Assessment & Competency Update"])



