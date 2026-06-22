import json
import os
import tempfile
import threading
from pathlib import Path
from typing import Any, Callable


class JSONFileStore:
    """Thread-safe, atomic read/modify/write access to a single JSON file.

    Every mutation holds the lock for the full read-modify-write cycle and
    writes via a temp file + os.replace so a request can never observe or
    leave behind a partially-written file.
    """

    def __init__(self, path: Path, default: dict):
        self._path = path
        self._default = default
        self._lock = threading.Lock()
        self._ensure_file()

    def _ensure_file(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        if not self._path.exists():
            self._write(self._default)

    def read(self) -> dict:
        with self._lock:
            return self._read()

    def mutate(self, fn: Callable[[dict], Any]) -> Any:
        with self._lock:
            data = self._read()
            result = fn(data)
            self._write(data)
            return result

    def _read(self) -> dict:
        with open(self._path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _write(self, data: dict) -> None:
        fd, tmp_path = tempfile.mkstemp(dir=self._path.parent, prefix=".tmp-")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp_path, self._path)
        except Exception:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise
