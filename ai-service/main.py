"""
================================================================================
KYROBANK AML RISK ANALYSIS ENGINE - Python AI Microservice (FastAPI + Ollama)
================================================================================
Interacts with an internal Ollama LLM instance (default port 11434) to conduct
automated Anti-Money Laundering (AML) risk classification on high-value payments.
"""

import json
import logging
import os
from typing import Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import httpx

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("AML-Risk-Engine")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

app = FastAPI(
    title="KyroBank AML Risk Microservice",
    version="1.0.0",
    description="Enterprise Anti-Money Laundering & Sanctions Risk Evaluator"
)

# ------------------------------------------------------------------------------
# Request & Response Models
# ------------------------------------------------------------------------------
class TransactionRiskRequest(BaseModel):
    transactionRef: Optional[str] = Field(None, example="TXN-20260918-9F8A1B2C")
    paymentType: str = Field(..., example="SWIFT")
    amount: float = Field(..., gt=0, example=5000000.00)
    currency: str = Field(default="INR", example="INR")
    makerId: str = Field(..., example="maker@kyrobank.com")
    destinationAccount: Optional[str] = Field(None, example="AE1234567890123456789")
    countryCode: Optional[str] = Field(default="IN", example="AE")
    notes: Optional[str] = Field(None, example="Consulting services payment to offshore entity")


class RiskAssessmentResponse(BaseModel):
    transactionRef: Optional[str]
    riskLevel: str = Field(..., description="LOW, MEDIUM, or HIGH")
    riskScore: float = Field(..., ge=0.0, le=1.0, description="Normalized score (0.0=safe, 1.0=critical)")
    explanation: str = Field(..., description="Key compliance and risk breakdown")
    model: str = Field(default=OLLAMA_MODEL)


# ------------------------------------------------------------------------------
# Core Analysis Endpoint
# ------------------------------------------------------------------------------
@app.post(
    "/api/v1/analyze-risk",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate transaction risk with local LLM"
)
async def analyze_transaction_risk(tx: TransactionRiskRequest):
    logger.info(f"Incoming risk evaluation request: Ref={tx.transactionRef}, Type={tx.paymentType}, Amount={tx.amount}")

    system_prompt = (
        "You are an automated Banking Anti-Money Laundering (AML) Compliance Engine. "
        "Analyze the provided transaction parameters and classify risk into one of three values: LOW, MEDIUM, or HIGH. "
        "Strictly output only a valid JSON object matching this schema without markdown or additional text:\n"
        "{\n"
        '  "riskLevel": "LOW" | "MEDIUM" | "HIGH",\n'
        '  "riskScore": float between 0.00 and 1.00,\n'
        '  "explanation": "concise explanation of AML indicators, velocity, and jurisdictional risk"\n'
        "}"
    )

    user_prompt = (
        f"TRANSACTION DETAILS:\n"
        f"- Reference: {tx.transactionRef}\n"
        f"- Payment Channel: {tx.paymentType}\n"
        f"- Amount: {tx.currency} {tx.amount:,.2f}\n"
        f"- Originating Maker: {tx.makerId}\n"
        f"- Target Country: {tx.countryCode}\n"
        f"- Additional Context: {tx.notes or 'Standard remittance'}\n"
    )

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": f"{system_prompt}\n\n{user_prompt}",
        "stream": False,
        "format": "json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            
            if response.status_code != 200:
                logger.warning(f"Ollama returned HTTP {response.status_code}. Executing rule-based risk fallback.")
                return execute_rule_based_fallback(tx)

            data = response.json()
            raw_output = data.get("response", "{}")
            logger.debug(f"Raw LLM output: {raw_output}")

            parsed = json.loads(raw_output)
            risk_level = parsed.get("riskLevel", "").upper()
            if risk_level not in ["LOW", "MEDIUM", "HIGH"]:
                risk_level = "MEDIUM"

            return RiskAssessmentResponse(
                transactionRef=tx.transactionRef,
                riskLevel=risk_level,
                riskScore=float(parsed.get("riskScore", 0.5)),
                explanation=parsed.get("explanation", "Assessment completed via AI engine."),
                model=OLLAMA_MODEL
            )

    except (httpx.RequestError, json.JSONDecodeError) as err:
        logger.error(f"Inference error with Ollama at {OLLAMA_BASE_URL}: {str(err)}. Activating fallback.")
        return execute_rule_based_fallback(tx)


def execute_rule_based_fallback(tx: TransactionRiskRequest) -> RiskAssessmentResponse:
    """Deterministic banking rule engine fallback if LLM endpoint is unreachable."""
    is_cross_border = tx.paymentType.upper() == "SWIFT" or (tx.countryCode and tx.countryCode.upper() not in ["IN", "DOMESTIC"])
    is_high_value = tx.amount >= 2000000.0

    if is_cross_border and is_high_value:
        return RiskAssessmentResponse(
            transactionRef=tx.transactionRef,
            riskLevel="HIGH",
            riskScore=0.88,
            explanation="Deterministic Rule Flag: High-value cross-border transaction exceeding threshold limits (OFAC/FATF High-Risk Watchlist review required).",
            model="deterministic-fallback-rules"
        )
    elif is_high_value:
        return RiskAssessmentResponse(
            transactionRef=tx.transactionRef,
            riskLevel="MEDIUM",
            riskScore=0.55,
            explanation="Deterministic Rule Flag: Large domestic transfer exceeding ₹20,00,000 threshold. Maker-Checker manual confirmation required.",
            model="deterministic-fallback-rules"
        )
    else:
        return RiskAssessmentResponse(
            transactionRef=tx.transactionRef,
            riskLevel="LOW",
            riskScore=0.08,
            explanation="Standard low-risk transactional pattern within velocity boundaries.",
            model="deterministic-fallback-rules"
        )


@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "UP", "service": "KyroBank AML Risk Engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
