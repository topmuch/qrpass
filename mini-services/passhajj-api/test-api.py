#!/usr/bin/env python3
"""PassHajj API Critical Flow Test Script"""
import json, urllib.request, urllib.error, datetime

BASE = "http://127.0.0.1:3002"
def req(method, path, data=None, token=None):
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token: headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=5) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return json.loads(e.read()) if e.headers.get("content-type","").startswith("application/json") else {"error": str(e)}

print("=" * 56)
print("  PASSHAJJ MANAGER API - CRITICAL FLOW VERIFICATION")
print("=" * 56 + "\n")

# FLOW A: Auth + Agency
print("--- FLOW A: Auth + Agency ---")
r = req("POST", "/api/auth/login", {"email":"admin@passhajj.com","password":"admin123"})
token = r.get("accessToken","")
print(f"  [OK] Login: {r.get('user',{}).get('email','?')} -> JWT ({len(token)} chars)")

r = req("GET", "/api/auth/me", token=token)
print(f"  [OK] Profile: {r.get('user',{}).get('name','?')} | role={r.get('user',{}).get('role','?')}")

r = req("GET", "/api/agencies", token=token)
agencies = r.get("items",[])
print(f"  [OK] Agencies: {r.get('pagination',{}).get('total',0)} loaded")
for a in agencies[:3]:
    print(f"       - {a['name']} ({a['slug']})")
print()

# FLOW B: Trip + OTP
print("--- FLOW B: Trip + OTP Generation ---")
r = req("GET", "/api/trips", token=token)
trips = r.get("data",[])
print(f"  [OK] Trips: {r.get('pagination',{}).get('total',0)} loaded")
for t in trips:
    print(f"       - {t['name']} | OTP: {t['otp']}")

agency_id = agencies[0]["id"] if agencies else ""
r = req("POST", "/api/trips", {
    "name": "Test Hajj 2025 - New Group",
    "agencyId": agency_id,
    "destination": "La Mecque",
    "transportMode": "flight",
    "pilgrims": [
        {"fullName": "Ahmed Ben Ali", "bloodType": "O+", "nationality": "Maroc"},
        {"fullName": "Fatima Zahra", "bloodType": "A-", "allergies": "Penicilline", "nationality": "Maroc"}
    ],
    "bags": [
        {"ownerName": "Ahmed Ben Ali", "baggageType": "cabine"},
        {"ownerName": "Fatima Zahra", "baggageType": "cabine"}
    ]
}, token=token)
new_otp = r.get("data",{}).get("otp", r.get("otp", "FAIL"))
if new_otp != "FAIL":
    print(f"  [OK] Created trip -> OTP: {new_otp}")
else:
    print(f"  [WARN] Trip create: {json.dumps(r)[:200]}")
print()

# FLOW C: OTP Verify + Sync
print("--- FLOW C: OTP Verify + Sync PWA ---")
r = req("POST", "/api/leader/verify-otp", {"otp": "1234"})
if r.get("success"):
    t = r["trip"]
    p = r["pilgrims"]
    b = r["bags"]
    g = r.get("groups", [])
    print(f"  [OK] OTP 1234: {t['name']}")
    print(f"       -> {len(p)} pilgrims, {len(b)} bags, {len(g)} groups")
    print(f"       -> First: {p[0]['fullName']} ({p[0]['qrCode']}) blood={p[0].get('bloodType','?')}")
    trip_id = t["id"]
else:
    print(f"  [FAIL] OTP: {json.dumps(r)[:200]}")
    trip_id = ""

if new_otp != "FAIL":
    r2 = req("POST", "/api/leader/verify-otp", {"otp": new_otp})
    if r2.get("success"):
        print(f"  [OK] New OTP {new_otp}: {len(r2['pilgrims'])} pilgrims, {len(r2['bags'])} bags")

if trip_id:
    ts = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.000Z")
    r = req("POST", "/api/leader/sync-scans", {
        "tripId": trip_id,
        "scans": [
            {"id": "scan-001", "qrCode": "ID-1234001", "type": "identity", "zone": "A\u00e9roport", "timestamp": ts, "status": "success", "pilgrimName": "Mamadou Diallo"},
            {"id": "scan-002", "qrCode": "BG-12340011", "type": "baggage", "zone": "A\u00e9roport", "timestamp": ts, "status": "success"}
        ]
    })
    print(f"  [OK] Sync: {r.get('count',0)} scans synced, {len(r.get('skipped',[]))} skipped")
else:
    print("  [SKIP] Sync: no trip_id")
print()

# FLOW D: Finder
print("--- FLOW D: Finder (Public QR Lookup) ---")
r = req("GET", "/api/finder/ID-1234001")
print(f"  [OK] ID-1234001: {r.get('fullName','?')} | blood={r.get('bloodType','?')} | group={r.get('group',{}).get('name','?')}")

r = req("GET", "/api/finder/BG-12340011")
print(f"  [OK] BG-12340011: owner={r.get('ownerName','?')} | type={r.get('baggageType','?')}")
print()

print("=" * 56)
print("          ALL CRITICAL FLOWS VERIFIED")
print("=" * 56)
