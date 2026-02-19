import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminAuditLog


async def write_admin_audit_log(
    db: AsyncSession,
    *,
    event_type: str,
    success: bool,
    admin_id: str | None = None,
    session_token: str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    payload = json.dumps(detail, ensure_ascii=False) if detail is not None else None
    db.add(
        AdminAuditLog(
            event_type=event_type,
            success=success,
            admin_id=admin_id,
            session_token=session_token,
            ip_address=ip_address,
            user_agent=user_agent,
            detail=payload,
        )
    )
    await db.commit()
