"""
app/config.py

Central place for all configuration values that come from the environment.
Nothing in the rest of the app should hardcode a model name, secret, or
file path directly — it should import Settings from here instead. This is
the fix for the earlier lesson: when Gemini forced a model migration
mid-project, we had to hunt down a hardcoded string. Now it's one place.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Gemini ---
    gemini_api_key: str
    gemini_model_name: str = "gemini-3.5-flash"

    # --- Internal service auth ---
    # This is the shared-secret mechanism from the handoff doc (Section 8.3):
    # the AI service isn't a citizen/officer/contractor/admin, so it doesn't
    # use the Node backend's JWT/RBAC system. Instead, requests coming FROM
    # the Node backend TO this service (if we ever add such calls), and
    # requests going the other way that this service makes back into Node,
    # get authenticated with a simple shared secret in a custom header.
    ai_service_secret: str

    # --- Embedding / RAG ---
    embedding_model_name: str = "all-MiniLM-L6-v2"

    # --- Paths ---
    base_dir: Path = Path(__file__).parent.parent
    faiss_index_path: Path = base_dir / "data" / "index" / "irc_guidelines.faiss"
    faiss_meta_path: Path = base_dir / "data" / "index" / "irc_guidelines_meta.json"


settings = Settings()
