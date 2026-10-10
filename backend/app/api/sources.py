"""API route shim – re-exports the sources router from app.sources.

The router is defined in app/sources.py (alongside its business logic).
main.py imports it as ``from app.api import sources``; this module
makes that import path work without moving any code.
"""
from app.sources import router  # noqa: F401  (re-export)

