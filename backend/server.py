from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin email for daily reports
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'dhayapromoters2.0@gmail.com')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "staff"  # staff or admin
    created_at: datetime

class UserCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "staff"

class BillBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bill_id: str
    site_name: str
    party_name: str
    category: str  # M-sand, Cement, Steel, Labour, Other
    bill_amount: float
    amount_paid: float = 0.0
    balance_pending: float = 0.0
    bill_date: datetime
    bill_photo: Optional[str] = None  # base64 encoded
    remarks: Optional[str] = None
    status: str = "Pending"  # Paid, Partially Paid, Pending
    created_by: str
    created_at: datetime
    updated_at: datetime

class BillCreate(BaseModel):
    site_name: str
    party_name: str
    category: str
    bill_amount: float
    bill_photo: Optional[str] = None
    remarks: Optional[str] = None

class BillUpdate(BaseModel):
    site_name: Optional[str] = None
    party_name: Optional[str] = None
    category: Optional[str] = None
    bill_amount: Optional[float] = None
    bill_photo: Optional[str] = None
    remarks: Optional[str] = None

class PaymentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str
    bill_id: str
    amount: float
    payment_date: datetime
    notes: Optional[str] = None
    created_by: str
    created_at: datetime

class PaymentCreate(BaseModel):
    bill_id: str
    amount: float
    notes: Optional[str] = None

class SitePhotoBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    photo_id: str
    site_name: str
    photo_data: str  # base64 encoded
    description: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime

class SitePhotoCreate(BaseModel):
    site_name: str
    photo_data: str
    description: Optional[str] = None

class SiteCreate(BaseModel):
    name: str

class PartyCreate(BaseModel):
    name: str

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> UserBase:
    """Get current user from session token in cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry with timezone handling
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Find user
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Convert datetime if needed
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return UserBase(**user_doc)

async def require_admin(user: UserBase = Depends(get_current_user)) -> UserBase:
    """Require admin role"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get session data
    async with httpx.AsyncClient() as client_http:
        try:
            auth_response = await client_http.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            if auth_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session_id")
            
            session_data = auth_response.json()
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    email = session_data.get("email")
    name = session_data.get("name")
    picture = session_data.get("picture")
    session_token = session_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"email": email},
            {"$set": {"name": name, "picture": picture}}
        )
    else:
        # Create new user (first user is admin, rest are staff)
        user_count = await db.users.count_documents({})
        role = "admin" if user_count == 0 else "staff"
        
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Store session
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get user for response
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    return {"user": user_doc, "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: UserBase = Depends(get_current_user)):
    """Get current user info"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.post("/auth/set-role")
async def set_user_role(
    email: str,
    role: str,
    admin: UserBase = Depends(require_admin)
):
    """Set user role (admin only)"""
    if role not in ["admin", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"Role updated to {role}"}

@api_router.get("/users")
async def get_users(admin: UserBase = Depends(require_admin)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

# ==================== SITES & PARTIES ====================

@api_router.get("/sites")
async def get_sites(user: UserBase = Depends(get_current_user)):
    """Get all site names"""
    sites = await db.sites.find({}, {"_id": 0}).to_list(1000)
    return sites

@api_router.post("/sites")
async def create_site(site: SiteCreate, user: UserBase = Depends(get_current_user)):
    """Create a new site"""
    existing = await db.sites.find_one({"name": site.name})
    if existing:
        raise HTTPException(status_code=400, detail="Site already exists")
    
    site_doc = {
        "site_id": f"site_{uuid.uuid4().hex[:12]}",
        "name": site.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sites.insert_one(site_doc)
    return {"site_id": site_doc["site_id"], "name": site.name}

@api_router.get("/parties")
async def get_parties(user: UserBase = Depends(get_current_user)):
    """Get all party names"""
    parties = await db.parties.find({}, {"_id": 0}).to_list(1000)
    return parties

@api_router.post("/parties")
async def create_party(party: PartyCreate, user: UserBase = Depends(get_current_user)):
    """Create a new party"""
    existing = await db.parties.find_one({"name": party.name})
    if existing:
        raise HTTPException(status_code=400, detail="Party already exists")
    
    party_doc = {
        "party_id": f"party_{uuid.uuid4().hex[:12]}",
        "name": party.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.parties.insert_one(party_doc)
    return {"party_id": party_doc["party_id"], "name": party.name}

# ==================== BILLS ====================

@api_router.get("/bills")
async def get_bills(
    user: UserBase = Depends(get_current_user),
    site_name: Optional[str] = None,
    party_name: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get bills with filters"""
    query = {}
    
    if site_name:
        query["site_name"] = site_name
    if party_name:
        query["party_name"] = party_name
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if start_date:
        query["bill_date"] = {"$gte": start_date}
    if end_date:
        if "bill_date" in query:
            query["bill_date"]["$lte"] = end_date
        else:
            query["bill_date"] = {"$lte": end_date}
    
    bills = await db.bills.find(query, {"_id": 0}).sort("bill_date", -1).to_list(1000)
    
    # Convert datetime strings
    for bill in bills:
        for field in ['bill_date', 'created_at', 'updated_at']:
            if isinstance(bill.get(field), str):
                bill[field] = datetime.fromisoformat(bill[field])
    
    return bills

@api_router.get("/bills/{bill_id}")
async def get_bill(bill_id: str, user: UserBase = Depends(get_current_user)):
    """Get single bill"""
    bill = await db.bills.find_one({"bill_id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    for field in ['bill_date', 'created_at', 'updated_at']:
        if isinstance(bill.get(field), str):
            bill[field] = datetime.fromisoformat(bill[field])
    
    return bill

@api_router.post("/bills")
async def create_bill(bill: BillCreate, user: UserBase = Depends(get_current_user)):
    """Create a new bill"""
    now = datetime.now(timezone.utc)
    
    bill_doc = {
        "bill_id": f"bill_{uuid.uuid4().hex[:12]}",
        "site_name": bill.site_name,
        "party_name": bill.party_name,
        "category": bill.category,
        "bill_amount": bill.bill_amount,
        "amount_paid": 0.0,
        "balance_pending": bill.bill_amount,
        "bill_date": now.isoformat(),
        "bill_photo": bill.bill_photo,
        "remarks": bill.remarks,
        "status": "Pending",
        "created_by": user.user_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.bills.insert_one(bill_doc)
    
    # Auto-create site if not exists
    if not await db.sites.find_one({"name": bill.site_name}):
        await db.sites.insert_one({
            "site_id": f"site_{uuid.uuid4().hex[:12]}",
            "name": bill.site_name,
            "created_at": now.isoformat()
        })
    
    # Auto-create party if not exists
    if not await db.parties.find_one({"name": bill.party_name}):
        await db.parties.insert_one({
            "party_id": f"party_{uuid.uuid4().hex[:12]}",
            "name": bill.party_name,
            "created_at": now.isoformat()
        })
    
    bill_doc.pop('_id', None)
    return bill_doc

@api_router.put("/bills/{bill_id}")
async def update_bill(
    bill_id: str,
    bill_update: BillUpdate,
    admin: UserBase = Depends(require_admin)
):
    """Update a bill (admin only)"""
    existing = await db.bills.find_one({"bill_id": bill_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = {k: v for k, v in bill_update.model_dump().items() if v is not None}
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Recalculate balance if bill_amount changed
        if "bill_amount" in update_data:
            amount_paid = existing.get("amount_paid", 0)
            update_data["balance_pending"] = update_data["bill_amount"] - amount_paid
            
            # Update status
            if update_data["balance_pending"] <= 0:
                update_data["status"] = "Paid"
            elif amount_paid > 0:
                update_data["status"] = "Partially Paid"
            else:
                update_data["status"] = "Pending"
        
        await db.bills.update_one(
            {"bill_id": bill_id},
            {"$set": update_data}
        )
    
    updated_bill = await db.bills.find_one({"bill_id": bill_id}, {"_id": 0})
    return updated_bill

@api_router.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, admin: UserBase = Depends(require_admin)):
    """Delete a bill (admin only)"""
    result = await db.bills.delete_one({"bill_id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Also delete associated payments
    await db.payments.delete_many({"bill_id": bill_id})
    
    return {"message": "Bill deleted"}

# ==================== PAYMENTS ====================

@api_router.get("/payments")
async def get_payments(
    user: UserBase = Depends(get_current_user),
    bill_id: Optional[str] = None
):
    """Get payments, optionally filtered by bill_id"""
    query = {}
    if bill_id:
        query["bill_id"] = bill_id
    
    payments = await db.payments.find(query, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    
    for payment in payments:
        for field in ['payment_date', 'created_at']:
            if isinstance(payment.get(field), str):
                payment[field] = datetime.fromisoformat(payment[field])
    
    return payments

@api_router.post("/payments")
async def create_payment(
    payment: PaymentCreate,
    admin: UserBase = Depends(require_admin)
):
    """Add a payment to a bill (admin only)"""
    # Find the bill
    bill = await db.bills.find_one({"bill_id": payment.bill_id})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    now = datetime.now(timezone.utc)
    
    # Create payment
    payment_doc = {
        "payment_id": f"pay_{uuid.uuid4().hex[:12]}",
        "bill_id": payment.bill_id,
        "amount": payment.amount,
        "payment_date": now.isoformat(),
        "notes": payment.notes,
        "created_by": admin.user_id,
        "created_at": now.isoformat()
    }
    
    await db.payments.insert_one(payment_doc)
    
    # Update bill
    new_amount_paid = bill.get("amount_paid", 0) + payment.amount
    new_balance = bill.get("bill_amount", 0) - new_amount_paid
    
    if new_balance <= 0:
        new_status = "Paid"
        new_balance = 0
    elif new_amount_paid > 0:
        new_status = "Partially Paid"
    else:
        new_status = "Pending"
    
    await db.bills.update_one(
        {"bill_id": payment.bill_id},
        {
            "$set": {
                "amount_paid": new_amount_paid,
                "balance_pending": new_balance,
                "status": new_status,
                "updated_at": now.isoformat()
            }
        }
    )
    
    payment_doc.pop('_id', None)
    return payment_doc

# ==================== SITE PHOTOS ====================

@api_router.get("/site-photos")
async def get_site_photos(
    user: UserBase = Depends(get_current_user),
    site_name: Optional[str] = None,
    date: Optional[str] = None
):
    """Get site photos with filters"""
    query = {}
    if site_name:
        query["site_name"] = site_name
    if date:
        # Filter by date (same day)
        start = datetime.fromisoformat(date).replace(hour=0, minute=0, second=0)
        end = start + timedelta(days=1)
        query["uploaded_at"] = {
            "$gte": start.isoformat(),
            "$lt": end.isoformat()
        }
    
    photos = await db.site_photos.find(query, {"_id": 0}).sort("uploaded_at", -1).to_list(1000)
    
    for photo in photos:
        if isinstance(photo.get('uploaded_at'), str):
            photo['uploaded_at'] = datetime.fromisoformat(photo['uploaded_at'])
    
    return photos

@api_router.post("/site-photos")
async def create_site_photo(
    photo: SitePhotoCreate,
    user: UserBase = Depends(get_current_user)
):
    """Upload a site photo"""
    now = datetime.now(timezone.utc)
    
    photo_doc = {
        "photo_id": f"photo_{uuid.uuid4().hex[:12]}",
        "site_name": photo.site_name,
        "photo_data": photo.photo_data,
        "description": photo.description,
        "uploaded_by": user.user_id,
        "uploaded_at": now.isoformat()
    }
    
    await db.site_photos.insert_one(photo_doc)
    
    # Auto-create site if not exists
    if not await db.sites.find_one({"name": photo.site_name}):
        await db.sites.insert_one({
            "site_id": f"site_{uuid.uuid4().hex[:12]}",
            "name": photo.site_name,
            "created_at": now.isoformat()
        })
    
    photo_doc.pop('_id', None)
    return photo_doc

@api_router.delete("/site-photos/{photo_id}")
async def delete_site_photo(
    photo_id: str,
    admin: UserBase = Depends(require_admin)
):
    """Delete a site photo (admin only)"""
    result = await db.site_photos.delete_one({"photo_id": photo_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo deleted"}

# ==================== DASHBOARD / ANALYTICS ====================

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(user: UserBase = Depends(get_current_user)):
    """Get dashboard summary stats"""
    # Total pending by site
    pipeline_by_site = [
        {"$match": {"status": {"$ne": "Paid"}}},
        {"$group": {
            "_id": "$site_name",
            "total_pending": {"$sum": "$balance_pending"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_pending": -1}}
    ]
    pending_by_site = await db.bills.aggregate(pipeline_by_site).to_list(100)
    
    # Total pending by party
    pipeline_by_party = [
        {"$match": {"status": {"$ne": "Paid"}}},
        {"$group": {
            "_id": "$party_name",
            "total_pending": {"$sum": "$balance_pending"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total_pending": -1}}
    ]
    pending_by_party = await db.bills.aggregate(pipeline_by_party).to_list(100)
    
    # Overall stats
    total_bills = await db.bills.count_documents({})
    pending_bills = await db.bills.count_documents({"status": {"$ne": "Paid"}})
    
    # Calculate totals
    total_amount_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$bill_amount"}}}
    ]
    total_result = await db.bills.aggregate(total_amount_pipeline).to_list(1)
    total_amount = total_result[0]["total"] if total_result else 0
    
    paid_amount_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$amount_paid"}}}
    ]
    paid_result = await db.bills.aggregate(paid_amount_pipeline).to_list(1)
    total_paid = paid_result[0]["total"] if paid_result else 0
    
    pending_amount_pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$balance_pending"}}}
    ]
    pending_result = await db.bills.aggregate(pending_amount_pipeline).to_list(1)
    total_pending = pending_result[0]["total"] if pending_result else 0
    
    # Overdue bills (pending bills older than 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    overdue_bills = await db.bills.count_documents({
        "status": {"$ne": "Paid"},
        "bill_date": {"$lt": thirty_days_ago}
    })
    
    # Today's activity
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today_bills = await db.bills.count_documents({"created_at": {"$gte": today_start}})
    today_photos = await db.site_photos.count_documents({"uploaded_at": {"$gte": today_start}})
    today_payments = await db.payments.count_documents({"payment_date": {"$gte": today_start}})
    
    return {
        "pending_by_site": [{"site": p["_id"], "amount": p["total_pending"], "count": p["count"]} for p in pending_by_site],
        "pending_by_party": [{"party": p["_id"], "amount": p["total_pending"], "count": p["count"]} for p in pending_by_party],
        "total_bills": total_bills,
        "pending_bills": pending_bills,
        "overdue_bills": overdue_bills,
        "total_amount": total_amount,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "today_bills": today_bills,
        "today_photos": today_photos,
        "today_payments": today_payments
    }

@api_router.get("/dashboard/monthly-report")
async def get_monthly_report(
    user: UserBase = Depends(get_current_user),
    month: Optional[int] = None,
    year: Optional[int] = None
):
    """Get monthly expense report"""
    now = datetime.now(timezone.utc)
    target_month = month or now.month
    target_year = year or now.year
    
    # Start and end of month
    start_date = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
    if target_month == 12:
        end_date = datetime(target_year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(target_year, target_month + 1, 1, tzinfo=timezone.utc)
    
    # Bills in this month
    bills = await db.bills.find({
        "bill_date": {
            "$gte": start_date.isoformat(),
            "$lt": end_date.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    # Payments in this month
    payments = await db.payments.find({
        "payment_date": {
            "$gte": start_date.isoformat(),
            "$lt": end_date.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    # Aggregate by category
    category_totals = {}
    for bill in bills:
        cat = bill.get("category", "Other")
        if cat not in category_totals:
            category_totals[cat] = 0
        category_totals[cat] += bill.get("bill_amount", 0)
    
    # Calculate totals
    total_billed = sum(b.get("bill_amount", 0) for b in bills)
    total_paid_this_month = sum(p.get("amount", 0) for p in payments)
    
    return {
        "month": target_month,
        "year": target_year,
        "total_billed": total_billed,
        "total_paid": total_paid_this_month,
        "bills_count": len(bills),
        "payments_count": len(payments),
        "by_category": [{"category": k, "amount": v} for k, v in category_totals.items()]
    }

# ==================== PDF REPORT GENERATION ====================

@api_router.get("/reports/daily-pdf")
async def generate_daily_pdf(
    user: UserBase = Depends(get_current_user),
    date: Optional[str] = None
):
    """Generate daily PDF report"""
    target_date = datetime.fromisoformat(date) if date else datetime.now(timezone.utc)
    start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    
    # Get today's bills
    bills = await db.bills.find({
        "created_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Get today's payments
    payments = await db.payments.find({
        "payment_date": {"$gte": start.isoformat(), "$lt": end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    # Get today's photos count by site
    photos_pipeline = [
        {"$match": {"uploaded_at": {"$gte": start.isoformat(), "$lt": end.isoformat()}}},
        {"$group": {"_id": "$site_name", "count": {"$sum": 1}}}
    ]
    photos_by_site = await db.site_photos.aggregate(photos_pipeline).to_list(100)
    
    # Get pending amounts by site
    pending_by_site_pipeline = [
        {"$match": {"status": {"$ne": "Paid"}}},
        {"$group": {"_id": "$site_name", "total": {"$sum": "$balance_pending"}}}
    ]
    pending_by_site = await db.bills.aggregate(pending_by_site_pipeline).to_list(100)
    
    # Get pending amounts by party
    pending_by_party_pipeline = [
        {"$match": {"status": {"$ne": "Paid"}}},
        {"$group": {"_id": "$party_name", "total": {"$sum": "$balance_pending"}}}
    ]
    pending_by_party = await db.bills.aggregate(pending_by_party_pipeline).to_list(100)
    
    # Generate PDF
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*cm, bottomMargin=1*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=20
    )
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15
    )
    
    elements = []
    
    # Header
    elements.append(Paragraph("Dhaya Promoters and Builders", title_style))
    elements.append(Paragraph(f"Daily Report - {target_date.strftime('%d %B %Y')}", styles['Heading2']))
    elements.append(Spacer(1, 20))
    
    # Summary section
    elements.append(Paragraph("Summary", heading_style))
    summary_data = [
        ["Bills Added Today", str(len(bills))],
        ["Payments Made Today", str(len(payments))],
        ["Total Bill Amount Today", f"Rs. {sum(b.get('bill_amount', 0) for b in bills):,.2f}"],
        ["Total Payments Today", f"Rs. {sum(p.get('amount', 0) for p in payments):,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 15))
    
    # Bills added today
    if bills:
        elements.append(Paragraph("Bills Added Today", heading_style))
        bill_data = [["Site", "Party", "Category", "Amount", "Status"]]
        for bill in bills:
            bill_data.append([
                bill.get("site_name", ""),
                bill.get("party_name", ""),
                bill.get("category", ""),
                f"Rs. {bill.get('bill_amount', 0):,.2f}",
                bill.get("status", "")
            ])
        
        bill_table = Table(bill_data, colWidths=[1.2*inch, 1.2*inch, 1*inch, 1.2*inch, 1*inch])
        bill_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ]))
        elements.append(bill_table)
        elements.append(Spacer(1, 15))
    
    # Payments made today
    if payments:
        elements.append(Paragraph("Payments Made Today", heading_style))
        payment_data = [["Bill ID", "Amount", "Notes"]]
        for payment in payments:
            payment_data.append([
                payment.get("bill_id", "")[:15],
                f"Rs. {payment.get('amount', 0):,.2f}",
                payment.get("notes", "-")[:30] if payment.get("notes") else "-"
            ])
        
        payment_table = Table(payment_data, colWidths=[2*inch, 1.5*inch, 2*inch])
        payment_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(payment_table)
        elements.append(Spacer(1, 15))
    
    # Pending amounts by site
    if pending_by_site:
        elements.append(Paragraph("Total Pending by Site", heading_style))
        site_data = [["Site Name", "Pending Amount"]]
        for item in pending_by_site:
            site_data.append([
                item.get("_id", ""),
                f"Rs. {item.get('total', 0):,.2f}"
            ])
        
        site_table = Table(site_data, colWidths=[3*inch, 2*inch])
        site_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(site_table)
        elements.append(Spacer(1, 15))
    
    # Pending amounts by party
    if pending_by_party:
        elements.append(Paragraph("Total Pending by Party", heading_style))
        party_data = [["Party Name", "Pending Amount"]]
        for item in pending_by_party:
            party_data.append([
                item.get("_id", ""),
                f"Rs. {item.get('total', 0):,.2f}"
            ])
        
        party_table = Table(party_data, colWidths=[3*inch, 2*inch])
        party_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        elements.append(party_table)
        elements.append(Spacer(1, 15))
    
    # Site photos summary
    if photos_by_site:
        elements.append(Paragraph("Site Photos Uploaded Today", heading_style))
        photo_data = [["Site Name", "Photos Count"]]
        for item in photos_by_site:
            photo_data.append([item.get("_id", ""), str(item.get("count", 0))])
        
        photo_table = Table(photo_data, colWidths=[3*inch, 2*inch])
        photo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(photo_table)
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(
        f"Generated on {datetime.now(timezone.utc).strftime('%d %B %Y at %H:%M UTC')}",
        ParagraphStyle('Footer', fontSize=8, alignment=TA_CENTER, textColor=colors.grey)
    ))
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"daily_report_{target_date.strftime('%Y_%m_%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.post("/reports/send-email")
async def send_daily_report_email(
    user: UserBase = Depends(require_admin),
    date: Optional[str] = None,
    email: Optional[str] = None
):
    """Send daily report to email (placeholder - requires Gmail OAuth setup)"""
    # This requires Gmail OAuth credentials which user needs to provide
    # For now, return a message indicating the email feature needs setup
    return {
        "message": "Email feature requires Gmail API credentials setup. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable this feature.",
        "status": "pending_setup",
        "target_email": email or ADMIN_EMAIL
    }

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Dhaya Promoters - Construction Site Manager API"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
