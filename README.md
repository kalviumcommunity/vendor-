# Multi-Turn Conversation History & Context Window Management for RAG

A Python project implementing conversation history tracking, dynamic token measurement, and sliding-window context management for Retrieval-Augmented Generation (RAG) conversational agents.

---

## 1. What is a Context Window & Why is it Limited?

A **context window** is the maximum sequence length (measured in tokens) that a Large Language Model (LLM) can read and process in a single API call (prompt instructions + conversation history + retrieved RAG context + generated response).

### Why is it Limited?
* **Transformer Attention Complexity**: Standard self-attention scales quadratically or with heavy KV-cache memory requirements ($O(N^2)$ / $O(N)$ KV-cache size).
* **Cost Constraints**: Processing longer contexts increases latency (Time to First Token) and per-request compute costs.
* **Loss of Focus (Needle in a Haystack)**: Excessive context causes model degradation where the LLM struggles to retrieve relevant facts buried in the middle of long histories.

---

## 2. What Happens When History Exceeds the Limit?

If a multi-turn conversation is left unmanaged:
1. **API Rejection**: Providers return HTTP `400 Bad Request` or `context_length_exceeded` errors.
2. **Context Truncation**: Naive truncation cuts off the beginning or end of prompts, often dropping critical **System Instructions** or immediate user questions.
3. **Runaway Latency & Cost**: Each additional turn sends the cumulative history again, exponentially multiplying token bills.

---

## 3. History Management Strategies: Trimming vs. Summarization

| Strategy | Mechanism | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Sliding-Window FIFO Trimming** | Prunes the oldest user/assistant turns when approaching budget limit | Deterministic, zero additional latency/cost, preserves exact recent context | Drops very early conversation details |
| **Recursive Summarization** | Condenses older turns into a compact summary message | Retains broad conversational memory across long sessions | Incurs additional LLM call cost/latency to generate summaries |

> **System Message Preservation**: Under all strategies, the **`system` message (index 0)** is permanently locked and never removed, ensuring global safety guardrails and persona instructions stay active.

---

## 4. Multi-Turn Simulation & Overflow Demonstration

The script simulates a 5-turn RAG conversation where each user turn brings retrieved vendor SLA knowledge chunks into the prompt context.

### Execution Results: Naive vs. Managed Context

* **Strict Token Ceiling**: `300 tokens`

| Turn | User Query Topic | Naive History (Unmanaged) | Managed History (With Trim) | Action Taken |
| :--- | :--- | :--- | :--- | :--- |
| **Turn 1** | Data retention policy | `98 tokens` (OK) | `75 tokens` (OK) | History initialized |
| **Turn 2** | Ingestion encryption | `163 tokens` (OK) | `154 tokens` (OK) | History maintained |
| **Turn 3** | TPS rate limits | `243 tokens` (OK) | `237 tokens` (OK) | Nearing token budget |
| **Turn 4** | Disaster recovery SLA | `334 tokens` ⚠️ **(EXCEEDED)** | `282 tokens` ✅ **(WITHIN BUDGET)** | Pruned 1 oldest turn |
| **Turn 5** | DoD disk sanitation | `412 tokens` ⚠️ **(EXCEEDED)** | `296 tokens` ✅ **(WITHIN BUDGET)** | Pruned 2 oldest turns |

---

## 5. Sample Run Output

```text
=====================================================================================
MULTI-TURN CONVERSATION CONTEXT WINDOW & TRIMMING SIMULATION
Token Budget Limit: 300 tokens (Strict Ceiling)
=====================================================================================

[Turn 0 - Initial State]
  * System Message Loaded: "You are an expert Vendor Data Pipeline Assistant. ..."
  * Initial Tokens: 28 / 300

=====================================================================================
--- TURN 1: USER QUERY & RETRIEVAL AUGMENTATION ---
User Query:      "What is the data retention policy for vendor transaction logs?"
Retrieved Chunk: "Vendor SLA Sec 5: Transaction logs are retained for 90 days in co..."

[Token Measurement & Window Status for Turn 1]:
  * Naive Unmanaged Tokens: 98 tokens [OK]
  * Managed Tokens Before Trim: 75 tokens
  * Managed Tokens After Trim:  75 tokens [WITHIN BUDGET OK]
  * Preserved System Message:   "You are an expert Vendor Data Pipeline Assist..." [SAFE]
  * Active Messages in Context: 2 messages

=====================================================================================
--- TURN 2: USER QUERY & RETRIEVAL AUGMENTATION ---
User Query:      "What encryption standard is used during data ingestion?"
Retrieved Chunk: "Vendor Sec 1: All incoming client datasets must be ingested via T..."

[Token Measurement & Window Status for Turn 2]:
  * Naive Unmanaged Tokens: 163 tokens [OK]
  * Managed Tokens Before Trim: 154 tokens
  * Managed Tokens After Trim:  154 tokens [WITHIN BUDGET OK]
  * Preserved System Message:   "You are an expert Vendor Data Pipeline Assist..." [SAFE]
  * Active Messages in Context: 4 messages

=====================================================================================
--- TURN 3: USER QUERY & RETRIEVAL AUGMENTATION ---
User Query:      "What happens if our API exceeds the 50,000 TPS ingestion rate?"
Retrieved Chunk: "Vendor Sec 3: Ingestion is rated for 50,000 TPS. Excess traffic r..."

[Token Measurement & Window Status for Turn 3]:
  * Naive Unmanaged Tokens: 243 tokens [OK]
  * Managed Tokens Before Trim: 237 tokens
  * Managed Tokens After Trim:  237 tokens [WITHIN BUDGET OK]
  * Preserved System Message:   "You are an expert Vendor Data Pipeline Assist..." [SAFE]
  * Active Messages in Context: 6 messages

=====================================================================================
--- TURN 4: USER QUERY & RETRIEVAL AUGMENTATION ---
User Query:      "How fast does the disaster recovery team respond to Critical Severity 1 outages?"
Retrieved Chunk: "Vendor Sec 4: Critical Severity 1 incident response begins within..."

[Token Measurement & Window Status for Turn 4]:
  * Naive Unmanaged Tokens: 334 tokens [EXCEEDED LIMIT! WARNING]
  * Managed Tokens Before Trim: 329 tokens
  * [TRIM ACTION] Context Manager pruned 1 oldest message(s) to stay within budget!
  * Managed Tokens After Trim:  282 tokens [WITHIN BUDGET OK]
  * Preserved System Message:   "You are an expert Vendor Data Pipeline Assist..." [SAFE]
  * Active Messages in Context: 7 messages

=====================================================================================
--- TURN 5: USER QUERY & RETRIEVAL AUGMENTATION ---
User Query:      "What standards are used for disk sanitation upon contract termination?"
Retrieved Chunk: "Vendor Sec 5.2: Storage sanitation conforms strictly to DoD 5220...."

[Token Measurement & Window Status for Turn 5]:
  * Naive Unmanaged Tokens: 412 tokens [EXCEEDED LIMIT! WARNING]
  * Managed Tokens Before Trim: 375 tokens
  * [TRIM ACTION] Context Manager pruned 2 oldest message(s) to stay within budget!
  * Managed Tokens After Trim:  296 tokens [WITHIN BUDGET OK]
  * Preserved System Message:   "You are an expert Vendor Data Pipeline Assist..." [SAFE]
  * Active Messages in Context: 7 messages

=====================================================================================
FINAL SUMMARY: NAIVE vs MANAGED CONVERSATION
-------------------------------------------------------------------------------------
Total Turns Processed:      5
Naive Unmanaged History:    412 tokens -> Status: FAILS (Exceeds 300 token budget)
Managed History with Trim:  296 tokens -> Status: SUCCEEDS (Fits comfortably within 300)
System Message Integrity:   100% PRESERVED throughout entire multi-turn session
=====================================================================================
```

---

## 6. Follow-up: Connecting to Long Document Conversations

In long-document QA and RAG workflows:
1. **Per-Turn Context Injection**: Each turn introduces new retrieved document chunks into the prompt, accelerating context window consumption faster than standard chit-chat.
2. **Dynamic Context Partitioning**: We divide the token budget into allocated partitions (e.g. 10% System Instructions, 40% Retrieved Document Chunks, 30% Multi-Turn Conversation History, 20% Model Output Generation).
3. **Cross-Turn Deduplication**: If subsequent questions query the same document section, caching and deduplicating retrieved chunks saves substantial token volume.

---

## 7. How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run multi-turn context manager simulation
python chat_history_manager.py
```
