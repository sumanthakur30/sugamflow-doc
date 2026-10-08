# Address Master API Contract

This document defines the backend contract for dynamic State/City master data used across `shop-management-ui` forms (registration, shops, customers, suppliers, and future address modules).

## Endpoint

- Method: `GET`
- Preferred path: `/api/v1/master-data/states-cities`

UI currently supports these fallback paths too:

- `/api/v1/locations/states-cities`
- `/api/v1/master/states-cities`

## Supported Response Shapes

The UI supports all three shapes below:

### Preferred

```json
{
  "data": [
    {
      "state": "Delhi",
      "cities": ["New Delhi", "North Delhi", "South Delhi", "Dwarka", "Rohini"]
    },
    {
      "state": "Maharashtra",
      "cities": ["Mumbai", "Pune", "Nagpur", "Nashik"]
    }
  ]
}
```

### Also accepted

```json
[
  {
    "state": "Delhi",
    "cities": ["New Delhi", "Dwarka"]
  }
]
```

```json
{
  "states": [
    {
      "state": "Delhi",
      "cities": ["New Delhi", "Dwarka"]
    }
  ]
}
```

## Data Constraints

For each entry:

- `state`:
  - required
  - trimmed non-empty string
  - unique (case-insensitive) across dataset
- `cities`:
  - required non-empty array
  - each city must be trimmed non-empty string
  - unique (case-insensitive) within the state

## Ordering Recommendations

- sort states alphabetically
- sort cities alphabetically per state

This improves dropdown UX consistency.

## Performance and Caching

Recommended:

- return compact payload with only required fields (`state`, `cities`)
- enable cache headers (`Cache-Control`, `ETag`) for faster repeat loads

## Access Guidance

Because public registration uses this data, endpoint should be:

- public read-only, or
- accessible via gateway without strict internal auth

## Frontend Fallback Behavior

If API is unavailable or returns invalid shape, frontend falls back to static India master data and continues working.

Manual state/city entry remains available via `Other (type manually)` in the selector, so onboarding is never blocked by incomplete master data.
