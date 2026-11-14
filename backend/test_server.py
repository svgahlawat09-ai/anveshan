
from fastapi.testclient import TestClient
from fastapi import HTTPException
import pytest

from backend import server

client = TestClient(server.app)


def test_home_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "ProofPulse backend is working!"
    }


def test_short_claim_is_rejected():
    response = client.post(
        "/investigate",
        json={"claim": "Hi"}
    )

    assert response.status_code == 422


def test_investigation_with_evidence(monkeypatch):
    fake_evidence = [
        {
            "title": "Exercise research",
            "url": "https://example.com/research",
            "source_domain": "example.com",
            "content": "Exercise can improve cardiovascular health.",
            "relevance_score": 0.9
        }
    ]

    monkeypatch.setattr(
        server,
        "search_evidence",
        lambda claim: fake_evidence
    )
    monkeypatch.setattr(
        server,
        "analyze_evidence_with_ai",
        lambda claim, evidence , language = "en": {
    "model": "test-model",
    "analysis": {
        "assessment": "supported",
        "explanation": "The evidence supports the claim.",
        "supporting_sources": [1],
        "contradicting_sources": [],
        "limitations": "Only the supplied test evidence was evaluated."
    }
}
    )

    response = client.post(
        "/investigate",
        json={
            "claim": "Regular exercise improves cardiovascular health."
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "evidence_retrieved"
    assert data["evidence_count"] == 1
    assert len(data["evidence"]) == 1
    assert data["evidence"][0]["source_domain"] == "example.com"
    assert data["assessment"] == "supported"
    assert data["explanation"] == "The evidence supports the claim."
    assert data["supporting_sources"] == [1]
    assert data["contradicting_sources"] == []
    assert "limitations" in data

def test_investigation_with_no_evidence(monkeypatch):
    """The AI should not be called when no evidence is found."""

    monkeypatch.setattr(
        server,
        "search_evidence",
        lambda claim: []
    )

    def unexpected_ai_call(claim, evidence):
        pytest.fail("AI should not be called when evidence is empty.")

    monkeypatch.setattr(
        server,
        "analyze_evidence_with_ai",
        unexpected_ai_call
    )

    response = client.post(
        "/investigate",
        json={
            "claim": "A completely unverified example claim."
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "no_evidence_found"
    assert data["evidence_count"] == 0
    assert data["evidence"] == []
    assert data["ai_model"] == "not_used"
    assert data["assessment"] == "insufficient_evidence"
    assert "no sources" in data["explanation"].lower()
    assert data["supporting_sources"] == []
    assert data["contradicting_sources"] == []

 
 
class FakeResponse:
    def __init__(self, results):
        self.results = results

    def raise_for_status(self):
        pass

    def json(self):
        return {"results": self.results}

def test_evaluator_labels_relevant_text():
    evidence = [
        {
            "title": "Exercise and cardiovascular health",
            "url": "https://example.com/exercise",
            "source_domain": "example.com",
            "content": "Regular exercise improves cardiovascular health.",
            "relevance_score": 0.9
        }
    ]

    result = server.evaluate_evidence(
        "Regular exercise improves cardiovascular health.",
        evidence
    )

    assert len(result) == 1
    assert result[0]["evidence_label"] == "potentially_relevant"
    assert result[0]["text_overlap"] > 0


def test_duplicate_urls_are_removed(monkeypatch):
    duplicate_results = [
        {
            "title": "Article A",
            "url": "https://example.com/article",
            "content": "First result",
            "score": 0.9
        },
        {
            "title": "Article A duplicate",
            "url": "https://example.com/article",
            "content": "Duplicate result",
            "score": 0.8
        }
    ]

    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    monkeypatch.setattr(
        server.requests,
        "post",
        lambda *args, **kwargs: FakeResponse(duplicate_results)
    )

    result = server.search_evidence("Example claim")

    assert len(result) == 1
    assert result[0]["source_domain"] == "example.com"

def test_whitespace_only_claim_is_rejected():
    response = client.post(
        "/investigate",
        json={"claim": "            "}
    )

    assert response.status_code == 422


def test_claim_whitespace_is_trimmed(monkeypatch):
    monkeypatch.setattr(
        server,
        "search_evidence",
        lambda claim: []
    )

    response = client.post(
        "/investigate",
        json={
            "claim": "  Regular exercise improves health.  "
        }
    )

    assert response.status_code == 200
    assert response.json()["claim"] == (
        "Regular exercise improves health."
    )
    
def test_search_rejects_unexpected_response(monkeypatch):
    # Give the function a dummy API key.
    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    # Simulate Tavily returning an invalid results structure.
    monkeypatch.setattr(
        server.requests,
        "post",
        lambda *args, **kwargs: FakeResponse("unexpected text")
    )

    # The function should raise an HTTP 502 error.
    try:
        server.search_evidence("Example claim")
        assert False, "Expected HTTPException"
    except HTTPException as error:
        assert error.status_code == 502


def test_search_skips_malformed_results(monkeypatch):
    # Simulate one valid result and one malformed result.
    results = [
        {
            "title": "Valid article",
            "url": "https://example.com/article",
            "content": "Sample evidence",
            "score": 0.9
        },
        "unexpected text"
    ]

    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    # Replace the real network request with our fake response.
    monkeypatch.setattr(
        server.requests,
        "post",
        lambda *args, **kwargs: FakeResponse(results)
    )

    evidence = server.search_evidence("Example claim")

    # Only the valid result should remain.
    assert len(evidence) == 1
    assert evidence[0]["source_domain"] == "example.com"

def test_search_handles_timeout(monkeypatch):
    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    def raise_timeout(*args, **kwargs):
        raise server.requests.exceptions.Timeout()

    monkeypatch.setattr(
        server.requests,
        "post",
        raise_timeout
    )

    try:
        server.search_evidence("Example claim")
        assert False, "Expected HTTPException"
    except HTTPException as error:
        assert error.status_code == 504

def test_search_handles_network_error(monkeypatch):
    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    def raise_connection_error(*args, **kwargs):
        raise server.requests.exceptions.ConnectionError()

    monkeypatch.setattr(
        server.requests,
        "post",
        raise_connection_error
    )

    try:
        server.search_evidence("Example claim")
        assert False, "Expected HTTPException"
    except HTTPException as error:
        assert error.status_code == 502

def test_search_fails_when_api_key_is_missing(monkeypatch):
    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        None
    )

    with pytest.raises(HTTPException) as error:
        server.search_evidence("Example claim")

    assert error.value.status_code == 500


def test_search_handles_http_error(monkeypatch):
    monkeypatch.setattr(
        server,
        "TAVILY_API_KEY",
        "test-key"
    )

    def raise_http_error(*args, **kwargs):
        response = server.requests.Response()
        response.status_code = 500
        raise server.requests.exceptions.HTTPError(
            response=response
        )

    monkeypatch.setattr(
        server.requests,
        "post",
        raise_http_error
    )

    with pytest.raises(HTTPException) as error:
        server.search_evidence("Example claim")

    assert error.value.status_code == 502


def test_ai_analysis_success(monkeypatch):
    """The AI function should return the model and structured analysis."""

    monkeypatch.setattr(
        server.os,
        "getenv",
        lambda name: "test-key" if name == "OPENROUTER_API_KEY" else None
    )

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {
                "model": "test-model",
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"assessment":"supported",'
                                '"explanation":"The evidence supports the claim.",'
                                '"supporting_sources":[1],'
                                '"contradicting_sources":[],'
                                '"limitations":"Only the supplied evidence was evaluated."}'
                            )
                        }
                    }
                ]
            }

    monkeypatch.setattr(
        server.requests,
        "post",
        lambda *args, **kwargs: FakeResponse()
    )

    evidence = [
        {
            "title": "Test source",
            "url": "https://example.com",
            "source_domain": "example.com",
            "content": "The evidence supports the claim."
        }
    ]

    result = server.analyze_evidence_with_ai(
        "A test claim",
        evidence
    )

    assert result["model"] == "test-model"
    assert result["analysis"]["assessment"] == "supported"
    assert result["analysis"]["explanation"] == "The evidence supports the claim."
    assert result["analysis"]["supporting_sources"] == [1]
    assert result["analysis"]["contradicting_sources"] == []

    def fake_post(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(server.requests, "post", fake_post)

    result = server.analyze_evidence_with_ai(
        "The Earth revolves around the Sun.",
        [
            {
                "title": "Earth's orbit",
                "url": "https://example.com/earth",
                "content": "Earth orbits the Sun."
            }
        ]
    )

    assert result["model"] == "test-model"
    assert result["analysis"]["explanation"] == "The evidence supports the claim."


def test_ai_analysis_fails_when_api_key_is_missing(monkeypatch):
    """The function should stop if the API key is missing."""

    monkeypatch.setattr(
        server.os,
        "getenv",
        lambda name: None
    )

    with pytest.raises(HTTPException) as error:
        server.analyze_evidence_with_ai(
            "The Earth revolves around the Sun.",
            []
        )

    assert error.value.status_code == 500


def test_ai_analysis_handles_timeout(monkeypatch):
    """The function should handle a slow AI service."""

    monkeypatch.setattr(
        server.os,
        "getenv",
        lambda name: "test-key"
    )

    def fake_post(*args, **kwargs):
        raise server.requests.exceptions.Timeout()

    monkeypatch.setattr(server.requests, "post", fake_post)

    with pytest.raises(HTTPException) as error:
        server.analyze_evidence_with_ai(
            "The Earth revolves around the Sun.",
            []
        )

    assert error.value.status_code == 504


def test_ai_analysis_handles_unexpected_response(monkeypatch):
    """The function should reject a response without the expected structure."""

    monkeypatch.setattr(
        server.os,
        "getenv",
        lambda name: "test-key"
    )

    class FakeResponse:
        def raise_for_status(self):
            pass

        def json(self):
            return {"unexpected": "response"}

    def fake_post(*args, **kwargs):
        return FakeResponse()

    monkeypatch.setattr(server.requests, "post", fake_post)

    with pytest.raises(HTTPException) as error:
        server.analyze_evidence_with_ai(
            "The Earth revolves around the Sun.",
            []
        )


def test_investigation_with_no_evidence_skips_ai(monkeypatch):
    """The AI should not be called when no evidence is found."""

    monkeypatch.setattr(
        server,
        "search_evidence",
        lambda claim: []
    )

    def unexpected_ai_call(claim, evidence):
        pytest.fail("AI should not be called when evidence is empty.")

    monkeypatch.setattr(
        server,
        "analyze_evidence_with_ai",
        unexpected_ai_call
    )

    response = client.post(
        "/investigate",
        json={
            "claim": "The Earth revolves around the Sun."
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "no_evidence_found"
    assert data["evidence_count"] == 0
    assert data["ai_model"] == "not_used"
    assert data["assessment"] == "insufficient_evidence"
    assert "no sources" in data["explanation"].lower()
    assert data["supporting_sources"] == []
    assert data["contradicting_sources"] == []








