"""验收测试脚本 - 验证所有核心功能"""
import urllib.request
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

results = {"pass": 0, "fail": 0, "info": 0}

def test(name, func):
    try:
        result = func()
        if result:
            print(f"  [PASS] {name}")
            results["pass"] += 1
        else:
            print(f"  [FAIL] {name}")
            results["fail"] += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        results["fail"] += 1

def info(name, msg):
    print(f"  [INFO] {name}: {msg}")
    results["info"] += 1

BASE = "http://127.0.0.1:35001"

# === 后端测试 ===
print("\n=== 后端基础测试 ===")

def backend_home():
    r = urllib.request.urlopen(f"{BASE}/")
    return r.status == 200
test("后端主页 200", backend_home)

def login_empty():
    data = json.dumps({"username": "", "password": ""}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data,
                                 headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    resp = json.loads(r.read())
    return resp.get("code") == 400
test("空用户名登录返回 400", login_empty)

def login_wrong():
    data = json.dumps({"username": "admin", "password": "wrong"}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data,
                                 headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    resp = json.loads(r.read())
    return resp.get("code") == 401
test("错误密码返回 401", login_wrong)

def login_success():
    data = json.dumps({"username": "admin", "password": "admin123"}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/login", data=data,
                                 headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    resp = json.loads(r.read())
    return resp.get("code") == 200 and "username" in str(resp.get("data", {}))
test("正确密码登录成功", login_success)

def register_empty():
    data = json.dumps({"username": "", "password": ""}).encode()
    req = urllib.request.Request(f"{BASE}/api/auth/register", data=data,
                                 headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    resp = json.loads(r.read())
    return resp.get("code") == 400
test("空用户名注册返回 400", register_empty)

# === API 安全测试（未认证应返回 401）===
print("\n=== API 安全测试（未认证应返回 401）===")

PROTECTED_ENDPOINTS = [
    ("仪表盘", f"{BASE}/api/dashboard/stats", "GET", None),
    ("模型", f"{BASE}/api/models", "GET", None),
    ("技能", f"{BASE}/api/skills", "GET", None),
    ("用户", f"{BASE}/api/users", "GET", None),
    ("角色", f"{BASE}/api/roles", "GET", None),
    ("瞭望源", f"{BASE}/api/lookout/sources", "GET", None),
    ("数据仓库", f"{BASE}/api/lookout/warehouse", "GET", None),
    ("大屏", f"{BASE}/api/bigscreen", "GET", None),
    ("会话", f"{BASE}/api/sessions", "GET", None),
    ("Token", f"{BASE}/api/tokens", "GET", None),
]

for name, url, method, body in PROTECTED_ENDPOINTS:
    def make_test(u=url, m=method, b=body):
        req = urllib.request.Request(u, method=m)
        if b:
            req.data = json.dumps(b).encode()
            req.add_header("Content-Type", "application/json")
        try:
            urllib.request.urlopen(req)
            return False  # Should have raised exception
        except urllib.error.HTTPError as e:
            return e.code == 401
        except Exception:
            return False
    test(f"{name} 未认证返回 401", make_test)

# === 公开 API 测试 ===
print("\n=== 公开 API 测试 ===")

def settings_api():
    req = urllib.request.Request(f"{BASE}/api/settings")
    r = urllib.request.urlopen(req)
    resp = json.loads(r.read())
    return resp.get("code") == 200
test("设置 API (无需认证) 返回 200", settings_api)

# === 前端测试 ===
print("\n=== 前端服务测试 ===")

def frontend_home():
    r = urllib.request.urlopen("http://localhost:5173/")
    return r.status == 200
test("前端主页 200", frontend_home)

def frontend_html():
    r = urllib.request.urlopen("http://localhost:5173/")
    html = r.read().decode("utf-8")
    return "root" in html
test("前端 HTML 包含应用入口", frontend_html)

# === CORS 测试 ===
print("\n=== CORS 头测试 ===")

def cors_headers():
    req = urllib.request.Request("http://127.0.0.1:35001/api/auth/login",
                                 data=b'{}', method="POST",
                                 headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    cors = r.headers.get("Access-Control-Allow-Origin")
    return cors is not None
test("后端 API 返回 CORS 头", cors_headers)

# === 结果汇总 ===
print("\n" + "=" * 40)
print("验收测试结果汇总:")
print(f"  通过: {results['pass']}")
print(f"  失败: {results['fail']}")
print(f"  信息: {results['info']}")
print(f"  总计: {results['pass'] + results['fail'] + results['info']}")
print("=" * 40)

if results["fail"] == 0:
    print("\n所有核心验收测试通过！")
    sys.exit(0)
else:
    print(f"\n有 {results['fail']} 个测试失败，详见上方")
    sys.exit(1)
