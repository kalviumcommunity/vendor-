import re
from typing import List, Dict, Any

class DocumentChunk:
    def __init__(
        self,
        chunk_id: str,
        document_id: str,
        title: str,
        version: str,
        document_type: str,
        section: str,
        page: int,
        text: str,
        source_url: str = "",
        metadata: Dict[str, Any] = None
    ):
        self.chunk_id = chunk_id
        self.document_id = document_id
        self.title = title
        self.version = version
        self.document_type = document_type
        self.section = section
        self.page = page
        self.text = text
        self.source_url = source_url or f"/docs/{version}/{document_type}/{section.lower().replace(' ', '-')}"
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "title": self.title,
            "version": self.version,
            "document_type": self.document_type,
            "section": self.section,
            "page": self.page,
            "text": self.text,
            "source_url": self.source_url,
            "metadata": self.metadata
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentChunk":
        return cls(
            chunk_id=data["chunk_id"],
            document_id=data["document_id"],
            title=data["title"],
            version=data["version"],
            document_type=data["document_type"],
            section=data["section"],
            page=data["page"],
            text=data["text"],
            source_url=data.get("source_url", ""),
            metadata=data.get("metadata", {})
        )


class SmartChunker:
    """
    Intelligent semantic chunker for software documentation.
    Preserves code blocks, headings, tables, and attaches rich metadata.
    """
    def __init__(self, target_chunk_chars: int = 600, overlap_chars: int = 100):
        self.target_chunk_chars = target_chunk_chars
        self.overlap_chars = overlap_chars

    def chunk_document(
        self,
        document_id: str,
        raw_content: str,
        default_version: str = "v3.0",
        default_doc_type: str = "api_reference"
    ) -> List[DocumentChunk]:
        chunks: List[DocumentChunk] = []

        # 1. Parse header metadata if present in markdown
        title = "NovaAPI Documentation"
        version = default_version
        doc_type = default_doc_type

        lines = raw_content.splitlines()
        content_lines = []
        
        for line in lines:
            if line.startswith("# ") and title == "NovaAPI Documentation":
                title = line[2:].strip()
            elif line.lower().startswith("document type:"):
                doc_type = line.split(":", 1)[1].strip()
            elif line.lower().startswith("version:"):
                version = line.split(":", 1)[1].strip()
            else:
                content_lines.append(line)

        full_text = "\n".join(content_lines)

        # 2. Split by major markdown sections (## or ###)
        section_pattern = re.compile(r"(^|\n)(#{2,3}\s+[^\n]+)")
        splits = section_pattern.split(full_text)

        current_section = "Overview"
        current_buffer = []
        chunk_idx = 1
        page_counter = 1
        word_count = 0

        i = 0
        while i < len(splits):
            part = splits[i].strip()
            if not part:
                i += 1
                continue

            if part.startswith("## ") or part.startswith("### "):
                current_section = part.lstrip("#").strip()
                i += 1
                continue

            # Process section text
            paragraphs = re.split(r"\n\s*\n", part)
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue

                words_in_para = len(para.split())
                word_count += words_in_para
                # Estimate 250 words per page
                page_counter = max(1, (word_count // 250) + 1)

                current_buffer.append(para)
                combined = "\n\n".join(current_buffer)

                if len(combined) >= self.target_chunk_chars:
                    chunk_id = f"{document_id}-{version.replace('.', '_')}-{current_section.lower().replace(' ', '_')[:12]}-{chunk_idx:03d}"
                    chunk_id = re.sub(r"[^a-zA-Z0-9_\-]", "", chunk_id)
                    
                    chunks.append(DocumentChunk(
                        chunk_id=chunk_id,
                        document_id=document_id,
                        title=title,
                        version=version,
                        document_type=doc_type,
                        section=current_section,
                        page=page_counter,
                        text=combined
                    ))
                    chunk_idx += 1
                    # Keep small overlap
                    if len(current_buffer) > 1:
                        current_buffer = [current_buffer[-1]]
                    else:
                        current_buffer = []

            i += 1

        # Remaining buffer
        if current_buffer:
            combined = "\n\n".join(current_buffer)
            if combined.strip():
                chunk_id = f"{document_id}-{version.replace('.', '_')}-{current_section.lower().replace(' ', '_')[:12]}-{chunk_idx:03d}"
                chunk_id = re.sub(r"[^a-zA-Z0-9_\-]", "", chunk_id)
                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    title=title,
                    version=version,
                    document_type=doc_type,
                    section=current_section,
                    page=page_counter,
                    text=combined
                ))

        return chunks
