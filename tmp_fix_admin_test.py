from pathlib import Path
p = Path(r'C:\Archivos_GT\tienda_angular\backend\tests\integration\test_admin_users_service.py')
text = p.read_text(encoding='utf-8')
old = '''def test_cannot_deactivate_last_active_admin(db_session):
    # Ensure only one active admin exists in isolated scenario by deactivating others except actor
    actor = _create_user(db_session, roles=[ROLE_ADMIN], email="sole-admin@example.com")
    # Deactivate any other active admins created by fixtures/tests
    admins = db_session.execute(select(User)).scalars().all()
    for u in admins:
        codes = {r.code for r in u.roles}
        if ROLE_ADMIN in codes and u.id != actor.id and u.is_active:
            # use actor to deactivate others if possible; if other is last-admin-protected this will fail, but actor is our target
            try:
                deactivate_user(db_session, actor_user_id=actor.id, user_id=u.id)
            except HTTPException:
                pass
    db_session.expire_all()
    with pytest.raises(HTTPException) as exc:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=actor.id)  # self check first, so create another admin? 
    assert exc.value.status_code == 403
'''
new = '''def test_cannot_deactivate_last_active_admin(db_session):
    actor = _create_user(db_session, roles=[ROLE_ADMIN], email="sole-admin@example.com")
    extra = _create_user(db_session, roles=[ROLE_ADMIN], email="extra-admin@example.com")
    # make actor the last active admin by demoting extra
    replace_user_roles(db_session, actor_user_id=actor.id, user_id=extra.id, role_codes=[ROLE_CUSTOMER])
    db_session.expire_all()
    # actor cannot self-deactivate (self protection takes precedence)
    with pytest.raises(HTTPException) as exc:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=actor.id)
    assert exc.value.status_code == 403
    # last active admin cannot be deactivated by another admin? create another active admin first
    helper = _create_user(db_session, roles=[ROLE_ADMIN], email="helper-admin@example.com")
    # now actor is not last; deactivate actor via helper? actor has admin role but is active; helper can deactivate actor
    # but self-deactivate case already covered; test last-admin guard by making helper last and trying to deactivate helper via actor? actor still active admin
    replace_user_roles(db_session, actor_user_id=helper.id, user_id=actor.id, role_codes=[ROLE_CUSTOMER])
    db_session.expire_all()
    with pytest.raises(HTTPException) as exc2:
        deactivate_user(db_session, actor_user_id=actor.id, user_id=helper.id)
    assert exc2.value.status_code == 403
'''
if old not in text:
    raise SystemExit('old not found')
p.write_text(text.replace(old, new), encoding='utf-8')
print('ok')
