from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sqlite3


ROOT = Path(__file__).resolve().parent
DB_DIR = ROOT / "data"
DB_PATH = DB_DIR / "chaincampus.db"


def get_db():
    DB_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS app_store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    return conn


def read_store():
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM app_store").fetchall()

    data = {}
    for key, value in rows:
        try:
            data[key] = json.loads(value)
        except json.JSONDecodeError:
            data[key] = value
    return data


def write_store(key, value):
    raw = json.dumps(value)
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO app_store (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
            """,
            (key, raw),
        )
        conn.execute(
            "INSERT INTO audit_log (action, payload) VALUES (?, ?)",
            (f"save:{key}", raw),
        )


class ChainCampusHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw)

    def do_GET(self):
        if self.path == "/api/bootstrap":
            self.send_json(200, read_store())
            return

        if self.path == "/api/health":
            self.send_json(200, {"ok": True, "database": str(DB_PATH)})
            return

        super().do_GET()

    def do_POST(self):
        routes = {
            "/api/state": "chainCampusState",
            "/api/users": "chainCampusUsers",
            "/api/session": "chainCampusSession",
        }
        key = routes.get(self.path)
        if not key:
            self.send_json(404, {"error": "Not found"})
            return

        try:
            payload = self.read_json_body()
            write_store(key, payload)
            self.send_json(200, {"ok": True, "key": key})
        except Exception as error:
            self.send_json(500, {"error": str(error)})


if __name__ == "__main__":
    get_db().close()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), ChainCampusHandler)
    print("ChainCampus running at http://127.0.0.1:8000")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()
