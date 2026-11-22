import uuid
from datetime import datetime, timezone
import threading

import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.auth.models import RefreshToken, Role, User, UserRole
from app.modules.auth.schemas import AdminUserRolesReplaceRequest
from app.modules.auth.service import (
    ROLE_ADMIN,
    ROLE_CUSTOMER,
    _lock_users_for_admin_operation,
    activate_user,
    deactivate_user,
    get_admin_user,
    list_admin_users,
    list_roles,
    replace_user_roles,
)


@pytest.fixture()
def db_session(setup_test_database):
    _, SessionLocal = setup_test_database
    with SessionLocal() as session:
        yield session


@pytest.fixture()
def session_factory(setup_test_database):
    _, SessionLocal = setup_test_database
    return SessionLocal


def _create_user(db, *, email=None, username=None, roles=None, is_active=True):
    suffix = uuid.uuid4().hex[:8]
    user = User(
        email=email or f"u-{suffix}@example.com",
        username=username or f"user_{suffix}",
        password_hash="hashed",
        is_active=is_active,
    )
    role_codes = roles or [ROLE_CUSTOMER]
    for code in role_codes:
        role = db.execute(select(Role).where(Role.code == code)).scalar_one()
        user.roles.append(role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _add_refresh(db, user_id):
    rt = RefreshToken(user_id=user_id, token_hash=uuid.uuid4().hex * 2, expires_at=datetime(2099, 1, 1, tzinfo=timezone.utc))
    db.add(rt)
    db.commit()
    db.refresh(rt)
    return rt


def _fresh_session(db_session):
    bind = db_session.get_bind()
    return Session(bind=bind)


def test_list_admin_users_filters_pagination_search(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN], email="actor-admin@example.com")
    _create_user(db_session, roles=[ROLE_CUSTOMER], email="alice@example.com", username="alice", is_active=True)
    _create_user(db_session, roles=[ROLE_CUSTOMER], email="bob@example.com", username="bobby", is_active=False)
    _create_user(db_session, roles=[ROLE_ADMIN, ROLE_CUSTOMER], email="carol@example.com", username="carol")

    items, total = list_admin_users(db_session, q="alice")
    assert total >= 1
    assert any(u.email == "alice@example.com" for u in items)

    items, total = list_admin_users(db_session, is_active=False)
    assert any(u.email == "bob@example.com" for u in items)
    assert all(u.is_active is False for u in items)

    items, total = list_admin_users(db_session, role=ROLE_ADMIN, limit=1, skip=0)
    assert len(items) == 1
    assert total >= 1
    assert all(any(r.code == ROLE_ADMIN for r in u.roles) for u in items)


def test_get_admin_user_existing_and_missing(db_session):
    user = _create_user(db_session)
    found = get_admin_user(db_session, user.id)
    assert found.id == user.id
    with pytest.raises(HTTPException) as exc:
        get_admin_user(db_session, uuid.uuid4())
    assert exc.value.status_code == 404


def test_activate_user_is_idempotent(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, is_active=False)
    activated = activate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert activated.is_active is True
    activated2 = activate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert activated2.is_active is True


def test_deactivate_user_revokes_refresh_tokens(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER], is_active=True)
    rt1 = _add_refresh(db_session, target.id)
    rt2 = _add_refresh(db_session, target.id)

    deactivated = deactivate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert deactivated.is_active is False

    db_session.expire_all()
    t1 = db_session.execute(select(RefreshToken).where(RefreshToken.id == rt1.id)).scalar_one()
    t2 = db_session.execute(select(RefreshToken).where(RefreshToken.id == rt2.id)).scalar_one()
    assert t1.revoked_at is not None
    assert t2.revoked_at is not None


def test_deactivate_user_idempotent(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, is_active=False)
    result = deactivate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert result.is_active is False


def test_self_deactivation_prohibited(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN], email="self-admin@example.com")
    with pytest.raises(HTTPException) as exc:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=actor.id)
    assert exc.value.status_code == 403


def test_cannot_deactivate_last_active_admin(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN], email="sole-admin@example.com")
    extra = _create_user(db_session, roles=[ROLE_ADMIN], email="extra-admin@example.com")
    replace_user_roles(db_session, actor_user_id=actor.id, user_id=extra.id, role_codes=[ROLE_CUSTOMER])
    db_session.expire_all()
    with pytest.raises(HTTPException) as exc:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=actor.id)
    assert exc.value.status_code == 403

    helper = _create_user(db_session, roles=[ROLE_ADMIN], email="helper-admin@example.com")
    replace_user_roles(db_session, actor_user_id=helper.id, user_id=actor.id, role_codes=[ROLE_CUSTOMER])
    db_session.expire_all()
    with pytest.raises(HTTPException) as exc2:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=helper.id)
    assert exc2.value.status_code == 403


def test_replace_user_roles_success_and_idempotent(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER])
    updated = replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=["admin", "customer"])
    assert {r.code for r in updated.roles} == {ROLE_ADMIN, ROLE_CUSTOMER}
    updated2 = replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=["ADMIN", "CUSTOMER"])
    assert {r.code for r in updated2.roles} == {ROLE_ADMIN, ROLE_CUSTOMER}


def test_replace_user_roles_unknown_role_rejected(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER])
    with pytest.raises(HTTPException) as exc:
        replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=["UNKNOWN"])
    assert exc.value.status_code == 422


def test_replace_user_roles_empty_rejected_by_schema():
    with pytest.raises(Exception):
        AdminUserRolesReplaceRequest(roles=[])


def test_cannot_remove_own_admin_role(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN, ROLE_CUSTOMER])
    with pytest.raises(HTTPException) as exc:
        replace_user_roles(db_session, actor_user_id=actor.id, user_id=actor.id, role_codes=[ROLE_CUSTOMER])
    assert exc.value.status_code == 403


def test_cannot_remove_last_active_admin_role(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_ADMIN])
    updated = replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=[ROLE_CUSTOMER])
    assert {r.code for r in updated.roles} == {ROLE_CUSTOMER}

    with pytest.raises(HTTPException) as exc:
        replace_user_roles(db_session, actor_user_id=actor.id, user_id=actor.id, role_codes=[ROLE_CUSTOMER])
    assert exc.value.status_code == 403


def test_actor_must_be_active_admin(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN], is_active=False)
    target = _create_user(db_session, roles=[ROLE_CUSTOMER])
    with pytest.raises(HTTPException) as exc:
        activate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert exc.value.status_code == 403


def test_activate_user_outer_transaction_not_committed(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER], is_active=False)
    if not db_session.in_transaction():
        db_session.begin()
    assert db_session.in_transaction() is True

    result = activate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert result.is_active is True
    assert db_session.in_transaction() is True

    db_session.rollback()
    assert db_session.in_transaction() is False

    with _fresh_session(db_session) as check:
        persisted = check.execute(select(User).where(User.id == target.id)).scalar_one()
        assert persisted.is_active is False


def test_deactivate_user_outer_transaction_not_committed(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER], is_active=True)
    rt = _add_refresh(db_session, target.id)

    if not db_session.in_transaction():
        db_session.begin()
    assert db_session.in_transaction() is True
    result = deactivate_user(db_session, actor_user_id=actor.id, user_id=target.id)
    assert result.is_active is False
    assert db_session.in_transaction() is True

    db_session.rollback()

    with _fresh_session(db_session) as check:
        persisted = check.execute(select(User).where(User.id == target.id)).scalar_one()
        token = check.execute(select(RefreshToken).where(RefreshToken.id == rt.id)).scalar_one()
        assert persisted.is_active is True
        assert token.revoked_at is None


def test_replace_user_roles_outer_transaction_not_committed(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER])

    if not db_session.in_transaction():
        db_session.begin()
    assert db_session.in_transaction() is True
    result = replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=[ROLE_ADMIN, ROLE_CUSTOMER])
    assert {r.code for r in result.roles} == {ROLE_ADMIN, ROLE_CUSTOMER}
    assert db_session.in_transaction() is True

    db_session.rollback()

    with _fresh_session(db_session) as check:
        persisted = check.execute(select(User).where(User.id == target.id)).scalar_one()
        assert {r.code for r in persisted.roles} == {ROLE_CUSTOMER}


def test_nested_exception_keeps_outer_transaction_active_and_controllable(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN])
    target = _create_user(db_session, roles=[ROLE_CUSTOMER], is_active=True)

    if not db_session.in_transaction():
        db_session.begin()
    assert db_session.in_transaction() is True

    with pytest.raises(HTTPException) as exc:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=actor.id)
    assert exc.value.status_code == 403
    assert db_session.in_transaction() is True

    updated = replace_user_roles(db_session, actor_user_id=actor.id, user_id=target.id, role_codes=[ROLE_ADMIN, ROLE_CUSTOMER])
    assert ROLE_ADMIN in {r.code for r in updated.roles}
    assert db_session.in_transaction() is True

    db_session.rollback()
    with _fresh_session(db_session) as check:
        persisted = check.execute(select(User).where(User.id == target.id)).scalar_one()
        assert {r.code for r in persisted.roles} == {ROLE_CUSTOMER}


def test_lock_users_for_admin_operation_is_deterministic(db_session):
    a = _create_user(db_session, roles=[ROLE_CUSTOMER])
    b = _create_user(db_session, roles=[ROLE_CUSTOMER])
    c = _create_user(db_session, roles=[ROLE_CUSTOMER])
    ids = [b.id, a.id, c.id]
    if not db_session.in_transaction():
        db_session.begin()
    locked = _lock_users_for_admin_operation(db_session, ids)
    assert list(locked.keys()) == sorted({a.id, b.id, c.id}, key=lambda uid: str(uid))
    db_session.rollback()


def test_concurrent_cross_admin_operations_do_not_deadlock(session_factory):
    # Real concurrent test with two independent PostgreSQL sessions/threads.
    with session_factory() as setup_db:
        a = _create_user(setup_db, roles=[ROLE_ADMIN], email="cross-a@example.com")
        b = _create_user(setup_db, roles=[ROLE_ADMIN], email="cross-b@example.com")
        t1 = _create_user(setup_db, roles=[ROLE_CUSTOMER], email="cross-t1@example.com", is_active=True)
        t2 = _create_user(setup_db, roles=[ROLE_CUSTOMER], email="cross-t2@example.com", is_active=True)
        a_id, b_id, t1_id, t2_id = a.id, b.id, t1.id, t2.id

    barrier = threading.Barrier(2)
    results = {}

    def op(name, actor_id, target_id, active):
        try:
            with session_factory() as db:
                barrier.wait(timeout=10)
                if active:
                    activate_user(db, actor_user_id=actor_id, user_id=target_id)
                else:
                    deactivate_user(db, actor_user_id=actor_id, user_id=target_id)
                results[name] = "ok"
        except Exception as exc:
            results[name] = f"{type(exc).__name__}:{exc}"

    th1 = threading.Thread(target=op, args=("a", a_id, t1_id, False))
    th2 = threading.Thread(target=op, args=("b", b_id, t2_id, False))
    th1.start(); th2.start(); th1.join(timeout=30); th2.join(timeout=30)

    assert results.get("a") == "ok", results
    assert results.get("b") == "ok", results

    with session_factory() as check:
        u1 = check.execute(select(User).where(User.id == t1_id)).scalar_one()
        u2 = check.execute(select(User).where(User.id == t2_id)).scalar_one()
        assert u1.is_active is False
        assert u2.is_active is False


def test_concurrent_last_admin_protection(session_factory):
    # Real concurrent test: two admins try to demote/deactivate leaving no active admin; at least one must fail.
    with session_factory() as setup_db:
        admin_a = _create_user(setup_db, roles=[ROLE_ADMIN], email="last-a@example.com")
        admin_b = _create_user(setup_db, roles=[ROLE_ADMIN], email="last-b@example.com")
        # deactivate seed admin and others to isolate
        seeded = setup_db.execute(select(User)).scalars().all()
        for u in seeded:
            if u.id in {admin_a.id, admin_b.id}:
                continue
            if u.is_active and any(r.code == ROLE_ADMIN for r in u.roles):
                try:
                    deactivate_user(setup_db, actor_user_id=admin_a.id, user_id=u.id)
                except Exception:
                    setup_db.rollback()
        a_id, b_id = admin_a.id, admin_b.id

    barrier = threading.Barrier(2)
    results = {}

    def demote(name, actor_id, target_id):
        try:
            with session_factory() as db:
                barrier.wait(timeout=10)
                replace_user_roles(db, actor_user_id=actor_id, user_id=target_id, role_codes=[ROLE_CUSTOMER])
                results[name] = "ok"
        except Exception as exc:
            results[name] = type(exc).__name__

    th1 = threading.Thread(target=demote, args=("a", a_id, b_id))
    th2 = threading.Thread(target=demote, args=("b", b_id, a_id))
    th1.start(); th2.start(); th1.join(timeout=30); th2.join(timeout=30)

    assert "ok" in results.values(), results
    # at least one must be forbidden/conflict; depending on interleaving self-removal may win
    assert any(v in {"HTTPException", "Conflict", "Forbidden"} or v != "ok" for v in results.values()), results

    with session_factory() as check:
        users = check.execute(select(User).where(User.id.in_([a_id, b_id]))).scalars().all()
        active_admins = [u for u in users if u.is_active and any(r.code == ROLE_ADMIN for r in u.roles)]
        assert len(active_admins) >= 1
