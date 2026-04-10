"""
Modelhub Load Test — locustfile.py
Run: locust -f locustfile.py --headless -u 1000 -r 50 --run-time 60s --host http://localhost:8000

Simulates 3 types of users:
  - BrowseUser   (70%) : anonymous, just browses models list & detail
  - APIUser      (20%) : authenticated, calls /predict with API key
  - AuthUser     (10%) : logs in, fetches profile, browses

Resume claim: "load-tested for 1,000+ concurrent users"
"""
import json
import random
from locust import HttpUser, task, between, FastHttpUser


# ── Anonymous browser (no auth) ─────────────────────────────────────────────

class BrowseUser(FastHttpUser):
    """Simulates a researcher browsing public model listings."""
    weight = 7
    wait_time = between(0.5, 2)

    def on_start(self):
        # Fetch model IDs once at the start so tasks can reference them
        r = self.client.get("/api/v1/models/", name="/api/v1/models/")
        if r.status_code == 200:
            models = r.json()
            self.model_ids = [m["id"] for m in models] if models else [1, 2]
        else:
            self.model_ids = [1, 2]

    @task(5)
    def list_models(self):
        self.client.get("/api/v1/models/", name="/api/v1/models/")

    @task(3)
    def list_models_filtered(self):
        framework = random.choice(["sklearn", "pytorch", "tensorflow", ""])
        params = f"?framework={framework}" if framework else ""
        self.client.get(f"/api/v1/models/{params}", name="/api/v1/models/?framework=<fw>")

    @task(4)
    def view_model_detail(self):
        model_id = random.choice(self.model_ids)
        self.client.get(f"/api/v1/models/{model_id}", name="/api/v1/models/<id>")

    @task(1)
    def health_check(self):
        self.client.get("/health", name="/health")


# ── API key user (programmatic access) ──────────────────────────────────────

class APIUser(FastHttpUser):
    """
    Simulates a developer hitting /predict with an API key.
    Set your real API key in the MODELHUB_API_KEY env var, or hardcode below.
    """
    weight = 2
    wait_time = between(0.2, 1)

    # Change this to a real key from Settings page, or leave blank to skip predict tasks
    API_KEY = ""

    SAMPLE_INPUTS = [
        [[5.1, 3.5, 1.4, 0.2]],
        [[6.3, 3.3, 4.7, 1.6]],
        [[7.2, 3.0, 5.8, 1.6]],
        [[4.9, 3.0, 1.4, 0.2]],
    ]

    def on_start(self):
        import os
        self.api_key = os.getenv("MODELHUB_API_KEY", self.API_KEY)
        r = self.client.get("/api/v1/models/", name="/api/v1/models/")
        if r.status_code == 200:
            models = r.json()
            # Only use models that support predict (joblib/pkl/onnx)
            self.predict_ids = [
                m["id"] for m in models
                if m.get("versions") and m["versions"][0]["format"] in ("joblib", "pkl", "onnx")
            ] or [2]
        else:
            self.predict_ids = [2]

    @task(6)
    def predict(self):
        if not self.api_key:
            return  # skip if no key configured
        model_id = random.choice(self.predict_ids)
        inp = random.choice(self.SAMPLE_INPUTS)
        self.client.post(
            f"/api/v1/models/{model_id}/predict",
            json={"input": inp},
            headers={"X-API-Key": self.api_key},
            name="/api/v1/models/<id>/predict",
        )

    @task(3)
    def list_models(self):
        self.client.get("/api/v1/models/", name="/api/v1/models/")

    @task(1)
    def view_model(self):
        model_id = random.choice(self.predict_ids)
        self.client.get(f"/api/v1/models/{model_id}", name="/api/v1/models/<id>")


# ── Authenticated user (JWT login flow) ──────────────────────────────────────

class AuthUser(FastHttpUser):
    """Simulates a logged-in user: login → browse → view profile."""
    weight = 1
    wait_time = between(1, 3)

    # Change to a real test account
    TEST_EMAIL = "dev@test.com"
    TEST_PASSWORD = "dev12345678"

    def on_start(self):
        """Log in and store token."""
        r = self.client.post(
            "/api/v1/auth/token",
            data={"username": self.TEST_EMAIL, "password": self.TEST_PASSWORD},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            name="/api/v1/auth/token",
        )
        if r.status_code == 200:
            self.token = r.json()["access_token"]
        else:
            self.token = None

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def browse_models(self):
        self.client.get("/api/v1/models/", name="/api/v1/models/")

    @task(2)
    def get_profile(self):
        self.client.get("/api/v1/users/me", headers=self._auth_headers(), name="/api/v1/users/me")

    @task(1)
    def get_api_key_status(self):
        self.client.get("/api/v1/users/me/api-key", headers=self._auth_headers(), name="/api/v1/users/me/api-key")
