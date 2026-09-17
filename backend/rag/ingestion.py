import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from .chunker import SmartChunker, DocumentChunk
from .vector_db import VectorDatabase

class DocumentIngestionPipeline:
    """
    Ingestion pipeline supporting multi-format document parsing, cleaning, chunking,
    metadata attachment, and indexing.
    """
    def __init__(self, vector_db: VectorDatabase):
        self.vector_db = vector_db
        self.chunker = SmartChunker()
        self.documents_metadata: Dict[str, Dict[str, Any]] = {}

    def extract_text_and_metadata(self, file_path: Path) -> Dict[str, Any]:
        """Extract plain text and initial metadata from files."""
        ext = file_path.suffix.lower()
        doc_id = file_path.stem
        
        # Infer version from path or filename if available
        parts = file_path.parts
        version = "v3.0"
        for p in parts:
            if re.match(r"^v[1-4](\.0)?$", p.lower()):
                version = p.lower()
                if "." not in version:
                    version = version + ".0"
                break

        doc_type = "api_reference"
        if "migration" in doc_id.lower():
            doc_type = "migration_guide"
        elif "changelog" in doc_id.lower():
            doc_type = "changelog"
        elif "auth" in doc_id.lower():
            doc_type = "api_reference"

        content = ""
        if ext in (".md", ".txt"):
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        elif ext == ".html":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_html = f.read()
                # Clean simple tags
                content = re.sub(r"<[^>]+>", "\n", raw_html)
                content = re.sub(r"\n\s*\n", "\n\n", content)
        else:
            # Fallback for text / simulated binary text extraction
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

        return {
            "document_id": doc_id,
            "file_name": file_path.name,
            "version": version,
            "document_type": doc_type,
            "content": content,
            "file_size": file_path.stat().st_size if file_path.exists() else len(content)
        }

    def process_file(
        self,
        file_path: Path,
        custom_version: Optional[str] = None,
        custom_doc_type: Optional[str] = None
    ) -> List[DocumentChunk]:
        extracted = self.extract_text_and_metadata(file_path)
        version = custom_version or extracted["version"]
        doc_type = custom_doc_type or extracted["document_type"]

        chunks = self.chunker.chunk_document(
            document_id=extracted["document_id"],
            raw_content=extracted["content"],
            default_version=version,
            default_doc_type=doc_type
        )

        self.documents_metadata[extracted["document_id"]] = {
            "id": extracted["document_id"],
            "title": chunks[0].title if chunks else extracted["file_name"],
            "file_name": extracted["file_name"],
            "version": version,
            "document_type": doc_type,
            "chunk_count": len(chunks),
            "status": "indexed",
            "updated_at": "September 2026"
        }

        return chunks

    def process_raw_text(
        self,
        file_name: str,
        content: str,
        version: str = "v3.0",
        doc_type: str = "api_reference"
    ) -> List[DocumentChunk]:
        doc_id = Path(file_name).stem
        chunks = self.chunker.chunk_document(
            document_id=doc_id,
            raw_content=content,
            default_version=version,
            default_doc_type=doc_type
        )

        self.documents_metadata[doc_id] = {
            "id": doc_id,
            "title": chunks[0].title if chunks else file_name,
            "file_name": file_name,
            "version": version,
            "document_type": doc_type,
            "chunk_count": len(chunks),
            "status": "indexed",
            "updated_at": "September 2026"
        }

        self.vector_db.add_chunks(chunks)
        return chunks

    def ingest_corpus_directory(self, corpus_dir: Path):
        """Recursively scan and index all documentation files in corpus directory."""
        self.vector_db.clear()
        self.documents_metadata.clear()
        all_chunks: List[DocumentChunk] = []

        for root, _, files in os.walk(corpus_dir):
            for file in files:
                if file.endswith((".md", ".txt", ".html")):
                    file_path = Path(root) / file
                    chunks = self.process_file(file_path)
                    all_chunks.extend(chunks)

        self.vector_db.add_chunks(all_chunks)
        self.vector_db.save_to_disk()
        return len(all_chunks)
