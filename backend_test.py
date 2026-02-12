#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime, timezone
import time
import subprocess
import os

BACKEND_URL = "https://contractor-bill-mgmt.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class ConstructionAppTester:
    def __init__(self, session_token=None):
        self.session_token = session_token or "test_session_1770881113869"
        self.user_id = None
        self.test_site_id = None
        self.test_party_id = None  
        self.test_bill_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            print(f"❌ {test_name}: FAILED {message}")
            if response_data:
                print(f"   Response: {json.dumps(response_data, indent=2)}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response": response_data if not success else None
        })

    def setup_test_user_and_session(self):
        """Create test user and session in MongoDB"""
        print("\n🔧 Setting up test user and session...")
        
        timestamp = int(time.time())
        self.user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test user and session
        mongo_cmd = f"""
mongosh --eval "
use('test_database');
var userId = '{self.user_id}';
var sessionToken = '{self.session_token}';
db.users.insertOne({{
  user_id: userId,
  email: 'test.user.{timestamp}@example.com',
  name: 'Test User Admin',
  picture: 'https://via.placeholder.com/150',
  role: 'admin',
  created_at: new Date()
}});
db.user_sessions.insertOne({{
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
}});
print('Test user and session created successfully');
"
"""
        
        try:
            result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                print(f"✅ Test user created: {self.user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("❌ MongoDB setup timed out")
            return False
        except Exception as e:
            print(f"❌ MongoDB setup error: {e}")
            return False

    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{API_URL}/health", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            self.log_test("Health Check", success, f"Status: {response.status_code}", data)
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{API_URL}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            expected_message = "Dhaya Promoters - Construction Site Manager API"
            if success and data.get("message") == expected_message:
                self.log_test("Root Endpoint", True, f"Status: {response.status_code}")
            else:
                self.log_test("Root Endpoint", False, f"Unexpected message: {data}")
            return success
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_auth_me(self):
        """Test authenticated /api/auth/me endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{API_URL}/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and data.get("user_id") == self.user_id:
                self.log_test("Auth Me", True, f"User authenticated: {data.get('name')}")
            else:
                self.log_test("Auth Me", False, f"Auth failed: {data}")
            return success
        except Exception as e:
            self.log_test("Auth Me", False, f"Exception: {str(e)}")
            return False

    def test_create_site(self):
        """Test creating a site"""
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            site_data = {"name": f"Test Site {int(time.time())}"}
            
            response = requests.post(f"{API_URL}/sites", json=site_data, headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and "site_id" in data:
                self.test_site_id = data["site_id"]
                self.log_test("Create Site", True, f"Site created: {data['name']}")
            else:
                self.log_test("Create Site", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("Create Site", False, f"Exception: {str(e)}")
            return False

    def test_list_sites(self):
        """Test listing sites"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{API_URL}/sites", headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and isinstance(data, list):
                self.log_test("List Sites", True, f"Found {len(data)} sites")
            else:
                self.log_test("List Sites", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("List Sites", False, f"Exception: {str(e)}")
            return False

    def test_create_party(self):
        """Test creating a party"""
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            party_data = {"name": f"Test Supplier {int(time.time())}"}
            
            response = requests.post(f"{API_URL}/parties", json=party_data, headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and "party_id" in data:
                self.test_party_id = data["party_id"]
                self.log_test("Create Party", True, f"Party created: {data['name']}")
            else:
                self.log_test("Create Party", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("Create Party", False, f"Exception: {str(e)}")
            return False

    def test_list_parties(self):
        """Test listing parties"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{API_URL}/parties", headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and isinstance(data, list):
                self.log_test("List Parties", True, f"Found {len(data)} parties")
            else:
                self.log_test("List Parties", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("List Parties", False, f"Exception: {str(e)}")
            return False

    def test_create_bill(self):
        """Test creating a bill"""
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            bill_data = {
                "site_name": "Test Construction Site",
                "party_name": "ABC Suppliers Ltd",
                "category": "Cement",
                "bill_amount": 15000.00,
                "remarks": "Monthly cement supply"
            }
            
            response = requests.post(f"{API_URL}/bills", json=bill_data, headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and "bill_id" in data:
                self.test_bill_id = data["bill_id"]
                self.log_test("Create Bill", True, f"Bill created: Rs.{data['bill_amount']}")
            else:
                self.log_test("Create Bill", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("Create Bill", False, f"Exception: {str(e)}")
            return False

    def test_list_bills(self):
        """Test listing bills with filters"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            
            # Test basic list
            response = requests.get(f"{API_URL}/bills", headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and isinstance(data, list):
                self.log_test("List Bills", True, f"Found {len(data)} bills")
                
                # Test with filters if bills exist
                if len(data) > 0:
                    params = {"category": "Cement", "status": "Pending"}
                    filter_response = requests.get(f"{API_URL}/bills", headers=headers, params=params, timeout=10)
                    if filter_response.status_code == 200:
                        filter_data = filter_response.json()
                        self.log_test("Bills Filter", True, f"Filtered results: {len(filter_data)} bills")
                    else:
                        self.log_test("Bills Filter", False, "Filter failed")
            else:
                self.log_test("List Bills", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("List Bills", False, f"Exception: {str(e)}")
            return False

    def test_create_payment(self):
        """Test creating a payment against a bill"""
        if not self.test_bill_id:
            self.log_test("Create Payment", False, "No test bill available")
            return False
            
        try:
            headers = {
                "Authorization": f"Bearer {self.session_token}",
                "Content-Type": "application/json"
            }
            payment_data = {
                "bill_id": self.test_bill_id,
                "amount": 5000.00,
                "notes": "Partial payment received"
            }
            
            response = requests.post(f"{API_URL}/payments", json=payment_data, headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            if success and "payment_id" in data:
                self.log_test("Create Payment", True, f"Payment recorded: Rs.{data['amount']}")
            else:
                self.log_test("Create Payment", False, f"Failed: {data}")
            return success
        except Exception as e:
            self.log_test("Create Payment", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            response = requests.get(f"{API_URL}/dashboard/summary", headers=headers, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            expected_keys = ["pending_by_site", "pending_by_party", "total_bills", "pending_bills", "total_amount", "total_paid", "total_pending"]
            
            if success and all(key in data for key in expected_keys):
                self.log_test("Dashboard Summary", True, f"Bills: {data['total_bills']}, Pending: Rs.{data['total_pending']}")
            else:
                self.log_test("Dashboard Summary", False, f"Missing keys or failed: {data}")
            return success
        except Exception as e:
            self.log_test("Dashboard Summary", False, f"Exception: {str(e)}")
            return False

    def test_monthly_report(self):
        """Test monthly report endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            current_month = datetime.now().month
            current_year = datetime.now().year
            
            params = {"month": current_month, "year": current_year}
            response = requests.get(f"{API_URL}/dashboard/monthly-report", headers=headers, params=params, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {"error": response.text}
            
            expected_keys = ["month", "year", "total_billed", "total_paid", "bills_count", "by_category"]
            
            if success and all(key in data for key in expected_keys):
                self.log_test("Monthly Report", True, f"Month: {data['month']}/{data['year']}, Billed: Rs.{data['total_billed']}")
            else:
                self.log_test("Monthly Report", False, f"Missing keys or failed: {data}")
            return success
        except Exception as e:
            self.log_test("Monthly Report", False, f"Exception: {str(e)}")
            return False

    def test_pdf_export(self):
        """Test PDF export endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.session_token}"}
            today = datetime.now().strftime('%Y-%m-%d')
            params = {"date": today}
            
            response = requests.get(f"{API_URL}/reports/daily-pdf", headers=headers, params=params, timeout=15)
            success = response.status_code == 200
            
            if success and response.headers.get('content-type') == 'application/pdf':
                pdf_size = len(response.content)
                self.log_test("PDF Export", True, f"PDF generated ({pdf_size} bytes)")
            else:
                self.log_test("PDF Export", False, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("PDF Export", False, f"Exception: {str(e)}")
            return False

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        cleanup_cmd = f"""
mongosh --eval "
use('test_database');
db.users.deleteMany({{email: /test\.user\./}});
db.user_sessions.deleteMany({{session_token: /test_session/}});
db.sites.deleteMany({{name: /Test Site/}});
db.parties.deleteMany({{name: /Test Supplier/}});
db.bills.deleteMany({{site_name: /Test Construction Site/}});
print('Test data cleaned up');
"
"""
        
        try:
            subprocess.run(cleanup_cmd, shell=True, capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️  Cleanup warning: {e}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Construction Site Expense Tracker API Tests")
        print(f"🎯 Target: {API_URL}")
        print(f"🎫 Using session token: {self.session_token}")
        
        # Setup - skip if session token provided
        if not self.session_token.startswith("test_session_1770881113869"):
            if not self.setup_test_user_and_session():
                print("❌ Failed to setup test environment")
                return False
        else:
            print("✅ Using existing session token from main agent")
        
        # Basic connectivity tests
        print("\n📡 Testing Basic Connectivity...")
        self.test_health_check()
        self.test_root_endpoint()
        
        # Authentication tests
        print("\n🔐 Testing Authentication...")
        auth_success = self.test_auth_me()
        
        if not auth_success:
            print("❌ Authentication failed, skipping protected endpoints")
            self.cleanup_test_data()
            return False
        
        # Core API tests
        print("\n🏗️  Testing Core APIs...")
        self.test_create_site()
        self.test_list_sites()
        self.test_create_party()
        self.test_list_parties()
        self.test_create_bill()
        self.test_list_bills()
        self.test_create_payment()
        
        # Dashboard and reports
        print("\n📊 Testing Dashboard & Reports...")
        self.test_dashboard_summary()
        self.test_monthly_report()
        self.test_pdf_export()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results
        print(f"\n📋 Test Results Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {self.tests_run - self.tests_passed}/{self.tests_run}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

def main():
    tester = ConstructionAppTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()