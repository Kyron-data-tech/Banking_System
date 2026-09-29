import asyncio

import httpx

from main import (
    TransactionRiskRequest,
    analyze_transaction_risk,
    execute_rule_based_fallback,
)


class FakeResponse:
    status_code = 200

    def json(self):
        return {
            "response": '{"riskLevel":"MEDIUM","riskScore":0.42,"explanation":"Velocity review required"}'
        }


class FakeAsyncClient:
    def __init__(self, **kwargs):
        self.timeout = kwargs.get("timeout")

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return False

    async def post(self, url, json):
        assert url.endswith("/api/generate")
        assert json["stream"] is False
        assert json["format"] == "json"
        return FakeResponse()


class OfflineAsyncClient(FakeAsyncClient):
    async def post(self, url, json):
        raise httpx.ConnectError("Ollama is offline")


def make_request(**overrides):
    values = {
        "transactionRef": "TX-100",
        "paymentType": "NEFT",
        "amount": 100000.0,
        "currency": "INR",
        "makerId": "maker@kyrobank.com",
        "countryCode": "IN",
        "notes": "Supplier settlement",
    }
    values.update(overrides)
    return TransactionRiskRequest(**values)


def test_calls_ollama_and_parses_json(monkeypatch):
    monkeypatch.setattr("main.httpx.AsyncClient", FakeAsyncClient)

    result = asyncio.run(analyze_transaction_risk(make_request()))

    assert result.riskLevel == "MEDIUM"
    assert result.riskScore == 0.42
    assert result.model == "llama3"
    assert "Velocity review" in result.explanation


def test_uses_deterministic_fallback_when_ollama_is_unavailable(monkeypatch):
    monkeypatch.setattr("main.httpx.AsyncClient", OfflineAsyncClient)

    result = asyncio.run(
        analyze_transaction_risk(
            make_request(paymentType="SWIFT", amount=5_000_000.0, countryCode="AE")
        )
    )

    assert result.riskLevel == "HIGH"
    assert result.riskScore == 0.88
    assert result.model == "deterministic-fallback-rules"


def test_rule_fallback_marks_normal_domestic_payment_low_risk():
    result = execute_rule_based_fallback(make_request())

    assert result.riskLevel == "LOW"
    assert result.riskScore == 0.08
