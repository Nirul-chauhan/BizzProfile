import io
import os
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, get_db
from app.dependencies.database import get_db_session
from app.main import app
from app.models.category import Category, Subcategory
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.services.password import hash_password


# ---- Fixtures ----


@pytest.fixture(scope="module")
def engine():
    eng = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db, set_env, tmp_path):
    set_env(
        DATABASE_URL="sqlite:///:memory:",
        SECRET_KEY="test-secret-key-for-testing-only",
        STORAGE_DIR=str(tmp_path / "uploads"),
    )

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_role(db):
    role = Role(name=RoleEnum.ADMIN.value, description="Administrator")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def user_role(db):
    role = Role(name=RoleEnum.USER.value, description="Standard user")
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@pytest.fixture()
def admin_user(db, admin_role):
    user = User(
        role_id=admin_role.id,
        full_name="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def user_one(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="User One",
        email="user1@example.com",
        password_hash=hash_password("User1Pass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def user_two(db, user_role):
    user = User(
        role_id=user_role.id,
        full_name="User Two",
        email="user2@example.com",
        password_hash=hash_password("User2Pass123!"),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def test_category(db):
    cat = Category(name="Technology", slug="technology")
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# ---- Helpers ----


def _login(client, email, password):
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _create_profile(client, token, **overrides):
    data = {
        "category_id": overrides.get("category_id", 1),
        "profile_type": overrides.get("profile_type", "INDIVIDUAL"),
        "business_name": overrides.get("business_name", "Test Co"),
        "slug": overrides.get("slug", "test-co"),
    }
    data.update(overrides)
    if "company_detail" not in data and data["profile_type"] == "COMPANY":
        data["company_detail"] = {}
    if "individual_detail" not in data and data["profile_type"] == "INDIVIDUAL":
        data["individual_detail"] = {}
    if "msme_detail" not in data and data["profile_type"] == "MSME":
        data["msme_detail"] = {}
    return client.post(
        "/api/profiles",
        json=data,
        headers=_auth(token),
    )


def _upload_doc(client, token, profile_id, document_type="PAN", file_name="test.pdf",
                content=b"fake pdf content", mime_type="application/pdf"):
    return client.post(
        f"/api/profiles/{profile_id}/documents",
        data={"document_type": document_type},
        files={"file": (file_name, io.BytesIO(content), mime_type)},
        headers=_auth(token),
    )


# ---- Tests: Authentication ----


class TestDocumentAuth:
    def test_unauthenticated_cannot_upload(self, client):
        resp = client.post(
            "/api/profiles/1/documents",
            data={"document_type": "PAN"},
            files={"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")},
        )
        assert resp.status_code == 401

    def test_unauthenticated_cannot_list(self, client):
        resp = client.get("/api/profiles/1/documents")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_delete(self, client):
        resp = client.delete("/api/documents/1")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_admin_list(self, client):
        resp = client.get("/api/admin/documents")
        assert resp.status_code == 401

    def test_unauthenticated_cannot_verify(self, client):
        resp = client.put(
            "/api/admin/documents/1/verify",
            json={"status": "APPROVED"},
        )
        assert resp.status_code == 401

    def test_non_admin_cannot_admin_list(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.get("/api/admin/documents", headers=_auth(token))
        assert resp.status_code == 403

    def test_non_admin_cannot_verify(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.put(
            "/api/admin/documents/1/verify",
            json={"status": "APPROVED"},
            headers=_auth(token),
        )
        assert resp.status_code == 403


# ---- Tests: Upload ----


class TestUploadDocument:
    def test_owner_can_upload(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DocBiz", slug="doc-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _upload_doc(client, token, profile_id)
        assert resp.status_code == 201
        data = resp.json()
        assert data["document_type"] == "PAN"
        assert data["file_name"] == "test.pdf"
        assert data["mime_type"] == "application/pdf"
        assert data["verification_status"] == "PENDING"
        assert data["profile_id"] == profile_id
        assert data["uploaded_by"] == user_one.id

    def test_upload_all_document_types(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="AllTypes", slug="all-types"
        )
        profile_id = profile_resp.json()["id"]
        doc_types = ["BUSINESS_REGISTRATION", "GST", "MSME", "PAN", "OTHER"]
        for dt in doc_types:
            resp = _upload_doc(client, token, profile_id, document_type=dt,
                               file_name=f"{dt}.pdf")
            assert resp.status_code == 201, f"Failed to upload {dt}: {resp.json()}"

    def test_invalid_mime_type_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="BadMime", slug="bad-mime"
        )
        profile_id = profile_resp.json()["id"]
        resp = _upload_doc(
            client, token, profile_id,
            file_name="malware.exe",
            content=b"MZ\x90\x00",
            mime_type="application/x-msdownload",
        )
        assert resp.status_code == 400
        assert "not allowed" in resp.json()["detail"]

    def test_file_too_large_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="BigFile", slug="big-file"
        )
        profile_id = profile_resp.json()["id"]
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        resp = _upload_doc(
            client, token, profile_id,
            content=large_content,
            file_name="large.pdf",
        )
        assert resp.status_code == 400
        assert "exceeds" in resp.json()["detail"]

    def test_exact_max_size_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="MaxSize", slug="max-size"
        )
        profile_id = profile_resp.json()["id"]
        exact_content = b"x" * (10 * 1024 * 1024)
        resp = _upload_doc(
            client, token, profile_id,
            content=exact_content,
            file_name="max.pdf",
        )
        assert resp.status_code == 201

    def test_invalid_document_type_rejected(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="BadType", slug="bad-type"
        )
        profile_id = profile_resp.json()["id"]
        resp = client.post(
            f"/api/profiles/{profile_id}/documents",
            data={"document_type": "INVALID_TYPE"},
            files={"file": ("test.pdf", io.BytesIO(b"content"), "application/pdf")},
            headers=_auth(token),
        )
        assert resp.status_code == 422

    def test_nonexistent_profile_returns_400(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = _upload_doc(client, token, 99999)
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"]

    def test_safe_filename_generated(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="SafeName", slug="safe-name"
        )
        profile_id = profile_resp.json()["id"]
        resp = _upload_doc(
            client, token, profile_id,
            file_name="../../../etc/passwd.pdf",
        )
        assert resp.status_code == 201
        file_url = resp.json()["file_url"]
        assert ".." not in file_url
        assert "etc" not in file_url

    def test_image_mime_types_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ImgBiz", slug="img-biz"
        )
        profile_id = profile_resp.json()["id"]
        image_types = ["image/jpeg", "image/png", "image/webp"]
        for mt in image_types:
            resp = _upload_doc(
                client, token, profile_id,
                file_name=f"doc.{mt.split('/')[-1]}",
                content=b"\xff\xd8\xff\xe0" if mt == "image/jpeg" else b"\x89PNG",
                mime_type=mt,
            )
            assert resp.status_code == 201, f"MIME type {mt} should be accepted"

    def test_docx_mime_type_accepted(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DocxBiz", slug="docx-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = _upload_doc(
            client, token, profile_id,
            file_name="document.docx",
            content=b"PK\x03\x04",
            mime_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        assert resp.status_code == 201


# ---- Tests: List ----


class TestListDocuments:
    def test_list_documents(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ListBiz", slug="list-biz"
        )
        profile_id = profile_resp.json()["id"]
        _upload_doc(client, token, profile_id, document_type="PAN", file_name="pan.pdf")
        _upload_doc(client, token, profile_id, document_type="GST", file_name="gst.pdf")

        resp = client.get(f"/api/profiles/{profile_id}/documents", headers=_auth(token))
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) == 2
        types = [d["document_type"] for d in docs]
        assert "PAN" in types
        assert "GST" in types

    def test_list_empty_when_no_documents(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="EmptyBiz", slug="empty-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = client.get(f"/api/profiles/{profile_id}/documents", headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_nonexistent_profile_returns_404(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.get("/api/profiles/99999/documents", headers=_auth(token))
        assert resp.status_code == 404

    def test_list_requires_authentication(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="AuthBiz", slug="auth-biz"
        )
        profile_id = profile_resp.json()["id"]
        resp = client.get(f"/api/profiles/{profile_id}/documents")
        assert resp.status_code == 401


# ---- Tests: Delete ----


class TestDeleteDocument:
    def test_owner_can_delete(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DelBiz", slug="del-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token, profile_id, file_name="del.pdf")
        doc_id = create_resp.json()["id"]
        resp = client.delete(f"/api/documents/{doc_id}", headers=_auth(token))
        assert resp.status_code == 204

        list_resp = client.get(f"/api/profiles/{profile_id}/documents", headers=_auth(token))
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 0

    def test_nonexistent_doc_returns_404(self, client, user_one):
        token = _login(client, "user1@example.com", "User1Pass123!")
        resp = client.delete("/api/documents/99999", headers=_auth(token))
        assert resp.status_code == 404

    def test_cross_user_cannot_delete(self, client, user_one, user_two, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        token2 = _login(client, "user2@example.com", "User2Pass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="NoDel", slug="no-del"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token1, profile_id, file_name="nodelete.pdf")
        doc_id = create_resp.json()["id"]
        resp = client.delete(f"/api/documents/{doc_id}", headers=_auth(token2))
        assert resp.status_code == 404


# ---- Tests: Admin ----


class TestAdminDocuments:
    def test_admin_can_list_all(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="AdminBiz", slug="admin-biz"
        )
        profile_id = profile_resp.json()["id"]
        _upload_doc(client, token1, profile_id, file_name="doc1.pdf")
        _upload_doc(client, token1, profile_id, file_name="doc2.pdf")

        resp = client.get("/api/admin/documents", headers=_auth(admin_token))
        assert resp.status_code == 200
        docs = resp.json()
        assert len(docs) >= 2

    def test_admin_can_approve(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="ApprBiz", slug="appr-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token1, profile_id, file_name="approve.pdf")
        doc_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/admin/documents/{doc_id}/verify",
            json={"status": "APPROVED"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["verification_status"] == "APPROVED"
        assert resp.json()["rejection_reason"] is None

    def test_admin_can_reject_with_reason(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="RejBiz", slug="rej-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token1, profile_id, file_name="reject.pdf")
        doc_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/admin/documents/{doc_id}/verify",
            json={"status": "REJECTED", "rejection_reason": "Document is blurry"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["verification_status"] == "REJECTED"
        assert resp.json()["rejection_reason"] == "Document is blurry"

    def test_reject_without_reason_fails(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="NoReason", slug="no-reason"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token1, profile_id, file_name="noreason.pdf")
        doc_id = create_resp.json()["id"]

        resp = client.put(
            f"/api/admin/documents/{doc_id}/verify",
            json={"status": "REJECTED"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 400
        assert "reason" in resp.json()["detail"].lower()

    def test_admin_can_delete_any(self, client, admin_user, user_one, test_category):
        token1 = _login(client, "user1@example.com", "User1Pass123!")
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        profile_resp = _create_profile(
            client, token1, category_id=test_category.id, business_name="AdminDel", slug="admin-del"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token1, profile_id, file_name="admindel.pdf")
        doc_id = create_resp.json()["id"]
        resp = client.delete(f"/api/documents/{doc_id}", headers=_auth(admin_token))
        assert resp.status_code == 204

    def test_nonexistent_doc_verify_returns_400(self, client, admin_user):
        admin_token = _login(client, "admin@example.com", "AdminPass123!")
        resp = client.put(
            "/api/admin/documents/99999/verify",
            json={"status": "APPROVED"},
            headers=_auth(admin_token),
        )
        assert resp.status_code == 400
        assert "not found" in resp.json()["detail"]


# ---- Tests: Response Structure ----


class TestDocumentResponse:
    def test_response_has_all_fields(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="RespBiz", slug="resp-biz"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token, profile_id, file_name="fields.pdf")
        data = create_resp.json()
        assert "id" in data
        assert "profile_id" in data
        assert "document_type" in data
        assert "file_name" in data
        assert "file_url" in data
        assert "mime_type" in data
        assert "file_size" in data
        assert "verification_status" in data
        assert "uploaded_by" in data
        assert "rejection_reason" in data
        assert "created_at" in data
        assert "updated_at" in data
        assert data["document_type"] == "PAN"
        assert data["profile_id"] == profile_id
        assert data["uploaded_by"] == user_one.id

    def test_list_response_structure(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ListStr", slug="list-str"
        )
        profile_id = profile_resp.json()["id"]
        _upload_doc(client, token, profile_id, file_name="list.pdf")
        resp = client.get(f"/api/profiles/{profile_id}/documents", headers=_auth(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) == 1
        assert resp.json()[0]["document_type"] == "PAN"


# ---- Tests: File Stored on Disk ----


class TestFileStorage:
    def test_file_stored_on_disk(self, client, user_one, test_category, tmp_path):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DiskBiz", slug="disk-biz"
        )
        profile_id = profile_resp.json()["id"]
        content = b"test file content for disk storage"
        resp = _upload_doc(client, token, profile_id, content=content, file_name="disk.pdf")
        assert resp.status_code == 201
        file_url = resp.json()["file_url"]
        assert os.path.exists(file_url)
        with open(file_url, "rb") as f:
            assert f.read() == content

    def test_file_deleted_from_disk(self, client, user_one, test_category, tmp_path):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="DelDisk", slug="del-disk"
        )
        profile_id = profile_resp.json()["id"]
        resp = _upload_doc(client, token, profile_id, file_name="deldisk.pdf")
        file_url = resp.json()["file_url"]
        doc_id = resp.json()["id"]
        assert os.path.exists(file_url)

        del_resp = client.delete(f"/api/documents/{doc_id}", headers=_auth(token))
        assert del_resp.status_code == 204
        assert not os.path.exists(file_url)


# ---- Tests: Cascade Delete ----


class TestCascadeDelete:
    def test_deleting_profile_deletes_documents(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="CascadeBiz", slug="cascade-biz"
        )
        profile_id = profile_resp.json()["id"]
        _upload_doc(client, token, profile_id, file_name="cascade1.pdf")
        _upload_doc(client, token, profile_id, file_name="cascade2.pdf")

        del_resp = client.delete(f"/api/profiles/{profile_id}", headers=_auth(token))
        assert del_resp.status_code == 204

        list_resp = client.get(f"/api/profiles/{profile_id}/documents", headers=_auth(token))
        assert list_resp.status_code == 404


# ---- Tests: Edge Cases ----


class TestEdgeCases:
    def test_same_doc_type_multiple_uploads(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="MultiUp", slug="multi-up"
        )
        profile_id = profile_resp.json()["id"]
        _upload_doc(client, token, profile_id, document_type="PAN", file_name="pan1.pdf")
        resp = _upload_doc(client, token, profile_id, document_type="PAN", file_name="pan2.pdf")
        assert resp.status_code == 201

    def test_different_profiles_same_doc_type(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        p1 = _create_profile(
            client, token, category_id=test_category.id, business_name="P1", slug="p1"
        )
        p2 = _create_profile(
            client, token, category_id=test_category.id, business_name="P2", slug="p2"
        )
        _upload_doc(client, token, p1.json()["id"], file_name="p1pan.pdf")
        resp = _upload_doc(client, token, p2.json()["id"], file_name="p2pan.pdf")
        assert resp.status_code == 201

    def test_upload_after_delete_allows_reupload(self, client, user_one, test_category):
        token = _login(client, "user1@example.com", "User1Pass123!")
        profile_resp = _create_profile(
            client, token, category_id=test_category.id, business_name="ReUp", slug="re-up"
        )
        profile_id = profile_resp.json()["id"]
        create_resp = _upload_doc(client, token, profile_id, file_name="first.pdf")
        doc_id = create_resp.json()["id"]
        client.delete(f"/api/documents/{doc_id}", headers=_auth(token))

        resp = _upload_doc(client, token, profile_id, file_name="second.pdf")
        assert resp.status_code == 201
