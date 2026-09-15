import os
import uuid
from abc import ABC, abstractmethod
from pathlib import Path


class StorageError(Exception):
    pass


class StorageService(ABC):
    @abstractmethod
    def save(self, file_content: bytes, original_filename: str, folder: str = "") -> str:
        """Save a file and return the stored path/URL."""

    @abstractmethod
    def delete(self, file_path: str) -> None:
        """Delete a file by its stored path."""

    @abstractmethod
    def get_url(self, file_path: str) -> str:
        """Return a publicly accessible URL for the file."""


class LocalStorageService(StorageService):
    def __init__(self, base_dir: str = "uploads") -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _generate_safe_name(self, original_filename: str) -> str:
        ext = Path(original_filename).suffix.lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        return safe_name

    def save(self, file_content: bytes, original_filename: str, folder: str = "") -> str:
        target_dir = self.base_dir / folder if folder else self.base_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        safe_name = self._generate_safe_name(original_filename)
        file_path = target_dir / safe_name

        try:
            with open(file_path, "wb") as f:
                f.write(file_content)
        except OSError as e:
            raise StorageError(f"Failed to save file: {e}") from e

        return str(file_path)

    def delete(self, file_path: str) -> None:
        try:
            path = Path(file_path)
            if path.exists():
                path.unlink()
        except OSError:
            pass

    def get_url(self, file_path: str) -> str:
        path = Path(file_path)
        # Return relative path from uploads folder
        try:
            relative = path.relative_to(self.base_dir)
            return f"/uploads/{relative.as_posix()}"
        except ValueError:
            return f"/uploads/{path.name}"
