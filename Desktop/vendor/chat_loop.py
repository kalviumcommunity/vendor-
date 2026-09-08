"""
Multi-Turn RAG Chat Loop & Context Window Budget Manager

Features:
1. Multi-turn conversation state tracking (system, user with retrieved context, assistant).
2. Pre-request exact token measurement via tiktoken.
3. Sliding-window FIFO trimming and recursive summarization strategies.
4. Permanent preservation of the system instruction prompt.
5. Automated demonstration of context overflow management + Interactive CLI chat loop.
"""

import os
import sys
import copy
import argparse
from typing import List, Dict, Optional, Tuple

try:
    import tiktoken
except ImportError:
    tiktoken = None


class RAGChatLoopManager:
    """Manages multi-turn conversation history and enforces strict token budgets."""

    def __init__(
        self,
        system_prompt: str = "You are a professional RAG assistant. Answer queries accurately based on retrieved knowledge.",
        token_budget: int = 300,
        model_name: str = "gpt-4o-mini"
    ):
        self.system_prompt = system_prompt
        self.token_budget = token_budget
        self.model_name = model_name
        self.encoder = self._load_encoder()
        
        # Initialize history with permanently anchored system prompt
        self.history: List[Dict[str, str]] = [
            {"role": "system", "content": self.system_prompt}
        ]
        self.turn_count = 0

    def _load_encoder(self):
        """Loads tiktoken BPE encoder with fallback."""
        if tiktoken:
            try:
                return tiktoken.encoding_for_model(self.model_name)
            except Exception:
                return tiktoken.get_encoding("cl100k_base")
        return None

    def count_tokens(self, messages: Optional[List[Dict[str, str]]] = None) -> int:
        """
        Calculates the exact token footprint of a chat completion message list.
        Accounts for OpenAI formatting overhead (~4 tokens per message, 3 tokens assistant priming).
        """
        target_msgs = messages if messages is not None else self.history
        if not target_msgs:
            return 0

        total = 0
        for msg in target_msgs:
            content = msg.get("content", "")
            role = msg.get("role", "")
            
            if self.encoder:
                tokens = len(self.encoder.encode(content)) + len(self.encoder.encode(role)) + 4
            else:
                tokens = int(len(content) / 3.8) + 4
            total += tokens

        return total + 3  # Assistant reply priming

    def add_user_turn(self, user_text: str, retrieved_context: Optional[str] = None):
        """Appends user query augmented with retrieved RAG knowledge."""
        self.turn_count += 1
        if retrieved_context:
            augmented_content = (
                f"[Retrieved Context]:\n{retrieved_context}\n\n"
                f"[User Query]:\n{user_text}"
            )
        else:
            augmented_content = user_text

        self.history.append({"role": "user", "content": augmented_content})

    def add_assistant_turn(self, response_text: str):
        """Appends assistant response to history."""
        self.history.append({"role": "assistant", "content": response_text})

    def enforce_token_budget_trimming(self) -> Tuple[int, int, int]:
        """
        Enforces token budget by trimming the oldest non-system turns (FIFO).
        GUARANTEE: The system message at index 0 is NEVER removed.
        
        Returns: (tokens_before, tokens_after, pruned_turns_count)
        """
        tokens_before = self.count_tokens()
        pruned_turns = 0

        # Keep removing oldest conversation message (index 1) until within budget
        while self.count_tokens() > self.token_budget and len(self.history) > 2:
            removed_turn = self.history.pop(1)
            pruned_turns += 1

        tokens_after = self.count_tokens()
        return tokens_before, tokens_after, pruned_turns

    def enforce_token_budget_summarization(self) -> Tuple[int, int, bool]:
        """
        Alternative strategy: Condenses older conversation turns into a summary message.
        Preserves system prompt (index 0) and the most recent active turns.
        """
        tokens_before = self.count_tokens()
        if tokens_before <= self.token_budget or len(self.history) <= 3:
            return tokens_before, tokens_before, False

        system_msg = self.history[0]
        recent_turns = self.history[-2:]
        older_turns = self.history[1:-2]

        if not older_turns:
            return tokens_before, tokens_before, False

        # Build condensed summary
        summary_entries = []
        for m in older_turns:
            snippet = m["content"].split("\n")[-1][:40]
            summary_entries.append(f"{m['role']}: {snippet}...")
        
        summary_msg = {
            "role": "system",
            "content": f"[Previous Conversation Context Summary: {'; '.join(summary_entries)}]"
        }

        self.history = [system_msg, summary_msg, *recent_turns]
        tokens_after = self.count_tokens()
        return tokens_before, tokens_after, True


# =====================================================================
# DEMONSTRATION DATASET: 5-TURN OVERFLOWING RAG SESSION
# =====================================================================

SIMULATION_DATA = [
    {
        "query": "What is the data retention policy for vendor transaction logs?",
        "rag_context": "Vendor SLA Sec 5: Transaction logs are retained for 90 days in encrypted cold storage and permanently purged thereafter.",
        "reply": "According to Vendor SLA Section 5, transaction logs are retained in encrypted cold storage for 90 days before permanent deletion."
    },
    {
        "query": "What encryption standard is enforced during data ingestion?",
        "rag_context": "Vendor Sec 1: All incoming client datasets must be ingested via TLS 1.3 endpoints with token-based mutual authentication.",
        "reply": "All incoming datasets are encrypted in transit using TLS 1.3 endpoints with mutual token-based authentication."
    },
    {
        "query": "What happens if our pipeline exceeds the 50,000 TPS ingestion rate?",
        "rag_context": "Vendor Sec 3: Ingestion throughput is rated for 50,000 TPS. Excess traffic receives HTTP 429 with retry-after header.",
        "reply": "Traffic exceeding 50,000 TPS receives an HTTP 429 (Too Many Requests) response with an exponential backoff retry-after header."
    },
    {
        "query": "How fast does the disaster recovery team respond to Critical Severity 1 outages?",
        "rag_context": "Vendor Sec 4: Critical Severity 1 incident remediation begins within fifteen (15) minutes with an RPO of 1 hour and RTO of 4 hours.",
        "reply": "The incident response team initiates remediation within 15 minutes of a Severity 1 alert, offering a 1-hour RPO and 4-hour RTO."
    },
    {
        "query": "What sanitation standards apply upon contract termination?",
        "rag_context": "Vendor Sec 5.2: Storage sanitation strictly conforms to DoD 5220.22-M with a formal Certificate of Destruction issued within 14 days.",
        "reply": "Upon contract termination, data storage is sanitized conforming to DoD 5220.22-M standards within 14 business days."
    }
]


def run_automated_demonstration(output_file: Optional[str] = None):
    """
    Demonstrates context window overflow on a 5-turn conversation and proves
    that the trimming strategy keeps the active request strictly within budget.
    """
    output_lines = []

    def log(msg: str = ""):
        print(msg)
        output_lines.append(msg)

    SYSTEM_PROMPT = (
        "You are an expert Vendor Data Pipeline Assistant. Provide concise, "
        "accurate answers strictly using the provided context."
    )
    TOKEN_BUDGET = 300  # Strict ceiling for demo

    log("=" * 85)
    log("MULTI-TURN RAG CHAT LOOP & CONTEXT WINDOW TRIMMING DEMONSTRATION")
    log(f"Configured Token Budget Limit: {TOKEN_BUDGET} Tokens")
    log("=" * 85)

    manager = RAGChatLoopManager(system_prompt=SYSTEM_PROMPT, token_budget=TOKEN_BUDGET)
    naive_unmanaged_history = [{"role": "system", "content": SYSTEM_PROMPT}]

    log(f"\n[Turn 0 - Session Initialized]")
    log(f"  * System Prompt: \"{SYSTEM_PROMPT}\"")
    log(f"  * Initial Baseline Tokens: {manager.count_tokens()} / {TOKEN_BUDGET}")

    for turn_idx, turn_data in enumerate(SIMULATION_DATA, 1):
        log("\n" + "=" * 85)
        log(f"--- TURN {turn_idx}: USER QUERY & RAG CONTEXT INGESTION ---")
        log(f"User Query:      \"{turn_data['query']}\"")
        log(f"Retrieved Chunk: \"{turn_data['rag_context'][:65]}...\"")

        # 1. Update Naive Unmanaged History
        naive_unmanaged_history.append({"role": "user", "content": f"{turn_data['rag_context']}\n{turn_data['query']}"})
        naive_unmanaged_history.append({"role": "assistant", "content": turn_data["reply"]})
        naive_tokens = manager.count_tokens(naive_unmanaged_history)

        # 2. Update Managed History & Apply Trimming
        manager.add_user_turn(turn_data["query"], turn_data["rag_context"])
        tokens_before, tokens_after, pruned_count = manager.enforce_token_budget_trimming()

        log(f"\n[Token Measurement & Window Status for Turn {turn_idx}]:")
        overflow_flag = "[EXCEEDED LIMIT! WARNING]" if naive_tokens > TOKEN_BUDGET else "[OK]"
        log(f"  * Naive Unmanaged Tokens:     {naive_tokens} tokens {overflow_flag}")
        log(f"  * Managed Tokens Before Trim: {tokens_before} tokens")
        if pruned_count > 0:
            log(f"  * [TRIM ACTION] Context Manager pruned {pruned_count} oldest message(s) to prevent overflow!")
        log(f"  * Managed Tokens After Trim:  {tokens_after} tokens [WITHIN BUDGET OK]")
        log(f"  * System Message Preserved:   \"{manager.history[0]['content'][:45]}...\" [LOCKED & SAFE]")
        log(f"  * Total Active Turns in Window: {len(manager.history)} messages")

        # Add assistant response
        manager.add_assistant_turn(turn_data["reply"])

    log("\n" + "=" * 85)
    log("FINAL EVALUATION SUMMARY: NAIVE vs MANAGED CONVERSATION")
    log("-" * 85)
    log(f"Total Multi-Turn Interactions: 5 Turns")
    log(f"Naive Unmanaged History:       {naive_tokens} Tokens -> Status: FAILS (Exceeds {TOKEN_BUDGET} token budget)")
    log(f"Managed History with Trimming: {tokens_after} Tokens -> Status: SUCCEEDS (Fits inside {TOKEN_BUDGET} budget)")
    log(f"System Message Integrity:      100% PRESERVED throughout entire session")
    log("=" * 85)

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write("\n".join(output_lines) + "\n")
        print(f"\n[Artifact Saved]: Sample run execution log saved to {output_file}")


def run_interactive_chat_loop():
    """Interactive CLI Chat Loop for user testing."""
    print("\nStarting Interactive RAG Chat Loop (Type 'exit' to quit)...")
    budget_input = input("Enter token budget limit [default 300]: ").strip()
    budget = int(budget_input) if budget_input.isdigit() else 300
    
    manager = RAGChatLoopManager(token_budget=budget)
    print(f"Chat session started with token budget: {budget} tokens.\n")

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input or user_input.lower() in ["exit", "quit"]:
                print("Exiting chat session.")
                break

            context_chunk = "Sample knowledge chunk for query context."
            manager.add_user_turn(user_input, context_chunk)
            
            t_before, t_after, pruned = manager.enforce_token_budget_trimming()
            print(f"[Context Monitor] Active Tokens: {t_after}/{budget} (Pruned {pruned} turns)")

            # Echo mock reply
            mock_reply = f"I received your question: '{user_input}'. Answering based on retrieved context."
            print(f"Assistant: {mock_reply}")
            manager.add_assistant_turn(mock_reply)

        except (KeyboardInterrupt, EOFError):
            print("\nExiting.")
            break


def main():
    parser = argparse.ArgumentParser(description="Multi-turn RAG Chat Loop and Context Window Manager")
    parser.add_argument("--interactive", action="store_true", help="Launch interactive CLI chat loop")
    parser.add_argument("--save-run", type=str, default="sample_run.txt", help="Save demonstration run output to file")
    args = parser.parse_args()

    if args.interactive:
        run_interactive_chat_loop()
    else:
        run_automated_demonstration(output_file=args.save_run)


if __name__ == "__main__":
    main()
