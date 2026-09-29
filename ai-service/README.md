# KyroBank AML AI Service

This FastAPI service is the Python side of the Java banking integration.

## Run locally

```powershell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The service calls Ollama at `OLLAMA_BASE_URL` using `OLLAMA_MODEL`. If Ollama is unavailable, it returns a deterministic rule-based AML assessment so the Java transaction workflow remains available for demonstrations and testing.

## Test

```powershell
python -m pytest -q
```

## Java integration contract

Java sends `POST /api/v1/analyze-risk` with transaction reference, payment type, amount, currency, maker ID, country, and notes. The service responds with `riskLevel`, `riskScore`, `explanation`, and `model`.
