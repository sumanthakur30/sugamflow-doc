# CRM Sprint 10 — AI + labs

**Branch:** `feature/crm-sprint10-ai-labs`  
**Date:** 2026-08-09

## Delivered
- `LlmProvider` SPI (`HeuristicLlmProvider` / `HttpLlmProvider`); SUMMARY, NBA, DRAFT route through SPI.
- `AI_CALLS_MONTH` meter (V24) incremented on each AI insight persist; meters snapshot includes `aiCallsMonth`.
- `GET /api/v1/crm/ai/status` — enabled, provider, model, HTTP readiness.
- Insights payload enriched with `provider` + `latencyMs`.
- Light labs: `GET /api/v1/crm/labs/territories` (read-only scaffold).
- UI: Ping shows AI provider; Enterprise AI panel status; Ops meters show AI usage; territories list.

## Try
1. Enterprise → Refresh AI status (provider HEURISTIC by default).
2. Run Summarize / NBA → Ops meters AI count increases; insight payload has provider.
3. Optional: `crm.ai.provider=HTTP` + `crm.ai.http-url=…` for remote completions.
