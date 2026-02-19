import csv
import io
import json
from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import AdminAuditLog
from app.schemas import AdminAuthRequest, AdminAuthResponse, AdminLogResponse
from app.services.admin_audit import write_admin_audit_log
from app.services.admin_security import create_admin_session, validate_admin_session, verify_admin_password

router = APIRouter(prefix='/api/admin', tags=['admin'])


def _client_ip(req: Request) -> str | None:
    return req.client.host if req.client else None


def _parse_detail(detail_text: str | None) -> dict:
    if not detail_text:
        return {}
    try:
        parsed = json.loads(detail_text)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _is_price_changed(detail_text: str | None) -> bool:
    detail = _parse_detail(detail_text)
    before = detail.get('before')
    after = detail.get('after')
    if not isinstance(before, dict) or not isinstance(after, dict):
        return False
    return before.get('price') != after.get('price')


async def _load_logs(
    db: AsyncSession,
    *,
    limit: int,
    event_type: str | None,
    success: bool | None,
    date_from: date | None,
    date_to: date | None,
    price_changes_only: bool,
) -> list[AdminAuditLog]:
    q = select(AdminAuditLog)

    if event_type:
        q = q.where(AdminAuditLog.event_type == event_type)
    if success is not None:
        q = q.where(AdminAuditLog.success == success)

    if date_from:
        start_dt = datetime.combine(date_from, time.min)
        q = q.where(AdminAuditLog.created_at >= start_dt)
    if date_to:
        end_dt = datetime.combine(date_to, time.max)
        q = q.where(AdminAuditLog.created_at <= end_dt)

    # Fetch larger window first when client-side detail filtering is needed.
    fetch_limit = max(1, min(limit * 5 if price_changes_only else limit, 2000))
    rows = (await db.execute(q.order_by(AdminAuditLog.id.desc()).limit(fetch_limit))).scalars().all()

    if price_changes_only:
        rows = [row for row in rows if _is_price_changed(row.detail)]

    return rows[:max(1, min(limit, 500))]


def _to_response(row: AdminAuditLog) -> AdminLogResponse:
    return AdminLogResponse(
        id=row.id,
        event_type=row.event_type,
        success=row.success,
        admin_id=row.admin_id,
        session_token=row.session_token,
        ip_address=row.ip_address,
        user_agent=row.user_agent,
        detail=row.detail,
        created_at=row.created_at,
    )


@router.post('/auth', response_model=AdminAuthResponse)
async def admin_auth(request: AdminAuthRequest, req: Request, db: AsyncSession = Depends(get_db)):
    ok = verify_admin_password(request.password)

    token: str | None = None
    expires_at = None
    if ok:
        token, expires_at = create_admin_session('admin')

    await write_admin_audit_log(
        db,
        event_type='admin_login',
        success=ok,
        admin_id='admin' if ok else None,
        session_token=token,
        ip_address=_client_ip(req),
        user_agent=req.headers.get('user-agent'),
        detail={'device_id': request.device_id},
    )

    if not ok:
        return AdminAuthResponse(success=False, message='Invalid password')

    return AdminAuthResponse(
        success=True,
        message='Authenticated',
        session_token=token,
        expires_at=expires_at,
    )


@router.get('/logs', response_model=list[AdminLogResponse])
async def admin_logs(
    req: Request,
    limit: int = 100,
    event_type: str | None = Query(default=None),
    success: bool | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    price_changes_only: bool = Query(default=False),
    x_admin_session: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    admin_id = validate_admin_session(x_admin_session)
    if not admin_id:
        raise HTTPException(status_code=401, detail='Unauthorized admin session')

    rows = await _load_logs(
        db,
        limit=limit,
        event_type=event_type,
        success=success,
        date_from=date_from,
        date_to=date_to,
        price_changes_only=price_changes_only,
    )

    await write_admin_audit_log(
        db,
        event_type='admin_logs_view',
        success=True,
        admin_id=admin_id,
        session_token=x_admin_session,
        ip_address=_client_ip(req),
        user_agent=req.headers.get('user-agent'),
        detail={
            'limit': limit,
            'event_type': event_type,
            'success': success,
            'date_from': str(date_from) if date_from else None,
            'date_to': str(date_to) if date_to else None,
            'price_changes_only': price_changes_only,
        },
    )

    return [_to_response(row) for row in rows]


@router.get('/logs/export.csv')
async def admin_logs_export_csv(
    req: Request,
    limit: int = 500,
    event_type: str | None = Query(default=None),
    success: bool | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    price_changes_only: bool = Query(default=False),
    x_admin_session: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    admin_id = validate_admin_session(x_admin_session)
    if not admin_id:
        raise HTTPException(status_code=401, detail='Unauthorized admin session')

    rows = await _load_logs(
        db,
        limit=limit,
        event_type=event_type,
        success=success,
        date_from=date_from,
        date_to=date_to,
        price_changes_only=price_changes_only,
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['id', 'event_type', 'success', 'admin_id', 'ip_address', 'created_at', 'detail'])
    for row in rows:
        writer.writerow([
            row.id,
            row.event_type,
            row.success,
            row.admin_id or '',
            row.ip_address or '',
            row.created_at.isoformat() if row.created_at else '',
            row.detail or '',
        ])

    await write_admin_audit_log(
        db,
        event_type='admin_logs_export_csv',
        success=True,
        admin_id=admin_id,
        session_token=x_admin_session,
        ip_address=_client_ip(req),
        user_agent=req.headers.get('user-agent'),
        detail={'rows': len(rows)},
    )

    csv_text = buffer.getvalue()
    filename = f"admin_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([csv_text]),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename={filename}'},
    )
