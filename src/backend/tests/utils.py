"""
Test utilities and helper functions.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
import random
import string
from faker import Faker

fake = Faker()


def generate_test_volunteer(org_id: str) -> Dict[str, Any]:
    """Generate test volunteer data."""
    return {
        "org_id": org_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "status": random.choice(["active", "inactive", "pending"]),
        "skills": random.sample(
            ["canvassing", "phone_banking", "data_entry", "event_planning"], k=2
        ),
        "availability": {
            "monday": random.choice([True, False]),
            "tuesday": random.choice([True, False]),
            "wednesday": random.choice([True, False]),
            "thursday": random.choice([True, False]),
            "friday": random.choice([True, False]),
            "saturday": random.choice([True, False]),
            "sunday": random.choice([True, False]),
        },
        "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 90)),
    }


def generate_test_event(org_id: str) -> Dict[str, Any]:
    """Generate test event data."""
    start_date = datetime.utcnow() + timedelta(days=random.randint(-30, 30))
    return {
        "org_id": org_id,
        "name": f"{fake.catch_phrase()} Event",
        "description": fake.text(max_nb_chars=200),
        "event_type": random.choice(["meeting", "rally", "fundraiser", "training"]),
        "location": {
            "address": fake.street_address(),
            "city": fake.city(),
            "state": fake.state_abbr(),
            "zip": fake.zipcode(),
        },
        "start_date": start_date,
        "end_date": start_date + timedelta(hours=random.randint(1, 4)),
        "max_attendees": random.randint(20, 500),
        "current_attendees": random.randint(0, 100),
        "status": random.choice(["scheduled", "in_progress", "completed", "cancelled"]),
        "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 60)),
    }


def generate_test_donation(org_id: str) -> Dict[str, Any]:
    """Generate test donation data."""
    return {
        "org_id": org_id,
        "amount": round(random.uniform(10, 5000), 2),
        "donor_name": fake.name(),
        "donor_email": fake.email(),
        "donor_phone": fake.phone_number(),
        "donation_type": random.choice(["one_time", "recurring"]),
        "payment_method": random.choice(["credit_card", "bank_transfer", "check"]),
        "status": random.choice(["completed", "pending", "failed"]),
        "anonymous": random.choice([True, False]),
        "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 180)),
    }


def generate_test_contact(org_id: str) -> Dict[str, Any]:
    """Generate test contact data."""
    return {
        "org_id": org_id,
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "phone": fake.phone_number(),
        "address": {
            "street": fake.street_address(),
            "city": fake.city(),
            "state": fake.state_abbr(),
            "zip": fake.zipcode(),
        },
        "tags": random.sample(
            ["voter", "donor", "volunteer", "supporter", "undecided"], k=2
        ),
        "communication_preferences": {
            "email": random.choice([True, False]),
            "sms": random.choice([True, False]),
            "phone": random.choice([True, False]),
        },
        "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 365)),
    }


def generate_analytics_data(
    num_days: int = 30,
    base_value: int = 100,
    growth_rate: float = 0.02,
) -> List[Dict[str, Any]]:
    """Generate time-series analytics data."""
    data = []
    current_value = base_value

    for i in range(num_days):
        date = datetime.utcnow() - timedelta(days=num_days - i - 1)

        # Add some randomness
        daily_change = random.uniform(-0.1, 0.1)
        current_value = int(current_value * (1 + growth_rate + daily_change))

        data.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "value": max(0, current_value),
                "change": daily_change,
            }
        )

    return data


def create_mock_websocket_message(
    message_type: str, data: Dict[str, Any]
) -> Dict[str, Any]:
    """Create a mock WebSocket message."""
    return {
        "type": message_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
        "id": "".join(random.choices(string.ascii_lowercase + string.digits, k=12)),
    }


def assert_valid_uuid(value: str) -> bool:
    """Assert that a value is a valid UUID."""
    import uuid

    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def assert_datetime_recent(
    dt: datetime,
    max_age_seconds: int = 60,
) -> bool:
    """Assert that a datetime is recent (within max_age_seconds)."""
    age = datetime.utcnow() - dt
    return age.total_seconds() <= max_age_seconds


def create_test_jwt_payload(
    user_id: str,
    org_id: str,
    role: str = "admin",
    permissions: List[str] = None,
    exp_minutes: int = 30,
) -> Dict[str, Any]:
    """Create a test JWT payload."""
    if permissions is None:
        permissions = ["analytics.view", "analytics.export"]

    now = datetime.utcnow()
    return {
        "sub": f"user-{user_id}@test.com",
        "user_id": user_id,
        "org_id": org_id,
        "role": role,
        "permissions": permissions,
        "iat": now,
        "exp": now + timedelta(minutes=exp_minutes),
    }


async def create_test_data_batch(
    db_session,
    org_id: str,
    volunteers: int = 10,
    events: int = 5,
    donations: int = 20,
    contacts: int = 50,
) -> Dict[str, List[Any]]:
    """Create a batch of test data in the database."""
    from models.volunteer import Volunteer
    from models.event import Event
    from models.donation import Donation
    from models.contact import Contact

    created_data = {
        "volunteers": [],
        "events": [],
        "donations": [],
        "contacts": [],
    }

    # Create volunteers
    for _ in range(volunteers):
        data = generate_test_volunteer(org_id)
        volunteer = Volunteer(**data)
        db_session.add(volunteer)
        created_data["volunteers"].append(volunteer)

    # Create events
    for _ in range(events):
        data = generate_test_event(org_id)
        event = Event(**data)
        db_session.add(event)
        created_data["events"].append(event)

    # Create donations
    for _ in range(donations):
        data = generate_test_donation(org_id)
        donation = Donation(**data)
        db_session.add(donation)
        created_data["donations"].append(donation)

    # Create contacts
    for _ in range(contacts):
        data = generate_test_contact(org_id)
        contact = Contact(**data)
        db_session.add(contact)
        created_data["contacts"].append(contact)

    await db_session.commit()
    return created_data
