import re
from typing import List, Tuple, Dict, Any
from .chunker import DocumentChunk

class Reranker:
    """
    Cross-feature re-ranker to boost precision and calibrate relevance scores.
    """
    def __init__(self):
        pass

    def rerank(
        self,
        query: str,
        retrieved: List[Tuple[DocumentChunk, float]],
        target_version: str = None
    ) -> List[Dict[str, Any]]:
        if not retrieved:
            return []

        query_tokens = set(re.findall(r"[a-zA-Z0-9_\-\.]+", query.lower()))
        ranked_results = []

        max_raw_score = max([score for _, score in retrieved]) if retrieved else 1.0

        for chunk, initial_score in retrieved:
            chunk_tokens = set(re.findall(r"[a-zA-Z0-9_\-\.]+", (chunk.text + " " + chunk.section).lower()))
            overlap = len(query_tokens.intersection(chunk_tokens))
            overlap_ratio = overlap / max(1, len(query_tokens))

            # Bonus for code blocks if query asks for how-to, syntax, headers, or parameters
            code_bonus = 0.15 if ("```" in chunk.text and any(k in query.lower() for k in ["how", "header", "syntax", "code", "endpoint", "parameter", "example", "curl"])) else 0.0

            # Bonus for exact section name match
            section_bonus = 0.2 if any(tok in chunk.section.lower() for tok in query_tokens if len(tok) > 3) else 0.0

            # Version match bonus
            version_bonus = 0.1 if (target_version and chunk.version.lower() == target_version.lower()) else 0.0

            # Final calibrated score
            normalized_score = (initial_score / max(0.01, max_raw_score)) * 0.5 + overlap_ratio * 0.3 + code_bonus + section_bonus + version_bonus
            calibrated_pct = min(99, max(55, int(normalized_score * 100)))

            ranked_results.append({
                "chunk": chunk,
                "relevance_score": round(normalized_score, 4),
                "relevance_pct": calibrated_pct
            })

        # Sort by final score
        ranked_results.sort(key=lambda x: x["relevance_score"], reverse=True)
        return ranked_results
