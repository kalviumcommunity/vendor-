from fastapi import APIRouter
from typing import Dict, Any
from ..rag.evaluator import evaluator

router = APIRouter(prefix="/evaluation", tags=["Evaluation"])

# Cached initial run
CACHED_EVAL_RESULTS = None

@router.get("/benchmarks")
async def get_benchmarks():
    global CACHED_EVAL_RESULTS
    if not CACHED_EVAL_RESULTS:
        CACHED_EVAL_RESULTS = evaluator.run_evaluations()
    return CACHED_EVAL_RESULTS

@router.post("/run")
async def run_evaluation():
    global CACHED_EVAL_RESULTS
    results = evaluator.run_evaluations()
    CACHED_EVAL_RESULTS = results
    return results
