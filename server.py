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
    
    # 1. Create original tables for compatibility / audit
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

    # 2. Create relational tables
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            studentId TEXT,
            college TEXT,
            program TEXT,
            year TEXT,
            isAdmin INTEGER DEFAULT 0,
            walletAddress TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            credits INTEGER DEFAULT 0,
            instructor TEXT NOT NULL,
            days TEXT NOT NULL,
            time TEXT NOT NULL,
            room TEXT NOT NULL,
            color TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            venue TEXT NOT NULL,
            capacity INTEGER DEFAULT 0,
            description TEXT NOT NULL,
            verified INTEGER DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS attendance_records (
            id TEXT PRIMARY KEY,
            courseId TEXT NOT NULL,
            courseName TEXT NOT NULL,
            subject TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            verifier TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS enrolled_courses (
            studentId TEXT NOT NULL,
            courseId TEXT NOT NULL,
            PRIMARY KEY (studentId, courseId)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS scholarship_applications (
            id TEXT PRIMARY KEY,
            scholarshipId TEXT NOT NULL,
            title TEXT NOT NULL,
            amount TEXT NOT NULL,
            type TEXT NOT NULL,
            studentId TEXT NOT NULL,
            status TEXT NOT NULL,
            txId TEXT,
            appliedAt TEXT NOT NULL,
            reviewedAt TEXT,
            reviewTxId TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS transactions (
            txId TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            status TEXT NOT NULL,
            ts TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS session (
            email TEXT PRIMARY KEY,
            name TEXT,
            studentId TEXT,
            college TEXT,
            program TEXT,
            year TEXT,
            isAdmin INTEGER DEFAULT 0,
            loggedIn INTEGER DEFAULT 0
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS app_metadata (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """
    )
    conn.commit()

    # 3. Migrate any existing data in app_store into relational tables
    migrate_data(conn)

    return conn


def migrate_data(conn):
    # Check if users table has records already
    count = conn.execute("SELECT count(*) FROM users").fetchone()[0]
    if count > 0:
        return

    # Check if app_store has any rows to migrate
    store_count = conn.execute("SELECT count(*) FROM app_store").fetchone()[0]
    if store_count == 0:
        return

    print("Migrating data from app_store to relational tables...")

    # Users
    row = conn.execute("SELECT value FROM app_store WHERE key = 'chainCampusUsers'").fetchone()
    if row:
        try:
            users_list = json.loads(row[0])
            for u in users_list:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO users (email, password, name, studentId, college, program, year, isAdmin, walletAddress)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        u.get('email'),
                        u.get('password'),
                        u.get('name'),
                        u.get('studentId'),
                        u.get('college'),
                        u.get('program'),
                        u.get('year'),
                        1 if u.get('isAdmin') else 0,
                        u.get('walletAddress')
                    )
                )
        except Exception as e:
            print(f"Migration error (users): {e}")

    # Session
    row = conn.execute("SELECT value FROM app_store WHERE key = 'chainCampusSession'").fetchone()
    active_student_id = None
    if row:
        try:
            s = json.loads(row[0])
            if s and s.get('loggedIn'):
                active_student_id = s.get('studentId')
                conn.execute(
                    """
                    INSERT OR REPLACE INTO session (email, name, studentId, college, program, year, isAdmin, loggedIn)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        s.get('email'),
                        s.get('name'),
                        s.get('studentId'),
                        s.get('college'),
                        s.get('program'),
                        s.get('year'),
                        1 if s.get('isAdmin') else 0,
                        1 if s.get('loggedIn') else 0
                    )
                )
        except Exception as e:
            print(f"Migration error (session): {e}")

    # State
    row = conn.execute("SELECT value FROM app_store WHERE key = 'chainCampusState'").fetchone()
    if row:
        try:
            st = json.loads(row[0])
            conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('seeded', '1' if st.get('seeded') else '0'))
            conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('walletAddress', st.get('walletAddress', '')))
            if 'lastTransaction' in st:
                conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('lastTransaction', json.dumps(st['lastTransaction'])))
            if 'notifications' in st:
                conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('notifications', json.dumps(st['notifications'])))

            for c in st.get('courses', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO courses (id, code, name, credits, instructor, days, time, room, color)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        c.get('id'),
                        c.get('code'),
                        c.get('name'),
                        c.get('credits', 0),
                        c.get('instructor'),
                        json.dumps(c.get('days', [])),
                        c.get('time'),
                        c.get('room'),
                        c.get('color')
                    )
                )

            for cid in st.get('enrolledCourses', []):
                if active_student_id:
                    conn.execute(
                        "INSERT OR REPLACE INTO enrolled_courses (studentId, courseId) VALUES (?, ?)",
                        (active_student_id, cid)
                    )

            for ev in st.get('events', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO events (id, title, date, venue, capacity, description, verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ev.get('id'),
                        ev.get('title'),
                        ev.get('date'),
                        ev.get('venue'),
                        ev.get('capacity', 0),
                        ev.get('description'),
                        1 if ev.get('verified') else 0
                    )
                )

            for att in st.get('attendanceRecords', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO attendance_records (id, courseId, courseName, subject, date, status, verifier)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        att.get('id'),
                        att.get('courseId'),
                        att.get('courseName'),
                        att.get('subject'),
                        att.get('date'),
                        att.get('status'),
                        att.get('verifier')
                    )
                )

            for sa in st.get('scholarshipApplications', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO scholarship_applications (id, scholarshipId, title, amount, type, studentId, status, txId, appliedAt, reviewedAt, reviewTxId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sa.get('id'),
                        sa.get('scholarshipId'),
                        sa.get('title'),
                        sa.get('amount'),
                        sa.get('type'),
                        sa.get('studentId'),
                        sa.get('status'),
                        sa.get('txId'),
                        sa.get('appliedAt'),
                        sa.get('reviewedAt'),
                        sa.get('reviewTxId')
                    )
                )

            for tx in st.get('txLog', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO transactions (txId, action, status, ts)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        tx.get('txId'),
                        tx.get('action'),
                        tx.get('status'),
                        tx.get('ts')
                    )
                )
            conn.commit()
            print("Migration successful.")
        except Exception as e:
            print(f"Migration error (state): {e}")


def read_store():
    data = {}
    with get_db() as conn:
        # 1. Users
        users_rows = conn.execute("SELECT email, password, name, studentId, college, program, year, isAdmin, walletAddress FROM users").fetchall()
        users_list = []
        for r in users_rows:
            users_list.append({
                'email': r[0],
                'password': r[1],
                'name': r[2],
                'studentId': r[3],
                'college': r[4],
                'program': r[5],
                'year': r[6],
                'isAdmin': bool(r[7]),
                'walletAddress': r[8]
            })
        data['chainCampusUsers'] = users_list

        # 2. Session
        session_row = conn.execute("SELECT email, name, studentId, college, program, year, isAdmin, loggedIn FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
        if session_row:
            data['chainCampusSession'] = {
                'email': session_row[0],
                'name': session_row[1],
                'studentId': session_row[2],
                'college': session_row[3],
                'program': session_row[4],
                'year': session_row[5],
                'isAdmin': bool(session_row[6]),
                'loggedIn': bool(session_row[7])
            }
            active_student_id = session_row[2]
        else:
            data['chainCampusSession'] = None
            active_student_id = None

        # 3. State
        state = {
            'walletAddress': '',
            'student': {},
            'lastTransaction': { 'status': 'Idle', 'label': 'No transaction yet', 'message': '', 'txId': '' },
            'notifications': [],
            'attendanceRecords': [],
            'events': [],
            'courses': [],
            'enrolledCourses': [],
            'scholarshipApplications': [],
            'txLog': [],
            'seeded': False
        }

        meta_rows = conn.execute("SELECT key, value FROM app_metadata").fetchall()
        meta = {r[0]: r[1] for r in meta_rows}
        state['seeded'] = meta.get('seeded') == '1'
        state['walletAddress'] = meta.get('walletAddress', '')
        if 'lastTransaction' in meta:
            try:
                state['lastTransaction'] = json.loads(meta['lastTransaction'])
            except:
                pass
        if 'notifications' in meta:
            try:
                state['notifications'] = json.loads(meta['notifications'])
            except:
                pass

        courses_rows = conn.execute("SELECT id, code, name, credits, instructor, days, time, room, color FROM courses").fetchall()
        for r in courses_rows:
            try:
                days_list = json.loads(r[5])
            except:
                days_list = []
            state['courses'].append({
                'id': r[0],
                'code': r[1],
                'name': r[2],
                'credits': r[3],
                'instructor': r[4],
                'days': days_list,
                'time': r[6],
                'room': r[7],
                'color': r[8]
            })

        if active_student_id:
            enroll_rows = conn.execute("SELECT courseId FROM enrolled_courses WHERE studentId = ?", (active_student_id,)).fetchall()
            state['enrolledCourses'] = [r[0] for r in enroll_rows]
        else:
            enroll_rows = conn.execute("SELECT DISTINCT courseId FROM enrolled_courses").fetchall()
            state['enrolledCourses'] = [r[0] for r in enroll_rows]

        events_rows = conn.execute("SELECT id, title, date, venue, capacity, description, verified FROM events").fetchall()
        for r in events_rows:
            state['events'].append({
                'id': r[0],
                'title': r[1],
                'date': r[2],
                'venue': r[3],
                'capacity': r[4],
                'description': r[5],
                'verified': bool(r[6])
            })

        att_rows = conn.execute("SELECT id, courseId, courseName, subject, date, status, verifier FROM attendance_records").fetchall()
        for r in att_rows:
            state['attendanceRecords'].append({
                'id': r[0],
                'courseId': r[1],
                'courseName': r[2],
                'subject': r[3],
                'date': r[4],
                'status': r[5],
                'verifier': r[6]
            })

        sa_rows = conn.execute("SELECT id, scholarshipId, title, amount, type, studentId, status, txId, appliedAt, reviewedAt, reviewTxId FROM scholarship_applications").fetchall()
        for r in sa_rows:
            state['scholarshipApplications'].append({
                'id': r[0],
                'scholarshipId': r[1],
                'title': r[2],
                'amount': r[3],
                'type': r[4],
                'studentId': r[5],
                'status': r[6],
                'txId': r[7],
                'appliedAt': r[8],
                'reviewedAt': r[9],
                'reviewTxId': r[10]
            })

        tx_rows = conn.execute("SELECT txId, action, status, ts FROM transactions").fetchall()
        for r in tx_rows:
            state['txLog'].append({
                'txId': r[0],
                'action': r[1],
                'status': r[2],
                'ts': r[3]
            })

        if active_student_id:
            student_user = next((u for u in users_list if u['studentId'] == active_student_id), None)
            if student_user:
                state['student'] = {
                    'name': student_user['name'],
                    'studentId': student_user['studentId'],
                    'college': student_user['college'],
                    'program': student_user['program'],
                    'year': student_user['year']
                }

        data['chainCampusState'] = state
    return data


def write_store(key, value):
    with get_db() as conn:
        raw = json.dumps(value)
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

        if key == 'chainCampusUsers':
            for u in value:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO users (email, password, name, studentId, college, program, year, isAdmin, walletAddress)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        u.get('email'),
                        u.get('password'),
                        u.get('name'),
                        u.get('studentId'),
                        u.get('college'),
                        u.get('program'),
                        u.get('year'),
                        1 if u.get('isAdmin') else 0,
                        u.get('walletAddress')
                    )
                )
        
        elif key == 'chainCampusSession':
            conn.execute("DELETE FROM session")
            if value and value.get('loggedIn'):
                conn.execute(
                    """
                    INSERT INTO session (email, name, studentId, college, program, year, isAdmin, loggedIn)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        value.get('email'),
                        value.get('name'),
                        value.get('studentId'),
                        value.get('college'),
                        value.get('program'),
                        value.get('year'),
                        1 if value.get('isAdmin') else 0,
                        1 if value.get('loggedIn') else 0
                    )
                )
                if value.get('email'):
                    wallet_row = conn.execute("SELECT value FROM app_metadata WHERE key = 'walletAddress'").fetchone()
                    if wallet_row and wallet_row[0]:
                        conn.execute(
                            "UPDATE users SET walletAddress = ? WHERE email = ?",
                            (wallet_row[0], value.get('email'))
                        )

        elif key == 'chainCampusState':
            conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('seeded', '1' if value.get('seeded') else '0'))
            conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('walletAddress', value.get('walletAddress', '')))
            if 'lastTransaction' in value:
                conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('lastTransaction', json.dumps(value['lastTransaction'])))
            if 'notifications' in value:
                conn.execute("INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)", ('notifications', json.dumps(value['notifications'])))

            session_row = conn.execute("SELECT email FROM session LIMIT 1").fetchone()
            if session_row and value.get('walletAddress'):
                conn.execute(
                    "UPDATE users SET walletAddress = ? WHERE email = ?",
                    (value.get('walletAddress'), session_row[0])
                )

            for c in value.get('courses', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO courses (id, code, name, credits, instructor, days, time, room, color)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        c.get('id'),
                        c.get('code'),
                        c.get('name'),
                        c.get('credits', 0),
                        c.get('instructor'),
                        json.dumps(c.get('days', [])),
                        c.get('time'),
                        c.get('room'),
                        c.get('color')
                    )
                )

            session_row = conn.execute("SELECT studentId FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
            if session_row and session_row[0]:
                student_id = session_row[0]
                conn.execute("DELETE FROM enrolled_courses WHERE studentId = ?", (student_id,))
                for cid in value.get('enrolledCourses', []):
                    conn.execute(
                        "INSERT OR REPLACE INTO enrolled_courses (studentId, courseId) VALUES (?, ?)",
                        (student_id, cid)
                    )

            for ev in value.get('events', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO events (id, title, date, venue, capacity, description, verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ev.get('id'),
                        ev.get('title'),
                        ev.get('date'),
                        ev.get('venue'),
                        ev.get('capacity', 0),
                        ev.get('description'),
                        1 if ev.get('verified') else 0
                    )
                )

            for att in value.get('attendanceRecords', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO attendance_records (id, courseId, courseName, subject, date, status, verifier)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        att.get('id'),
                        att.get('courseId'),
                        att.get('courseName'),
                        att.get('subject'),
                        att.get('date'),
                        att.get('status'),
                        att.get('verifier')
                    )
                )

            for sa in value.get('scholarshipApplications', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO scholarship_applications (id, scholarshipId, title, amount, type, studentId, status, txId, appliedAt, reviewedAt, reviewTxId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        sa.get('id'),
                        sa.get('scholarshipId'),
                        sa.get('title'),
                        sa.get('amount'),
                        sa.get('type'),
                        sa.get('studentId'),
                        sa.get('status'),
                        sa.get('txId'),
                        sa.get('appliedAt'),
                        sa.get('reviewedAt'),
                        sa.get('reviewTxId')
                    )
                )

            for tx in value.get('txLog', []):
                conn.execute(
                    """
                    INSERT OR REPLACE INTO transactions (txId, action, status, ts)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        tx.get('txId'),
                        tx.get('action'),
                        tx.get('status'),
                        tx.get('ts')
                    )
                )
        conn.commit()


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
