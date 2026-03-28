# Fin-Resilience Bridge (FRB) 🛡️
**Bridging Human Intent and Complex BFSI Ecosystems**

## 1. Chosen Vertical: Financial Inclusion & Insurance Continuity
FRB is a multimodal "intent-to-action" engine designed to prevent insurance lapses and financial exclusion for vulnerable users.

## 2. Approach & Logic
Leveraging 6 years of BFSI domain expertise, this solution uses a **Multi-Stage Agentic Workflow**:
1. **Multimodal Ingestion:** Extracts intent from messy inputs (e.g., a photo of a termination letter or a frantic voice note about a missed premium).
2. **Contextual Reasoning (The Bridge):** Uses Gemini 3 Flash to map the "human chaos" to a structured Insurance/Banking schema. It identifies the 'Lapse Risk' based on sentiment and extracted document dates.
3. **Actionable Triage:** Generates a JSON-based "Rescue Protocol" including:
   - Grace period calculations.
   - Policy reinstatement steps.
   - Automated "Financial Hardship" letter drafts for the insurer.

## 3. How the Solution Works
- **Unstructured Input:** A user uploads a photo of a "Notice of Intent to Lapse" and a voice note: *"I can't pay this month due to a medical emergency."*
- **Structured Output:** - `risk_level`: CRITICAL (Lapse within 5 days)
  - `detected_hardship`: Medical
  - `mitigation_strategy`: Requesting 15-day extension + Premium Waiver eligibility check.
- **Verification:** A self-correction loop ensures no "hallucinated" financial advice is given—only verified policy-retention steps.

## 4. Key Assumptions
- Demonstrates a "Human-in-the-loop" model for final financial commitments.
- Simulated API endpoints for real-world insurer communication.

## 5. Google Services
- **Gemini 3 Flash:** For high-speed multimodal reasoning.
- **Google Antigravity:** For agent-driven development and testing.