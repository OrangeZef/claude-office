"""Import existing Claude Code sessions from transcript files on startup."""
import re
import logging
from pathlib import Path
from datetime import datetime, UTC

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.db.models import SessionRecord
from app.core.jsonl_parser import get_first_user_prompt

settings = get_settings()

logger = logging.getLogger(__name__)

_DEFAULT_STRIP_PREFIXES: list[str] = []


def _strip_project_prefix(raw_name: str) -> str:
    """Strip known path prefixes from a project directory name.

    Applies longest-match-first so more specific prefixes take priority.
    Falls back to the raw name if the result would be an empty string.
    """
    prefixes: list[str] = getattr(settings, "STRIP_PREFIXES", _DEFAULT_STRIP_PREFIXES)
    # Longest match first
    for prefix in sorted(prefixes, key=len, reverse=True):
        if raw_name.startswith(prefix):
            stripped = raw_name[len(prefix):]
            return stripped if stripped else raw_name
    return raw_name


async def import_existing_sessions(db: AsyncSession) -> int:
    """Scan ~/.claude/projects/ and import any sessions not already in DB.

    Returns the number of sessions imported.
    """
    # Determine projects directory — try in priority order
    projects_dir: Path | None = None

    candidates: list[Path] = []
    if getattr(settings, "CLAUDE_PATH_CONTAINER", ""):
        candidates.append(Path(settings.CLAUDE_PATH_CONTAINER) / "projects")
    candidates.append(Path.home() / ".claude" / "projects")
    candidates.append(Path("/claude-data/projects"))

    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            projects_dir = candidate
            break

    if projects_dir is None:
        logger.warning("session_importer: no Claude projects directory found; skipping import")
        return 0

    logger.info(f"session_importer: scanning {projects_dir}")

    imported = 0
    BATCH_SIZE = 10
    batch_count = 0

    for project_dir in projects_dir.iterdir():
        if not project_dir.is_dir():
            continue

        raw_name = project_dir.name
        project_name = _strip_project_prefix(raw_name)

        for jsonl_path in project_dir.glob("*.jsonl"):
            session_id = jsonl_path.stem

            try:
                # Skip if already in DB
                result = await db.execute(
                    select(SessionRecord).where(SessionRecord.id == session_id)
                )
                if result.scalar_one_or_none() is not None:
                    continue

                # Build display_name from first user prompt (best-effort)
                display_name: str | None = None
                try:
                    raw_prompt = get_first_user_prompt(str(jsonl_path))
                    if raw_prompt and "<task-notification>" not in raw_prompt:
                        flat = re.sub(r"\s+", " ", raw_prompt.strip())
                        display_name = flat[:60] + ("…" if len(flat) > 60 else "")
                except Exception:  # noqa: BLE001
                    pass  # import session without display_name

                # Use file mtime as created_at
                mtime = jsonl_path.stat().st_mtime
                created_at = datetime.fromtimestamp(mtime, tz=UTC)

                session_rec = SessionRecord(
                    id=session_id,
                    project_name=project_name,
                    display_name=display_name,
                    created_at=created_at,
                    updated_at=created_at,
                    status="completed",
                )
                db.add(session_rec)
                imported += 1
                batch_count += 1
                if batch_count % BATCH_SIZE == 0:
                    await db.commit()

            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    f"session_importer: failed to import session {session_id} "
                    f"({jsonl_path}): {exc}"
                )
                continue

    await db.commit()  # final flush for any remainder
    return imported
