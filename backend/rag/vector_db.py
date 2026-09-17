import math
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
from pathlib import Path
from .chunker import DocumentChunk

def normalize_version(v: Optional[str]) -> Optional[str]:
    if not v or v.lower() in ("all", "all versions", "any", "*", ""):
        return None
    v = v.strip().lower()
    if not v.startswith("v"):
        v = "v" + v
    if "." not in v:
        v = v + ".0"
    return v

def tokenize(text: str) -> List[str]:
    # Extract unigrams as well as combined code identifiers
    raw_tokens = re.findall(r"[a-zA-Z0-9_\-\./:]+", text.lower())
    tokens = []
    for t in raw_tokens:
        tokens.append(t)
        sub_parts = re.findall(r"[a-zA-Z0-9]+", t)
        if len(sub_parts) > 1:
            tokens.extend(sub_parts)
    return tokens

class VectorDatabase:
    """
    Production hybrid vector database with metadata filtering and BM25 + dense semantic scoring.
    """
    def __init__(self, index_file: Optional[Path] = None):
        self.index_file = index_file
        self.chunks: List[DocumentChunk] = []
        self.doc_freq: Dict[str, int] = {}
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 1.0
        self.total_docs: int = 0
        self.bm25_k1: float = 1.5
        self.bm25_b: float = 0.75
        self.term_vectors: List[Dict[str, float]] = []

    def clear(self):
        self.chunks = []
        self.doc_freq = {}
        self.doc_lengths = []
        self.avg_doc_length = 1.0
        self.total_docs = 0
        self.term_vectors = []

    def add_chunks(self, new_chunks: List[DocumentChunk]):
        for chunk in new_chunks:
            self.chunks.append(chunk)
        self._build_index()

    def _build_index(self):
        self.total_docs = len(self.chunks)
        if self.total_docs == 0:
            return

        self.doc_freq = Counter()
        self.doc_lengths = []
        self.term_vectors = []

        # Calculate document frequencies
        doc_token_sets = []
        for chunk in self.chunks:
            text = f"{chunk.title} {chunk.section} {chunk.text} {chunk.document_type} {chunk.version}"
            tokens = tokenize(text)
            self.doc_lengths.append(len(tokens))
            unique_tokens = set(tokens)
            doc_token_sets.append((tokens, unique_tokens))
            for t in unique_tokens:
                self.doc_freq[t] += 1

        self.avg_doc_length = sum(self.doc_lengths) / max(1, self.total_docs)

        # Build TF-IDF dense term vectors for cosine similarity
        for tokens, _ in doc_token_sets:
            tf = Counter(tokens)
            vec = {}
            norm_sq = 0.0
            for term, count in tf.items():
                df = self.doc_freq.get(term, 1)
                idf = math.log((self.total_docs + 1) / (df + 0.5)) + 1.0
                weight = (count / len(tokens)) * idf
                vec[term] = weight
                norm_sq += weight * weight
            
            norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
            # Unit normalize
            self.term_vectors.append({k: v / norm for k, v in vec.items()})

    def search(
        self,
        query: str,
        version: Optional[str] = None,
        document_type: Optional[str] = None,
        top_k: int = 5
    ) -> List[Tuple[DocumentChunk, float]]:
        if self.total_docs == 0:
            return []

        norm_target_version = normalize_version(version)
        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        # Query TF-IDF vector
        q_tf = Counter(query_tokens)
        q_vec = {}
        q_norm_sq = 0.0
        for term, count in q_tf.items():
            df = self.doc_freq.get(term, 0)
            idf = math.log((self.total_docs + 1) / (df + 0.5)) + 1.0 if df > 0 else 0.5
            weight = (count / len(query_tokens)) * idf
            q_vec[term] = weight
            q_norm_sq += weight * weight
        
        q_norm = math.sqrt(q_norm_sq) if q_norm_sq > 0 else 1.0
        q_unit_vec = {k: v / q_norm for k, v in q_vec.items()}

        results = []
        for i, chunk in enumerate(self.chunks):
            # 1. Metadata Filtering
            if norm_target_version:
                chunk_v = normalize_version(chunk.version)
                if chunk_v != norm_target_version:
                    continue

            if document_type and document_type.lower() not in ("all", "all types", "any", ""):
                if chunk.document_type.lower() != document_type.lower():
                    continue

            # 2. BM25 Lexical Score
            doc_len = self.doc_lengths[i]
            bm25_score = 0.0
            for term in query_tokens:
                if term in self.term_vectors[i]:
                    df = self.doc_freq.get(term, 0)
                    idf = math.log((self.total_docs - df + 0.5) / (df + 0.5) + 1.0)
                    tf = self.term_vectors[i][term]
                    numerator = tf * (self.bm25_k1 + 1)
                    denominator = tf + self.bm25_k1 * (1 - self.bm25_b + self.bm25_b * (doc_len / self.avg_doc_length))
                    bm25_score += idf * (numerator / max(0.001, denominator))

            # 3. Dense Cosine Similarity
            cosine_sim = 0.0
            doc_vec = self.term_vectors[i]
            for term, q_val in q_unit_vec.items():
                if term in doc_vec:
                    cosine_sim += q_val * doc_vec[term]

            # 4. Title / Section Exact Match Boost
            boost = 1.0
            query_lower = query.lower()
            if query_lower in chunk.section.lower() or query_lower in chunk.title.lower():
                boost += 0.4
            
            # Boost if query explicitly mentions version and chunk matches
            if norm_target_version and chunk.version.lower() == norm_target_version.lower():
                boost += 0.2

            # Combined hybrid score (0 to 1 scale roughly)
            hybrid_score = (0.5 * min(1.0, bm25_score / 5.0) + 0.5 * cosine_sim) * boost

            if hybrid_score > 0.01:
                results.append((chunk, round(hybrid_score, 4)))

        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def save_to_disk(self, path: Optional[Path] = None):
        target = path or self.index_file
        if not target:
            return
        target.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "total_docs": self.total_docs,
            "chunks": [c.to_dict() for c in self.chunks]
        }
        with open(target, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def load_from_disk(self, path: Optional[Path] = None):
        target = path or self.index_file
        if not target or not target.exists():
            return False
        try:
            with open(target, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.chunks = [DocumentChunk.from_dict(d) for d in data.get("chunks", [])]
            self._build_index()
            return True
        except Exception:
            return False
