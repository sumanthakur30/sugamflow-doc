# Lead scoring

The score is a number plus a band. The UI shows both, for example `78 — HOT`. Color supports the word. It is not the only signal.

## Bands

Defaults (`ScoreBandService`):

| Band | Rule |
|---|---|
| HOT | score ≥ hot minimum (default 70) |
| WARM | warm minimum ≤ score < hot minimum (default warm minimum 40) |
| COLD | score < warm minimum |

A new lead is `0 — COLD`.

Ops can change the two thresholds. The rule is `0 <= warmMin <= hotMin <= 100`.

## Rescore

**More → Rescore**, or More tab → AI assistant → Rescore. Recalculates the number and the band from the current rules. Use it after you have logged calls, notes, or qualification answers.

## Priority

Priority is separate from the score band. Values: LOW, MEDIUM, HIGH, HOT. Default on create is MEDIUM. HOT priority is not the same thing as a HOT score.
