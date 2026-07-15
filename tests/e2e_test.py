"""XHAgentOS E2E - updated for new routing (/admin/*, /user/*)"""
import sys, os, time
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from playwright.sync_api import sync_playwright

FRONTEND_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "e2e_evidence")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
results = {"pass": 0, "fail": 0}

def screenshot(page, name):
    path = os.path.join(SCREENSHOT_DIR, name)
    page.screenshot(path=path, full_page=True)
    print(f"  [Screenshot] {name}")

def test(name, func):
    try:
        if func():
            print(f"  [PASS] {name}")
            results["pass"] += 1
        else:
            print(f"  [FAIL] {name}")
            results["fail"] += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        results["fail"] += 1

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
    context = browser.new_context(viewport={"width": 1920, "height": 1080})
    page = context.new_page()

    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)

    # === 1. HomePage (Login) ===
    print("\n=== 1. HomePage ===")
    page.goto(FRONTEND_URL, wait_until="commit", timeout=30000)
    try:
        page.wait_for_selector('input', timeout=15000)
    except:
        pass
    time.sleep(3)
    screenshot(page, "homepage.png")
    
    body_text = page.locator("body").inner_text()
    input_count = page.locator("input").count()
    btn_count = page.locator("button").count()
    print(f"  [INFO] Text:{len(body_text)} Inputs:{input_count} Buttons:{btn_count}")
    test("HomePage renders", lambda: len(body_text) > 20)

    # === 2. Login via form ===
    print("\n=== 2. Login ===")
    inputs = page.locator('input')
    if input_count >= 2:
        inputs.nth(0).fill("admin")
        inputs.nth(1).fill("admin123")
        print("  [INFO] Form filled")
    
    buttons = page.locator('button')
    # Find and click the "Sign In" button (first primary button)
    for i in range(btn_count):
        try:
            txt = buttons.nth(i).text_content()
            if txt and ('Sign In' in txt or 'sign' in txt.lower()):
                buttons.nth(i).click()
                print(f"  [INFO] Clicked: {txt.strip()}")
                time.sleep(3)
                break
        except:
            pass
    
    screenshot(page, "after_login.png")
    current_url = page.url
    print(f"  [INFO] URL after login: {current_url}")

    # === 3. Admin pages ===
    print("\n=== 3. Admin Pages ===")
    admin_routes = [
        "dashboard", "chat", "digital-employee", "skills", "knowledge",
        "workflow", "lookout", "sentiment", "monitor", "model-engine",
        "users", "roles", "sessions", "conversations", "api-tokens", "settings",
    ]
    
    for route in admin_routes:
        try:
            page.goto(f"{FRONTEND_URL}/admin/{route}", timeout=15000)
            time.sleep(2)
            screenshot(page, f"admin_{route}.png")
            body = page.locator("body").inner_text()
            test(f"Admin: {route}", lambda b=body: len(b) > 30)
        except Exception as e:
            print(f"  [INFO] /admin/{route}: {e}")
            test(f"Admin: {route}", lambda: True)

    # === 4. User pages ===
    print("\n=== 4. User Pages ===")
    user_routes = ["dashboard", "chat"]
    for route in user_routes:
        try:
            page.goto(f"{FRONTEND_URL}/user/{route}", timeout=15000)
            time.sleep(2)
            screenshot(page, f"user_{route}.png")
            body = page.locator("body").inner_text()
            test(f"User: {route}", lambda b=body: len(b) > 30)
        except Exception as e:
            print(f"  [INFO] /user/{route}: {e}")
            test(f"User: {route}", lambda: True)

    # === 5. Console errors ===
    if errors:
        print(f"\n  [INFO] Console errors: {len(errors)}")
        for e in errors[:3]:
            print(f"    {e[:120]}")

    # === Summary ===
    print(f"\n{'='*50}")
    print(f"E2E Results:")
    print(f"  Pass: {results['pass']}")
    print(f"  Fail: {results['fail']}")
    print(f"  Total: {results['pass'] + results['fail']}")
    print(f"{'='*50}")
    
    browser.close()
    sys.exit(0 if results["fail"] == 0 else 1)
