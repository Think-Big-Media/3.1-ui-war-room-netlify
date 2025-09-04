"""
Example Pytest tests for volunteer API endpoints.
Shows patterns for:
- FastAPI TestClient usage
- Database fixtures and transactions
- Authentication mocking
- Parametrized tests
- Error case testing
"""

import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from unittest.mock import patch, MagicMock

from app.main import app
from app.database import get_db
from app.models import User, Volunteer, VolunteerStatus, UserRole
from app.auth_service import AuthService
from tests.factories import UserFactory, VolunteerFactory
from tests.fixtures import test_db, authenticated_client


class TestVolunteerEndpoints:
    """Test suite for volunteer management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self, test_db: Session):
        """Setup test data before each test"""
        self.db = test_db
        self.client = TestClient(app)
        
        # Override database dependency
        app.dependency_overrides[get_db] = lambda: test_db
        
        # Create test users
        self.admin_user = UserFactory(role=UserRole.ADMIN)
        self.coordinator_user = UserFactory(role=UserRole.COORDINATOR)
        self.volunteer_user = UserFactory(role=UserRole.VOLUNTEER)
        
        # Create test volunteers
        self.volunteers = [
            VolunteerFactory(status=VolunteerStatus.ACTIVE),
            VolunteerFactory(status=VolunteerStatus.ACTIVE),
            VolunteerFactory(status=VolunteerStatus.PENDING),
            VolunteerFactory(status=VolunteerStatus.INACTIVE)
        ]
        
        self.db.add_all([
            self.admin_user, self.coordinator_user, self.volunteer_user,
            *self.volunteers
        ])
        self.db.commit()
        
        yield
        
        # Cleanup
        app.dependency_overrides.clear()
    
    def get_auth_headers(self, user: User) -> dict:
        """Get authorization headers for a user"""
        token = AuthService.create_access_token(user)
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_volunteers_success(self):
        """Test successful retrieval of volunteers"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        response = self.client.get("/api/v1/volunteers/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        assert all(isinstance(v, dict) for v in data)
        assert all("id" in v and "email" in v for v in data)
    
    def test_get_volunteers_with_filters(self):
        """Test volunteer filtering"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        # Filter by status
        response = self.client.get(
            "/api/v1/volunteers/?status=active",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(v["status"] == "active" for v in data)
    
    def test_get_volunteers_pagination(self):
        """Test pagination parameters"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        # First page
        response = self.client.get(
            "/api/v1/volunteers/?skip=0&limit=2",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        
        # Second page
        response = self.client.get(
            "/api/v1/volunteers/?skip=2&limit=2",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    def test_get_volunteers_unauthorized(self):
        """Test unauthorized access"""
        response = self.client.get("/api/v1/volunteers/")
        
        assert response.status_code == 401
        assert "detail" in response.json()
    
    def test_create_volunteer_success(self):
        """Test successful volunteer creation"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        volunteer_data = {
            "email": "new.volunteer@example.com",
            "first_name": "New",
            "last_name": "Volunteer",
            "phone": "+1234567890",
            "skills": ["communication", "event planning"],
            "availability": {
                "monday": ["morning", "evening"],
                "friday": ["afternoon"]
            }
        }
        
        response = self.client.post(
            "/api/v1/volunteers/",
            json=volunteer_data,
            headers=headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == volunteer_data["email"]
        assert data["status"] == "pending"
        assert "id" in data
        
        # Verify in database
        created = self.db.query(Volunteer).filter(
            Volunteer.email == volunteer_data["email"]
        ).first()
        assert created is not None
        assert created.created_by == self.coordinator_user.id
    
    def test_create_volunteer_duplicate_email(self):
        """Test creating volunteer with duplicate email"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        volunteer_data = {
            "email": self.volunteers[0].email,  # Existing email
            "first_name": "Duplicate",
            "last_name": "User"
        }
        
        response = self.client.post(
            "/api/v1/volunteers/",
            json=volunteer_data,
            headers=headers
        )
        
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    
    @pytest.mark.parametrize("invalid_data,expected_error", [
        ({"first_name": "Test"}, "email"),  # Missing required field
        ({"email": "invalid-email", "first_name": "Test"}, "email"),  # Invalid email
        ({"email": "test@example.com", "phone": "123"}, "phone"),  # Invalid phone
    ])
    def test_create_volunteer_validation_errors(self, invalid_data, expected_error):
        """Test validation errors in volunteer creation"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        response = self.client.post(
            "/api/v1/volunteers/",
            json=invalid_data,
            headers=headers
        )
        
        assert response.status_code == 422
        errors = response.json()["detail"]
        assert any(expected_error in str(error) for error in errors)
    
    def test_get_volunteer_by_id_success(self):
        """Test retrieving a specific volunteer"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        
        response = self.client.get(
            f"/api/v1/volunteers/{volunteer.id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == volunteer.id
        assert data["email"] == volunteer.email
    
    def test_get_volunteer_by_id_not_found(self):
        """Test retrieving non-existent volunteer"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        response = self.client.get(
            "/api/v1/volunteers/99999",
            headers=headers
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_update_volunteer_success(self):
        """Test updating volunteer information"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        
        update_data = {
            "phone": "+9876543210",
            "status": "inactive",
            "notes": "Updated via API test"
        }
        
        response = self.client.patch(
            f"/api/v1/volunteers/{volunteer.id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["phone"] == update_data["phone"]
        assert data["status"] == update_data["status"]
        
        # Verify in database
        self.db.refresh(volunteer)
        assert volunteer.phone == update_data["phone"]
        assert volunteer.status == VolunteerStatus.INACTIVE
        assert volunteer.updated_by == self.coordinator_user.id
    
    def test_update_volunteer_partial(self):
        """Test partial update of volunteer"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        original_email = volunteer.email
        
        update_data = {"notes": "Only updating notes"}
        
        response = self.client.patch(
            f"/api/v1/volunteers/{volunteer.id}",
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["notes"] == update_data["notes"]
        assert data["email"] == original_email  # Unchanged
    
    def test_delete_volunteer_as_admin(self):
        """Test deleting volunteer as admin"""
        headers = self.get_auth_headers(self.admin_user)
        volunteer = self.volunteers[0]
        
        response = self.client.delete(
            f"/api/v1/volunteers/{volunteer.id}",
            headers=headers
        )
        
        assert response.status_code == 204
        
        # Verify soft delete in database
        self.db.refresh(volunteer)
        assert volunteer.is_deleted is True
        assert volunteer.deleted_by == self.admin_user.id
        assert volunteer.deleted_at is not None
    
    def test_delete_volunteer_as_non_admin(self):
        """Test deleting volunteer without admin permissions"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        
        response = self.client.delete(
            f"/api/v1/volunteers/{volunteer.id}",
            headers=headers
        )
        
        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]
    
    @patch('app.services.notification.NotificationService.send_email')
    def test_assign_task_to_volunteer(self, mock_send_email):
        """Test assigning a task to volunteer with notification"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        
        task_data = {"task_id": 1}
        
        response = self.client.post(
            f"/api/v1/volunteers/{volunteer.id}/assign-task",
            json=task_data,
            headers=headers
        )
        
        assert response.status_code == 200
        assert "Assignment confirmation" in response.json()
        
        # Verify notification was sent
        mock_send_email.assert_called_once()
    
    def test_search_volunteers(self):
        """Test volunteer search functionality"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        # Create volunteer with specific name
        search_volunteer = VolunteerFactory(
            first_name="Searchable",
            last_name="Volunteer"
        )
        self.db.add(search_volunteer)
        self.db.commit()
        
        response = self.client.get(
            "/api/v1/volunteers/?search=Searchable",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Searchable"
    
    def test_concurrent_volunteer_updates(self):
        """Test handling concurrent updates to same volunteer"""
        headers = self.get_auth_headers(self.coordinator_user)
        volunteer = self.volunteers[0]
        
        # Simulate concurrent updates
        update1 = {"phone": "+1111111111"}
        update2 = {"phone": "+2222222222"}
        
        # Both requests would normally happen simultaneously
        response1 = self.client.patch(
            f"/api/v1/volunteers/{volunteer.id}",
            json=update1,
            headers=headers
        )
        
        response2 = self.client.patch(
            f"/api/v1/volunteers/{volunteer.id}",
            json=update2,
            headers=headers
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Last update wins
        self.db.refresh(volunteer)
        assert volunteer.phone == update2["phone"]
    
    def test_volunteer_skills_filtering(self):
        """Test filtering volunteers by skills"""
        headers = self.get_auth_headers(self.coordinator_user)
        
        # Create volunteers with specific skills
        skilled_volunteer = VolunteerFactory(
            skills=["python", "communication"]
        )
        self.db.add(skilled_volunteer)
        self.db.commit()
        
        response = self.client.get(
            "/api/v1/volunteers/?skills=python&skills=communication",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert any(v["id"] == skilled_volunteer.id for v in data)