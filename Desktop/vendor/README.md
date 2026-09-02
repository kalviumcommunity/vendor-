# LLM Token Measurement & Cost Estimation for RAG Pipelines

A Python project for measuring token counts using Byte-Pair Encoding (`tiktoken`) and calculating RAG retrieval cost estimates across varying document lengths, content types, and corpus scaling factors.

---

## 1. What is a Token?

A **token** is the fundamental atomic unit of text that a Large Language Model (LLM) reads and generates. 
* Unlike **characters** (single letters/symbols) or **words** (space-separated terms), tokens are sub-word byte fragments produced by Byte-Pair Encoding (BPE).
* In typical English text, **1 token ≈ 4 characters or ~0.75 words** (or ~1.3–1.4 tokens per word).
* Special symbols, code syntax, punctuation, rare words, and non-Latin scripts break into significantly more tokens per word.

---

## 2. Why Token Counting Matters for RAG

In a Retrieval-Augmented Generation (RAG) system:
1. **Context Window Limitations**: LLMs have hard token context limits (e.g. 8k, 32k, 128k). If retrieved chunks exceed this limit, the model truncates input or fails.
2. **Operational Cost**: LLMs charge per million tokens processed. Over-retrieval or poorly chunked documents directly inflate infrastructure costs.
3. **Latency**: Time-To-First-Token (TTFT) and throughput scale linearly with total input token length.

---

## 3. Token Analysis Across 3 Sample Sizes (Task 2)

Tokenizer used: **`cl100k_base`** (GPT-4 / GPT-4o / GPT-4o-mini).

| Sample Name | Description | Characters | Words | Tokens | Tokens / Word Ratio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sample 1: Short Query** | User question about contract terms | 79 | 13 | **18** | `1.38` |
| **Sample 2: Medium Paragraph** | SLA payment terms clause | 425 | 69 | **89** | `1.29` |
| **Sample 3: Full Document SLA** | Complete Vendor Data Ingestion Agreement | 1,625 | 239 | **333** | `1.39` |

---

## 4. Cost Estimation & Input vs. Output Pricing (Task 3)

LLM providers price **Input Tokens** (reading prompt & context) and **Output Tokens** (generating completion) differently because generation requires sequential, auto-regressive decoding.

### Reference Pricing Rates (per 1,000,000 Tokens)
* **`gpt-4o-mini`**: Input: `$0.150` / 1M | Output: `$0.600` / 1M
* **`gpt-4o`**: Input: `$2.500` / 1M | Output: `$10.000` / 1M

### Per-Query Cost Breakdown

| Sample | Input Tokens | Est. Output Tokens | Cost (`gpt-4o-mini`) | Cost (`gpt-4o`) |
| :--- | :--- | :--- | :--- | :--- |
| **Sample 1 (Short)** | 18 | 45 | **$0.00002970** | **$0.00049500** |
| **Sample 2 (Paragraph)** | 89 | 120 | **$0.00008535** | **$0.00142250** |
| **Sample 3 (Full SLA Doc)** | 333 | 350 | **$0.00025995** | **$0.00433250** |

---

## 5. Text Length vs. Token Relationship (Task 4)

Character and word counts correlate with tokens, but token density varies dramatically by content type:

| Text Content Type | Characters | Words | Tokens | Tokens / Word Ratio | Behavioral Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard English** | 106 | 13 | **16** | `1.23` | High token efficiency for common vocabulary |
| **Python Source Code** | 83 | 7 | **19** | `2.71` | Indentation, syntax symbols (`:`, `->`), and snake_case split into multiple tokens |
| **Special Characters & IDs** | 58 | 1 | **27** | `27.00` | Non-standard delimiters and punctuation tokenize individually |
| **Complex Technical / Biomedical** | 97 | 8 | **23** | `2.88` | Multi-syllable domain terms split into sub-word morphemes |

---

## 6. Follow-up: How Token Usage Scales with Corpus Growth

When scaling from 100 documents to 100,000 documents:
1. **Linear Indexing Tokens**: Embedding creation costs scale **linearly ($O(N)$)** with total corpus size ($N$ documents $\times$ tokens per document).
2. **Constant Query Tokens via Top-K Retrieval**: RAG search keeps inference costs **constant ($O(K)$)** per query because only the top $K$ chunks (e.g., $K=5$, ~1,500 tokens) are injected into the prompt, regardless of whether the corpus has 1,000 or 1,000,000 documents.
3. **Corpus Scaling Projection**:
   * For **10,000 production queries** retrieving full document contexts (Sample 3):
     * Total Input Tokens: `3,330,000`
     * Total Output Tokens: `3,500,000`
     * **Total Monthly Inference Cost (`gpt-4o-mini`)**: **`$2.5995 USD`**

---

## 7. Sample Script Output (Task 5)

```text
================================================================================
LLM TOKEN MEASUREMENT & COST ESTIMATION REPORT
Tokenizer: cl100k_base (GPT-4 / GPT-4o-mini)
================================================================================

--- TASK 2: TOKEN COUNTS ACROSS 3 SAMPLE SIZES ---
Sample Name                  | Chars   | Words   | Tokens   | Tokens/Word 
---------------------------------------------------------------------------
Sample 1: Short Query        | 79      | 13      | 18       | 1.38        
Sample 2: Medium Paragraph   | 425     | 69      | 89       | 1.29        
Sample 3: Full Document SLA  | 1625    | 239     | 333      | 1.39        

================================================================================
--- TASK 3: RAG QUERY & RESPONSE COST ESTIMATION ---
Pricing reference: GPT-4o-mini ($0.150/1M input, $0.600/1M output) & GPT-4o ($2.50/1M in, $10.00/1M out)
--------------------------------------------------------------------------------

[Sample 1: Short Query] (Input: 18 tokens, Estimated Output: 45 tokens)
  • gpt-4o-mini: $0.00002970 (Input: $0.00000270, Output: $0.00002700)
  • gpt-4o:      $0.00049500 (Input: $0.00004500, Output: $0.00045000)

[Sample 2: Medium Paragraph] (Input: 89 tokens, Estimated Output: 120 tokens)
  • gpt-4o-mini: $0.00008535 (Input: $0.00001335, Output: $0.00007200)
  • gpt-4o:      $0.00142250 (Input: $0.00022250, Output: $0.00120000)

[Sample 3: Full Document SLA] (Input: 333 tokens, Estimated Output: 350 tokens)
  • gpt-4o-mini: $0.00025995 (Input: $0.00004995, Output: $0.00021000)
  • gpt-4o:      $0.00433250 (Input: $0.00083250, Output: $0.00350000)

--- SCALING TO 10,000 RAG RETRIEVAL QUERIES (Sample 3 SLA Doc) ---
  • 10,000 Queries Total Input Tokens:  3,330,000
  • 10,000 Queries Total Output Tokens: 3,500,000
  • Estimated Cost (gpt-4o-mini):       $2.5995 USD

================================================================================
--- TASK 4: DEMONSTRATING LENGTH-TO-TOKEN RELATIONSHIP ---
Demonstrating that character/word counts track tokens but vary significantly by content type:
--------------------------------------------------------------------------------
Text Content Type                   | Chars   | Words   | Tokens   | Tokens/Word 
--------------------------------------------------------------------------------
Standard English                    | 106     | 13      | 16       | 1.23        
Python Source Code                  | 83      | 7       | 19       | 2.71        
Repeated Special Characters & IDs   | 58      | 1       | 27       | 27.00       
Complex Technical / Biomedical      | 97      | 8       | 23       | 2.88        
================================================================================
```

---

## 8. How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Execute the token and cost estimator
python token_cost_estimator.py
```
