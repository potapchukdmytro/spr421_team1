#!/usr/bin/env python3
import json
import sys
import time
import base64
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import Any, Dict, Tuple

BASE = "http://localhost:5000"


def http_request(method: str, path: str, data: dict | None = None, token: str | None = None) -> Tuple[int, Dict[str, Any]]:
    url = BASE.rstrip("/") + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url=url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read()
            txt = raw.decode("utf-8", errors="replace")
            try:
                parsed = json.loads(txt)
                if isinstance(parsed, dict):
                    return resp.getcode(), parsed
                # Normalize non-dict JSON into a dict for consistent typing
                return resp.getcode(), {"_json": parsed}
            except json.JSONDecodeError:
                return resp.getcode(), {"_raw": txt}
    except urllib.error.HTTPError as e:
        try:
            txt = e.read().decode("utf-8", errors="replace")
            parsed = json.loads(txt)
            if isinstance(parsed, dict):
                return e.code, parsed
            return e.code, {"_json": parsed}
        except Exception:
            return e.code, {"error": e.reason}
    except urllib.error.URLError as e:
        return 0, {"error": str(e)}


def wait_for_server(timeout_sec: int = 30) -> bool:
    start = time.time()
    while time.time() - start < timeout_sec:
        code, _ = http_request("GET", "/api/rooms")
        if code == 200:
            return True
        time.sleep(1)
    return False


def decode_jwt_user_id(token: str) -> str | None:
    try:
        parts = token.split(".")
        if len(parts) < 2:
            return None
        payload_b64 = parts[1]
        padding = "=" * (-len(payload_b64) % 4)
        payload = base64.urlsafe_b64decode(payload_b64 + padding).decode("utf-8")
        obj = json.loads(payload)
        return obj.get("id")
    except Exception:
        return None


def main():
    if not wait_for_server():
        print("Server not responding on /api/rooms within timeout", file=sys.stderr)
        return 2

    ts = int(time.time())
    email = f"test{ts}@local.test"
    user = f"user{ts}"
    password = "Passw0rd1!"

    print(f"Registering {email} / {user}")
    code, reg = http_request("POST", "/api/auth/register", {
        "email": email,
        "userName": user,
        "password": password
    })
    print("Register response:", json.dumps(reg, ensure_ascii=False))

    # Login to standardize token extraction
    code, login = http_request("POST", "/api/auth/login", {
        "email": email,
        "password": password
    })
    print("Login response:", json.dumps(login, ensure_ascii=False))
    token = (login or {}).get("payload") or ""
    if not token:
        print("Failed to obtain token from login response", file=sys.stderr)
        return 3
    print("Token length:", len(token))

    user_id = decode_jwt_user_id(token)
    if not user_id:
        print("Failed to decode user id from token", file=sys.stderr)
        return 4
    print("UserId:", user_id)

    room_name = f"local-test-room-{ts}"
    code, room_res = http_request("POST", "/api/rooms", {
        "name": room_name,
        "isPrivate": False
    }, token=token)
    print("Create room response:", json.dumps(room_res, ensure_ascii=False))
    room_id = ((room_res or {}).get("data") or {}).get("id") or ""
    if not room_id:
        print("Failed to extract room id", file=sys.stderr)
        return 5
    print("RoomId:", room_id)

    code, join_res = http_request("POST", "/api/user-rooms/join", {
        "userId": user_id,
        "roomId": room_id
    }, token=token)
    print("Join response:", json.dumps(join_res, ensure_ascii=False), "(HTTP", code, ")")

    message_text = f"Hello from HTTP test at {datetime.utcnow().isoformat()}Z"
    code, send_res = http_request("POST", "/api/messages", {
        "roomId": room_id,
        "text": message_text
    }, token=token)
    print("Send response:", json.dumps(send_res, ensure_ascii=False), "(HTTP", code, ")")

    code, msgs_res = http_request("GET", f"/api/messages/room/{room_id}", token=token)
    print("Messages response:", json.dumps(msgs_res, ensure_ascii=False), "(HTTP", code, ")")

    msgs_raw = msgs_res.get("data") if isinstance(msgs_res, dict) else None
    msgs = msgs_raw if isinstance(msgs_raw, list) else []
    if isinstance(msgs, list) and any((isinstance(m, dict) and m.get("text") == message_text) for m in msgs):
        print("E2E OK: message found in room history")
        return 0
    else:
        print("E2E WARNING: message not found in room history", file=sys.stderr)
        return 6


if __name__ == "__main__":
    sys.exit(main())
