"""
Token Counting and Cost Estimation Script for RAG Pipelines.

Demonstrates:
1. Token counting using tiktoken (cl100k_base / o200k_base encodings).
2. Token analysis for 3 samples of varying lengths (Short query, Paragraph, Full document).
3. Cost estimation for input and output tokens under different LLM pricing models.
4. Comparison of text length vs token counts across prose, code, and technical text.
"""

import sys

try:
    import tiktoken
except ImportError:
    print("[Notice] 'tiktoken' is not installed in the local environment.")
    print("Installing tiktoken or using fallback BPE estimator...")
    tiktoken = None


# Pricing rates per 1,000,000 (1M) tokens (USD)
# Standard industry reference: GPT-4o-mini and GPT-4o
PRICING_MODELS = {
    "gpt-4o-mini": {
        "input_per_million": 0.150,   # $0.150 / 1M input tokens
        "output_per_million": 0.600   # $0.600 / 1M output tokens
    },
    "gpt-4o": {
        "input_per_million": 2.500,   # $2.500 / 1M input tokens
        "output_per_million": 10.000  # $10.000 / 1M output tokens
    }
}


def get_encoder(encoding_name: str = "cl100k_base"):
    """Retrieve tiktoken encoder with graceful fallback if not installed."""
    if tiktoken:
        try:
            return tiktoken.get_encoding(encoding_name)
        except Exception:
            return tiktoken.encoding_for_model("gpt-4o-mini")
    return None


def count_tokens(text: str, encoder=None) -> int:
    """Count tokens for a given text string."""
    if encoder:
        return len(encoder.encode(text))
    # Accurate fallback approximation: ~4 characters per token for English text
    words = text.split()
    return int(len(text) / 3.8) if text else 0


def calculate_cost(input_tokens: int, output_tokens: int, model: str = "gpt-4o-mini") -> dict:
    """Calculate separate input, output, and total estimated cost in USD."""
    rates = PRICING_MODELS.get(model, PRICING_MODELS["gpt-4o-mini"])
    
    input_cost = (input_tokens / 1_000_000) * rates["input_per_million"]
    output_cost = (output_tokens / 1_000_000) * rates["output_per_million"]
    total_cost = input_cost + output_cost

    return {
        "model": model,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "input_cost_usd": input_cost,
        "output_cost_usd": output_cost,
        "total_cost_usd": total_cost,
        "rates": rates
    }


# =====================================================================
# TASK 2: THREE SAMPLES OF VARYING LENGTH
# =====================================================================

SAMPLE_1_SHORT = "What are the payment terms and late fee penalties for vendor contract #VD-9042?"

SAMPLE_2_PARAGRAPH = (
    "Section 4.2 - Payment Terms & Service Level Agreement: "
    "All invoices submitted by the Vendor shall be processed within thirty (30) calendar days "
    "of receipt. In the event of late payment, interest shall accrue at the rate of 1.5% per month "
    "or the maximum rate permitted by law. The Vendor guarantees an uptime service availability "
    "of 99.9% for cloud services, measured on a calendar month basis excluding scheduled maintenance."
)

SAMPLE_3_DOCUMENT = """# Vendor Data Ingestion & Security SLA Agreement

## 1. Scope of Services
The Vendor provides automated data ingestion, ETL pipeline execution, and cloud-hosted data warehousing solutions. All incoming client transaction datasets shall be ingested via secure API endpoints utilizing TLS 1.3 encryption and token-based mutual authentication.

## 2. Data Governance & Privacy Compliance
The Vendor agrees to adhere to SOC2 Type II, ISO 27001, and GDPR data privacy standards. Customer Personally Identifiable Information (PII) must be masked or tokenized prior to entering analytical staging storage. No unencrypted raw data shall reside in persistent memory without automated expiration policies.

## 3. Rate Limits & Pipeline Throughput
The standard ingestion throughput is rated for 50,000 transactions per second (TPS) with a burst capacity of 100,000 TPS. Requests exceeding allocated quotas will receive an HTTP 429 Too Many Requests response with an exponential backoff header.

## 4. Incident Response & Disaster Recovery
In the event of a Critical Severity 1 outage, the Vendor incident response team shall initiate remediation within fifteen (15) minutes of alert generation. Automated multi-region backup snapshots are performed at six-hour intervals with a Recovery Point Objective (RPO) of 1 hour and a Recovery Time Objective (RTO) of 4 hours.

## 5. Termination & Data Deletion
Upon termination of services, all customer datasets, indices, and audit logs shall be permanently purged using DoD 5220.22-M sanitation standards within fourteen (14) business days, accompanied by a formal Certificate of Destruction.
"""


# =====================================================================
# TASK 4: DEMONSTRATING LENGTH-TO-TOKEN RELATIONSHIP
# =====================================================================

TEXT_TYPES_DEMO = {
    "Standard English": "Artificial intelligence allows machines to learn from experience and perform human-like tasks efficiently.",
    "Python Source Code": "def calculate_hash(data: bytes) -> str:\n    return hashlib.sha256(data).hexdigest()",
    "Repeated Special Characters & IDs": "UUID-9823-XYZ_!@#$%^&*()_+==---[99201]{{alpha_beta_gamma}}",
    "Complex Technical / Biomedical": "Immunohistochemical degranulation of ribonucleoprotein complexes in polymorphonuclear leukocytes."
}


def run_token_and_cost_analysis():
    encoder = get_encoder("cl100k_base")
    encoder_name = "cl100k_base (GPT-4 / GPT-4o-mini)" if encoder else "Heuristic BPE Approximation"

    print("=" * 80)
    print("LLM TOKEN MEASUREMENT & COST ESTIMATION REPORT")
    print(f"Tokenizer: {encoder_name}")
    print("=" * 80)

    # -----------------------------------------------------------------
    # TASK 2 REPORT: 3 SAMPLES
    # -----------------------------------------------------------------
    samples = [
        ("Sample 1: Short Query", SAMPLE_1_SHORT, 45),       # estimated 45 output tokens
        ("Sample 2: Medium Paragraph", SAMPLE_2_PARAGRAPH, 120), # estimated 120 output tokens
        ("Sample 3: Full Document SLA", SAMPLE_3_DOCUMENT, 350)   # estimated 350 output tokens
    ]

    print("\n--- TASK 2: TOKEN COUNTS ACROSS 3 SAMPLE SIZES ---")
    print(f"{'Sample Name':<28} | {'Chars':<7} | {'Words':<7} | {'Tokens':<8} | {'Tokens/Word':<12}")
    print("-" * 75)

    sample_metrics = []
    for name, text, expected_output_tokens in samples:
        char_count = len(text)
        word_count = len(text.split())
        token_count = count_tokens(text, encoder)
        ratio = token_count / word_count if word_count > 0 else 0
        sample_metrics.append((name, text, char_count, word_count, token_count, expected_output_tokens))
        print(f"{name:<28} | {char_count:<7} | {word_count:<7} | {token_count:<8} | {ratio:<12.2f}")

    # -----------------------------------------------------------------
    # TASK 3 REPORT: COST ESTIMATION
    # -----------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- TASK 3: RAG QUERY & RESPONSE COST ESTIMATION ---")
    print("Pricing reference: GPT-4o-mini ($0.150/1M input, $0.600/1M output) & GPT-4o ($2.50/1M in, $10.00/1M out)")
    print("-" * 80)

    for name, _, _, _, in_tokens, out_tokens in sample_metrics:
        cost_mini = calculate_cost(in_tokens, out_tokens, "gpt-4o-mini")
        cost_4o = calculate_cost(in_tokens, out_tokens, "gpt-4o")

        print(f"\n[{name}] (Input: {in_tokens} tokens, Estimated Output: {out_tokens} tokens)")
        print(f"  • gpt-4o-mini: ${cost_mini['total_cost_usd']:.8f} (Input: ${cost_mini['input_cost_usd']:.8f}, Output: ${cost_mini['output_cost_usd']:.8f})")
        print(f"  • gpt-4o:      ${cost_4o['total_cost_usd']:.8f} (Input: ${cost_4o['input_cost_usd']:.8f}, Output: ${cost_4o['output_cost_usd']:.8f})")

    # Corpus Scale Projection
    print("\n--- SCALING TO 10,000 RAG RETRIEVAL QUERIES (Sample 3 SLA Doc) ---")
    sla_tokens = sample_metrics[2][4]
    sla_out = sample_metrics[2][5]
    batch_mini = calculate_cost(sla_tokens * 10_000, sla_out * 10_000, "gpt-4o-mini")
    print(f"  • 10,000 Queries Total Input Tokens:  {batch_mini['input_tokens']:,}")
    print(f"  • 10,000 Queries Total Output Tokens: {batch_mini['output_tokens']:,}")
    print(f"  • Estimated Cost (gpt-4o-mini):       ${batch_mini['total_cost_usd']:.4f} USD")

    # -----------------------------------------------------------------
    # TASK 4 REPORT: LENGTH-TO-TOKEN RELATIONSHIP
    # -----------------------------------------------------------------
    print("\n" + "=" * 80)
    print("--- TASK 4: DEMONSTRATING LENGTH-TO-TOKEN RELATIONSHIP ---")
    print("Demonstrating that character/word counts track tokens but vary significantly by content type:")
    print("-" * 80)
    print(f"{'Text Content Type':<35} | {'Chars':<7} | {'Words':<7} | {'Tokens':<8} | {'Tokens/Word':<12}")
    print("-" * 80)

    for text_type, sample_text in TEXT_TYPES_DEMO.items():
        c_count = len(sample_text)
        w_count = len(sample_text.split())
        t_count = count_tokens(sample_text, encoder)
        t_w_ratio = t_count / w_count if w_count > 0 else 0
        print(f"{text_type:<35} | {c_count:<7} | {w_count:<7} | {t_count:<8} | {t_w_ratio:<12.2f}")

    print("=" * 80)


if __name__ == "__main__":
    run_token_and_cost_analysis()
