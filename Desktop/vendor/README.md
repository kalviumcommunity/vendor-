# LLM Chat Completion & Prompt Engineering Project

A minimal, secure, and professional Python project demonstrating chat completion API integration, prompt engineering variations, and system/user role dynamics with OpenAI-compatible LLM APIs.

---

## 1. Project Overview

This project demonstrates how to connect to an LLM service via an OpenAI-compatible REST API. It showcases credential security, structured HTTP requests, event logging, error handling (`401`, `429`), and prompt comparison to evaluate how system instructions and constraints influence model outputs.

---

## 2. Request-Response Cycle

```text
User prompt & System instructions
               ↓
         Python script
               ↓
          API request
               ↓
           LLM model
               ↓
          API response
               ↓
    Extract response message
               ↓
        Display answer
```

---

## 3. System vs. User Roles

* **`system` Role**: Sets the global persona, tone, guardrails, and behavioral boundaries for the LLM. It defines *how* the model should think and behave across all subsequent turns.
* **`user` Role**: Contains the specific question, instruction, or task submitted by the end user. It defines *what* specific problem the model should solve.

---

## 4. Prompt Variations Comparison

### Variation 1: Generic & Ambiguous
* **System Message:** `"You are an assistant."`
* **User Prompt:** `"Explain APIs."`
* **Model Output:**
  ```text
  An API, or Application Programming Interface, is a set of rules and protocols that allows different software applications to communicate with each other. APIs define the methods and data formats that applications can use to request and exchange information. They are used in web development, operating systems, and hardware interfaces to enable seamless integration and modular software architecture.
  ```
* **Observation:** The output is generic, lengthy, and lacks focus or targeted audience context.

---

### Variation 2: Clear & Role-Constrained (Chosen Prompt)
* **System Message:** `"You are an expert software engineering educator who explains complex technical concepts concisely."`
* **User Prompt:** `"Explain what an API is in exactly one clear, beginner-friendly sentence with an analogy."`
* **Model Output:**
  ```text
  An API acts like a restaurant waiter that takes your order, delivers it to the kitchen, and brings back the prepared meal, allowing two different computer systems to talk to and request services from each other seamlessly.
  ```
* **Observation:** Highly concise, beginner-friendly, uses an engaging analogy, and strictly respects the one-sentence constraint.

---

## 5. Short Note: Documenting the Chosen Prompt

> **Chosen Prompt:** **Variation 2** was selected because assigning a specialized persona (`software engineering educator`) combined with explicit constraints (`exactly one sentence`, `beginner-friendly`, `with an analogy`) produced a vastly superior, memorable, and deterministic response compared to the unconstrained prompt.

---

## 6. What Makes a Prompt Clear vs. Ambiguous

| Dimension | Ambiguous Prompt | Clear Prompt |
| :--- | :--- | :--- |
| **Persona** | None / Generic ("You are an assistant") | Explicit ("Expert educator", "Senior code reviewer") |
| **Task Scope** | Open-ended ("Explain APIs") | Well-bounded ("Explain in exactly 1 sentence") |
| **Audience** | Unspecified | Specified ("Beginner-friendly") |
| **Output Format** | Unconstrained | Constrained (Analogy, bullet points, JSON, etc.) |

---

## 7. How to Constrain Output to a Specific Format

To force the model into strict, deterministic formats (e.g., JSON, markdown table, YAML):
1. **System Prompt Directives**: Explicitly instruct format (e.g., *"Respond ONLY with valid JSON conforming to the provided schema. Do not include markdown ticks or conversational text."*).
2. **API-Level Constraints**: Use API parameters such as `response_format={"type": "json_object"}` or Structured Outputs (`json_schema`).
3. **Few-Shot Examples**: Provide 1–2 input/output formatting examples directly in the prompt context.

---

## 8. API Key Security & Configuration

* **Runtime Loading**: Stored in a `.env` file and loaded dynamically via `python-dotenv`.
* **Version Control Protection**: `.env` is excluded in `.gitignore` to prevent secret leaks.
* **Zero Leakage**: Credentials are never printed to console or written to log files.

---

## 9. Error Handling

* **`401 Unauthorized`**: Authentication error indicating missing, revoked, or incorrect API keys.
* **`429 Too Many Requests`**: Rate limit / token quota exceeded.
* **Connection / Timeout Errors**: Gracefully handled without terminating the application ungracefully.

---

## 10. Running the Project

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure your .env file
API_KEY=your_actual_api_key_here

# 3. Run prompt comparison
python api_call.py
```
