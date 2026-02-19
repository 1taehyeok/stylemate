import hashlib
import secrets
from datetime import datetime, timedelta, UTC

from app.config import get_settings

_ADMIN_SESSIONS: dict[str, dict[str, datetime | str]] = {}


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def verify_admin_password(password: str) -> bool:
    settings = get_settings()

    configured = (settings.admin_password_hash or '').strip()
    if not configured:
        return False

    # Supports both:
    # 1) ADMIN_PASSWORD_HASH=<sha256_hex>
    # 2) ADMIN_PASSWORD_HASH=sha256$<salt>$<sha256_hex>
    if configured.startswith('sha256$'):
        parts = configured.split('$', 2)
        if len(parts) != 3:
            return False
        salt = parts[1]
        expected = parts[2]
        candidate = _sha256_hex(f'{salt}{password}')
        return secrets.compare_digest(candidate, expected)

    salt = settings.admin_password_salt or ''
    candidate = _sha256_hex(f'{salt}{password}')
    return secrets.compare_digest(candidate, configured)


def create_admin_session(admin_id: str = 'admin') -> tuple[str, datetime]:
    settings = get_settings()
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.admin_session_ttl_minutes)
    _ADMIN_SESSIONS[token] = {
        'admin_id': admin_id,
        'expires_at': expires_at,
    }
    return token, expires_at


def validate_admin_session(token: str | None) -> str | None:
    if not token:
        return None

    session = _ADMIN_SESSIONS.get(token)
    if not session:
        return None

    expires_at = session.get('expires_at')
    if not isinstance(expires_at, datetime) or expires_at <= datetime.now(UTC):
        _ADMIN_SESSIONS.pop(token, None)
        return None

    admin_id = session.get('admin_id')
    return admin_id if isinstance(admin_id, str) else None
