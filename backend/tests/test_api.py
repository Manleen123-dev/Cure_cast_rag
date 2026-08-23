def test_healthcheck(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.get_json() == {"message": "CureCast API is running."}


def test_symptoms_endpoint_returns_known_symptoms(client):
    response = client.get("/symptoms")

    assert response.status_code == 200
    assert response.get_json() == ["fever", "cough", "fatigue", "headache"]


def test_diseases_endpoint_returns_catalog(client):
    response = client.get("/diseases")
    data = response.get_json()

    assert response.status_code == 200
    assert len(data) == 4
    assert data[0]["Disease"] == "Flu"


def test_predict_requires_at_least_one_known_symptom(client):
    response = client.post("/predict", json={"symptoms": []})
    data = response.get_json()

    assert response.status_code == 400
    assert data["prediction"] is None
    assert data["alternatives"] == []
    assert "not a substitute" in data["disclaimer"].lower()


def test_predict_returns_structured_prediction_payload(client):
    response = client.post("/predict", json={"symptoms": ["fever", "cough", "unknown symptom"]})
    data = response.get_json()

    assert response.status_code == 200
    assert data["selected_symptoms"] == ["fever", "cough"]
    assert data["prediction"]["disease"] == "Flu"
    assert data["prediction"]["confidence"] == 72.0
    assert len(data["alternatives"]) == 3
    assert data["explanation"]["headline"].startswith("Flu")
    assert data["explanation"]["sources"][0]["source"] == "flu.json"
    assert data["retrieval_mode"] == "keyword"
