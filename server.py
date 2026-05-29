import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sqlite3

# Try to import psycopg2 for Postgres support on Render
try:
    import psycopg2
except ImportError:
    psycopg2 = None


ROOT = Path(__file__).resolve().parent
DB_DIR = Path(os.environ.get("DB_DIR", ROOT / "data"))
DB_PATH = DB_DIR / "chaincampus.db"


TABLE_PRIMARY_KEYS = {
    "app_store": ["key"],
    "users": ["email"],
    "courses": ["id"],
    "events": ["id"],
    "attendance_records": ["id"],
    "enrolled_courses": ["studentId", "courseId"],
    "scholarship_applications": ["id"],
    "transactions": ["txId"],
    "session": ["email"],
    "app_metadata": ["key"]
}


def translate_query(sql, params, is_postgres):
    if not is_postgres:
        return sql, params

    # Convert ? placeholders to %s for postgres
    sql = sql.replace("?", "%s")

    # Rewrite SQLite AUTOINCREMENT to Postgres SERIAL
    sql = re.sub(r"\bINTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT\b", "SERIAL PRIMARY KEY", sql, flags=re.IGNORECASE)

    # Rewrite TEXT DEFAULT CURRENT_TIMESTAMP to TEXT DEFAULT CURRENT_TIMESTAMP::text
    sql = re.sub(r"\bTEXT\s+DEFAULT\s+CURRENT_TIMESTAMP\b", "TEXT DEFAULT CURRENT_TIMESTAMP::text", sql, flags=re.IGNORECASE)

    # Rewrite INSERT OR REPLACE INTO table (cols) VALUES (vals)
    match = re.match(r"^\s*INSERT\s+OR\s+REPLACE\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)", sql, re.IGNORECASE | re.DOTALL)
    if match:
        table_name = match.group(1)
        cols_str = match.group(2)
        vals_str = match.group(3)
        cols = [c.strip() for c in cols_str.split(",")]
        
        # Get primary key(s)
        pks = TABLE_PRIMARY_KEYS.get(table_name.lower(), ["id"])
        
        # Build ON CONFLICT clause
        pk_str = ", ".join(pks)
        update_cols = [c for c in cols if c not in pks]
        if update_cols:
            update_str = ", ".join(f"{c} = EXCLUDED.{c}" for c in update_cols)
            sql = f"INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str}) ON CONFLICT ({pk_str}) DO UPDATE SET {update_str}"
        else:
            sql = f"INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str}) ON CONFLICT ({pk_str}) DO NOTHING"

    return sql, params


class DBWrapper:
    def __init__(self, conn, is_postgres=False):
        self.conn = conn
        self.is_postgres = is_postgres

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rollback()
        else:
            self.commit()

    def commit(self):
        self.conn.commit()

    def rollback(self):
        try:
            self.conn.rollback()
        except:
            pass

    def close(self):
        self.conn.close()

    def execute(self, sql, params=None):
        sql, params = translate_query(sql, params, self.is_postgres)
        
        if self.is_postgres:
            cur = self.conn.cursor()
            try:
                cur.execute(sql, params or ())
                return CursorWrapper(cur)
            except Exception as e:
                try:
                    self.conn.rollback()
                except:
                    pass
                raise e
        else:
            if params is not None:
                return CursorWrapper(self.conn.execute(sql, params))
            return CursorWrapper(self.conn.execute(sql))


class CursorWrapper:
    def __init__(self, cursor_res):
        self.res = cursor_res

    def fetchone(self):
        return self.res.fetchone()

    def fetchall(self):
        return self.res.fetchall()

    def __iter__(self):
        return iter(self.res)

    def __del__(self):
        try:
            self.res.close()
        except:
            pass


def get_db():
    database_url = os.environ.get("DATABASE_URL")
    if database_url and psycopg2:
        print("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(database_url)
        wrapped_conn = DBWrapper(conn, is_postgres=True)
    else:
        print("Connecting to SQLite database...")
        DB_DIR.mkdir(exist_ok=True)
        conn = sqlite3.connect(DB_PATH)
        wrapped_conn = DBWrapper(conn, is_postgres=False)
        
    conn = wrapped_conn
    
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
            username TEXT UNIQUE,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            studentId TEXT,
            college TEXT,
            program TEXT,
            year TEXT,
            isAdmin INTEGER DEFAULT 0,
            walletAddress TEXT,
            virtualBalance REAL DEFAULT 5.00
        )
        """
    )
    try:
        conn.execute("ALTER TABLE users ADD COLUMN username TEXT")
        conn.commit()
    except Exception:
        pass
    try:
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)")
        conn.commit()
    except Exception:
        pass
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
            loggedIn INTEGER DEFAULT 0,
            walletAddress TEXT,
            virtualBalance REAL DEFAULT 5.00
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
    
    # Run dynamic migrations to ensure compatibility if db already exists
    try:
        conn.execute("ALTER TABLE users ADD COLUMN virtualBalance REAL DEFAULT 5.00")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE session ADD COLUMN virtualBalance REAL DEFAULT 5.00")
    except Exception:
        pass
    try:
        conn.execute("ALTER TABLE session ADD COLUMN walletAddress TEXT")
    except Exception:
        pass
        
    conn.commit()

    # 3. Migrate any existing data in app_store into relational tables
    migrate_data(conn)

    # 4. Seed default data if database is empty
    seed_db(conn)

    return conn


def seed_db(conn):
    # Seed default admin if users table is empty
    count = conn.execute("SELECT count(*) FROM users").fetchone()[0]
    if count == 0:
        print("Seeding default admin user...")
        conn.execute(
            """
            INSERT OR REPLACE INTO users (email, username, password, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            """,
            (
                "admin@college.edu",
                "admin",
                "Admin()09",
                "System Admin",
                "AD-001",
                "ChainCampus",
                "Administration",
                "N/A",
                "CCvWAdmin",
                5.00
            )
        )
        conn.commit()

    # Seed default courses if courses table is empty
    count_courses = conn.execute("SELECT count(*) FROM courses").fetchone()[0]
    if count_courses == 0:
        print("Seeding default courses...")
        default_courses = [
            ("cs101", "CS101", "Data Structures & Algorithms", 4, "Dr. Priya Sharma", '["Mon","Wed","Fri"]', "9:00 AM", "LH-201", "blue"),
            ("cs201", "CS201", "Database Management Systems", 3, "Prof. Rahul Verma", '["Tue","Thu"]', "11:00 AM", "LH-102", "pink"),
            ("cs301", "CS301", "Computer Networks", 4, "Dr. Anjali Nair", '["Mon","Wed","Fri"]', "2:00 PM", "LH-305", "mint"),
            ("cs401", "CS401", "Operating Systems", 4, "Prof. Vikram Singh", '["Tue","Thu"]', "9:00 AM", "LH-203", "peach"),
            ("ma101", "MA101", "Engineering Mathematics IV", 3, "Dr. Meena Krishnan", '["Mon","Wed","Fri"]', "11:00 AM", "LH-101", "lavender"),
            ("cs501", "CS501", "Machine Learning", 3, "Dr. Arjun Patel", '["Tue","Thu"]', "2:00 PM", "ML-Lab-1", "violet"),
            ("cs601", "CS601", "Blockchain Technology", 3, "Prof. Deepa Menon", '["Wed","Fri"]', "4:00 PM", "LH-404", "rose"),
            ("cs701", "CS701", "Web Development", 3, "Dr. Suresh Kumar", '["Mon","Thu"]', "4:00 PM", "CS-Lab-2", "amber")
        ]
        for c in default_courses:
            conn.execute(
                """
                INSERT OR REPLACE INTO courses (id, code, name, credits, instructor, days, time, room, color)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                c
            )
        conn.commit()

    # Seed default events if events table is empty
    count_events = conn.execute("SELECT count(*) FROM events").fetchone()[0]
    if count_events == 0:
        print("Seeding default events...")
        default_events = [
            ("evt1", "Blockchain Hackathon 2026", "May 10, 2026", "Innovation Hub", 100, "Build decentralised apps on Solana and compete for prizes.", 0),
            ("evt2", "Web3 Summit", "May 18, 2026", "Main Auditorium", 500, "Industry leaders discuss Web3, DeFi, and decentralised identity.", 0),
            ("evt3", "AI × Blockchain Workshop", "June 2, 2026", "CS Lab 1", 50, "Hands-on workshop combining AI agents with blockchain-verified data.", 0),
            ("evt4", "Annual Tech Fest 2026", "June 15, 2026", "Campus Grounds", 1000, "The biggest campus tech event with competitions, talks & networking.", 0)
        ]
        for ev in default_events:
            conn.execute(
                """
                INSERT OR REPLACE INTO events (id, title, date, venue, capacity, description, verified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                ev
            )
        conn.commit()


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
        users_rows = conn.execute("SELECT email, password, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance FROM users").fetchall()
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
                'walletAddress': r[8],
                'virtualBalance': r[9]
            })
        data['chainCampusUsers'] = users_list

        # 2. Session
        session_row = conn.execute("SELECT email, name, studentId, college, program, year, isAdmin, loggedIn, walletAddress, virtualBalance FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
        if session_row:
            data['chainCampusSession'] = {
                'email': session_row[0],
                'name': session_row[1],
                'studentId': session_row[2],
                'college': session_row[3],
                'program': session_row[4],
                'year': session_row[5],
                'isAdmin': bool(session_row[6]),
                'loggedIn': bool(session_row[7]),
                'walletAddress': session_row[8],
                'virtualBalance': session_row[9]
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
                    'year': student_user['year'],
                    'walletAddress': student_user['walletAddress'],
                    'virtualBalance': student_user['virtualBalance']
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
                    INSERT OR REPLACE INTO users (email, password, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        u.get('walletAddress'),
                        u.get('virtualBalance', 5.00)
                    )
                )
        
        elif key == 'chainCampusSession':
            conn.execute("DELETE FROM session")
            if value and value.get('loggedIn'):
                conn.execute(
                    """
                    INSERT INTO session (email, name, studentId, college, program, year, isAdmin, loggedIn, walletAddress, virtualBalance)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        value.get('email'),
                        value.get('name'),
                        value.get('studentId'),
                        value.get('college'),
                        value.get('program'),
                        value.get('year'),
                        1 if value.get('isAdmin') else 0,
                        1 if value.get('loggedIn') else 0,
                        value.get('walletAddress'),
                        value.get('virtualBalance', 5.00)
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
        # 1. Web3 Auth: Wallet Lookup
        if self.path == "/api/auth/wallet":
            try:
                payload = self.read_json_body()
                wallet_addr = payload.get("walletAddress")
                if not wallet_addr:
                    self.send_json(400, {"error": "walletAddress required"})
                    return
                
                with get_db() as conn:
                    row = conn.execute(
                        "SELECT email, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance FROM users WHERE walletAddress = ?",
                        (wallet_addr,)
                    ).fetchone()
                    
                    if row:
                        user = {
                            "email": row[0],
                            "name": row[1],
                            "studentId": row[2],
                            "college": row[3],
                            "program": row[4],
                            "year": row[5],
                            "isAdmin": bool(row[6]),
                            "walletAddress": row[7],
                            "virtualBalance": row[8],
                            "loggedIn": True
                        }
                        
                        # Set active session
                        conn.execute("DELETE FROM session")
                        conn.execute(
                            """
                            INSERT INTO session (email, name, studentId, college, program, year, isAdmin, loggedIn, walletAddress, virtualBalance)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                            """,
                            (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8])
                        )
                        conn.commit()
                        self.send_json(200, {"ok": True, "user": user})
                    else:
                        self.send_json(200, {"ok": False, "reason": "unregistered"})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 2. Web3 Auth: Onboard and Create Profile
        if self.path == "/api/auth/register-profile":
            try:
                payload = self.read_json_body()
                email = payload.get("email")
                name = payload.get("name")
                student_id = payload.get("studentId")
                college = payload.get("college")
                program = payload.get("program") # Branch
                year = payload.get("year")
                wallet_addr = payload.get("walletAddress")
                virtual_balance = float(payload.get("virtualBalance", 5.00))
                
                if not student_id:
                    import time, random
                    student_id = f"CC-{time.strftime('%Y')}-{random.randint(1000, 9999)}"
                
                if not email or not name:
                    self.send_json(400, {"error": "Missing required fields (email, name)"})
                    return
                
                # Generate unique username in format: name.randomnumber@vit.edu
                import random
                clean_name = "".join(c for c in name.split()[0].lower() if c.isalnum())
                rand_num = random.randint(1000, 9999)
                username = f"{clean_name}.{rand_num}@vit.edu"
                
                # Password is same as username
                password = username
                
                # Auto-generate a virtual wallet address if none is provided
                if not wallet_addr:
                    import hashlib
                    h = hashlib.sha256(f"{email}-{username}".encode()).hexdigest()
                    wallet_addr = f"CCvW{h[:36]}"
                
                with get_db() as conn:
                    # check if email already exists
                    existing = conn.execute("SELECT email FROM users WHERE email = ?", (email,)).fetchone()
                    if existing:
                        self.send_json(400, {"error": "A student profile with this email address is already registered."})
                        return
                    
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO users (email, username, password, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
                        """,
                        (email, username, password, name, student_id, college, program, year, wallet_addr, virtual_balance)
                    )
                    
                    user = {
                        "email": email,
                        "username": username,
                        "name": name,
                        "studentId": student_id,
                        "college": college,
                        "program": program,
                        "year": year,
                        "isAdmin": False,
                        "walletAddress": wallet_addr,
                        "virtualBalance": virtual_balance,
                        "loggedIn": False # Auto-fill in UI instead of immediate login so they can copy credentials!
                    }
                    conn.commit()
                    self.send_json(200, {
                        "ok": True,
                        "username": username,
                        "password": password,
                        "user": user
                    })
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 3. Credentials Auth (Supports generated username OR email)
        if self.path == "/api/auth/credentials":
            try:
                payload = self.read_json_body()
                email = payload.get("email") # Accepts username or email
                password = payload.get("password")
                
                if not email or not password:
                    self.send_json(400, {"error": "Username/Email and password required"})
                    return
                
                with get_db() as conn:
                    row = conn.execute(
                        "SELECT email, name, studentId, college, program, year, isAdmin, walletAddress, virtualBalance, username FROM users WHERE (email = ? OR username = ?) AND password = ?",
                        (email, email, password)
                    ).fetchone()
                    
                    if row:
                        user = {
                            "email": row[0],
                            "name": row[1],
                            "studentId": row[2],
                            "college": row[3],
                            "program": row[4],
                            "year": row[5],
                            "isAdmin": bool(row[6]),
                            "walletAddress": row[7],
                            "virtualBalance": row[8],
                            "username": row[9],
                            "loggedIn": True
                        }
                        
                        conn.execute("DELETE FROM session")
                        conn.execute(
                            """
                            INSERT INTO session (email, name, studentId, college, program, year, isAdmin, loggedIn, walletAddress, virtualBalance)
                            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
                            """,
                            (row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8])
                        )
                        conn.commit()
                        self.send_json(200, {"ok": True, "user": user})
                    else:
                        self.send_json(200, {"ok": False, "reason": "invalid"})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 4. Auth Logout
        if self.path == "/api/auth/logout":
            try:
                with get_db() as conn:
                    conn.execute("DELETE FROM session")
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 5. Relational Courses: Enroll
        if self.path == "/api/courses/enroll":
            try:
                payload = self.read_json_body()
                course_id = payload.get("courseId")
                if not course_id:
                    self.send_json(400, {"error": "courseId required"})
                    return
                
                with get_db() as conn:
                    session_row = conn.execute("SELECT studentId FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
                    if not session_row:
                        self.send_json(401, {"error": "Unauthorized session"})
                        return
                    
                    student_id = session_row[0]
                    # Check duplicate
                    exists = conn.execute("SELECT 1 FROM enrolled_courses WHERE studentId = ? AND courseId = ?", (student_id, course_id)).fetchone()
                    if exists:
                        self.send_json(400, {"error": "Already enrolled in this course"})
                        return
                    
                    conn.execute(
                        "INSERT OR REPLACE INTO enrolled_courses (studentId, courseId) VALUES (?, ?)",
                        (student_id, course_id)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 6. Relational Events: Register
        if self.path == "/api/events/register":
            try:
                payload = self.read_json_body()
                event_id = payload.get("eventId") or payload.get("id")
                if not event_id:
                    self.send_json(400, {"error": "eventId required"})
                    return
                
                with get_db() as conn:
                    row = conn.execute("SELECT capacity FROM events WHERE id = ?", (event_id,)).fetchone()
                    if row:
                        if row[0] <= 0:
                            self.send_json(400, {"error": "Event is already at full capacity"})
                            return
                        cap = max(0, row[0] - 1)
                        conn.execute("UPDATE events SET capacity = ? WHERE id = ?", (cap, event_id))
                        conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 6a. Wallet Airdrop
        if self.path == "/api/wallet/airdrop":
            try:
                payload = self.read_json_body()
                amount = float(payload.get("amount", 1.0))
                with get_db() as conn:
                    session_row = conn.execute("SELECT email FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
                    if not session_row:
                        self.send_json(401, {"error": "Unauthorized session"})
                        return
                    
                    email = session_row[0]
                    conn.execute("UPDATE users SET virtualBalance = virtualBalance + ? WHERE email = ?", (amount, email))
                    conn.execute("UPDATE session SET virtualBalance = virtualBalance + ? WHERE email = ?", (amount, email))
                    
                    new_bal = conn.execute("SELECT virtualBalance FROM users WHERE email = ?", (email,)).fetchone()[0]
                    conn.commit()
                self.send_json(200, {"ok": True, "virtualBalance": new_bal})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 6b. Wallet Transfer (closed-loop admin payout)
        if self.path == "/api/wallet/transfer":
            try:
                payload = self.read_json_body()
                recipient_id = payload.get("recipientId")
                amount = float(payload.get("amount", 0.0))
                action_desc = payload.get("action", "Scholarship Payout")
                
                if not recipient_id or amount <= 0:
                    self.send_json(400, {"error": "recipientId and positive amount required"})
                    return
                
                with get_db() as conn:
                    session_row = conn.execute("SELECT isAdmin FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
                    if not session_row or not session_row[0]:
                        self.send_json(403, {"error": "Admin access required"})
                        return
                    
                    rec_row = conn.execute(
                        "SELECT email, walletAddress, studentId FROM users WHERE studentId = ? OR walletAddress = ? OR email = ?",
                        (recipient_id, recipient_id, recipient_id)
                    ).fetchone()
                    
                    if not rec_row:
                        self.send_json(404, {"error": "Recipient user not found"})
                        return
                    
                    rec_email, rec_wallet, rec_student_id = rec_row
                    conn.execute("UPDATE users SET virtualBalance = virtualBalance + ? WHERE email = ?", (amount, rec_email))
                    conn.execute("UPDATE session SET virtualBalance = virtualBalance + ? WHERE email = ?", (amount, rec_email))
                    
                    import time
                    tx_id = f"tx_transfer_{int(time.time())}"
                    ts = time.strftime("%Y-%m-%d %H:%M:%S")
                    conn.execute(
                        "INSERT INTO transactions (txId, action, status, ts) VALUES (?, ?, 'success', ?)",
                        (tx_id, f"{action_desc} of {amount} SOL to {rec_wallet or rec_student_id}", ts)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True, "txId": tx_id, "amount": amount})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 6c. Wallet Deduct Gas
        if self.path == "/api/wallet/deduct-gas":
            try:
                payload = self.read_json_body()
                amount = float(payload.get("amount", 0.005))
                action = payload.get("action", "Transaction Gas Fee")
                
                with get_db() as conn:
                    session_row = conn.execute("SELECT email, virtualBalance FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
                    if not session_row:
                        self.send_json(401, {"error": "Unauthorized session"})
                        return
                    
                    email, current_bal = session_row
                    if current_bal < amount:
                        self.send_json(400, {"error": "Insufficient virtual balance for transaction gas"})
                        return
                    
                    conn.execute("UPDATE users SET virtualBalance = virtualBalance - ? WHERE email = ?", (amount, email))
                    conn.execute("UPDATE session SET virtualBalance = virtualBalance - ? WHERE email = ?", (amount, email))
                    
                    import time
                    tx_id = f"tx_gas_{int(time.time())}"
                    ts = time.strftime("%Y-%m-%d %H:%M:%S")
                    conn.execute(
                        "INSERT INTO transactions (txId, action, status, ts) VALUES (?, ?, 'success', ?)",
                        (tx_id, f"{action} (Gas: {amount} SOL)", ts)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True, "txId": tx_id, "gasDeducted": amount})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 7. Relational Scholarships: Apply
        if self.path == "/api/scholarships/apply":
            try:
                payload = self.read_json_body()
                schol_id = payload.get("scholarshipId")
                title = payload.get("title")
                amount = payload.get("amount")
                schol_type = payload.get("type")
                tx_id = payload.get("txId")
                
                if not schol_id or not title:
                    self.send_json(400, {"error": "scholarshipId and title required"})
                    return
                
                import time
                app_id = f"app_{int(time.time())}"
                applied_at = time.strftime("%Y-%m-%d %H:%M:%S")
                
                with get_db() as conn:
                    session_row = conn.execute("SELECT studentId FROM session WHERE loggedIn = 1 LIMIT 1").fetchone()
                    if not session_row:
                        self.send_json(401, {"error": "Unauthorized session"})
                        return
                    
                    student_id = session_row[0]
                    conn.execute(
                        """
                        INSERT INTO scholarship_applications (id, scholarshipId, title, amount, type, studentId, status, txId, appliedAt)
                        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?)
                        """,
                        (app_id, schol_id, title, amount, schol_type, student_id, tx_id, applied_at)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True, "applicationId": app_id})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 8. Relational Scholarships: Review
        if self.path == "/api/scholarships/review":
            try:
                payload = self.read_json_body()
                app_id = payload.get("id") or payload.get("applicationId")
                status = payload.get("status")
                review_tx_id = payload.get("reviewTxId")
                
                if not app_id or not status:
                    self.send_json(400, {"error": "applicationId (id) and status required"})
                    return
                
                import time
                reviewed_at = time.strftime("%Y-%m-%d %H:%M:%S")
                
                with get_db() as conn:
                    conn.execute(
                        """
                        UPDATE scholarship_applications
                        SET status = ?, reviewTxId = ?, reviewedAt = ?
                        WHERE id = ?
                        """,
                        (status, review_tx_id, reviewed_at, app_id)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 9. Relational Transactions: Add
        if self.path == "/api/transactions/add":
            try:
                payload = self.read_json_body()
                tx_id = payload.get("txId")
                action = payload.get("action")
                status = payload.get("status", "success")
                
                if not tx_id or not action:
                    self.send_json(400, {"error": "txId and action required"})
                    return
                
                import time
                ts = time.strftime("%Y-%m-%d %H:%M:%S")
                
                with get_db() as conn:
                    conn.execute(
                        "INSERT OR REPLACE INTO transactions (txId, action, status, ts) VALUES (?, ?, ?, ?)",
                        (tx_id, action, status, ts)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 10. Relational Events: Create (Admin)
        if self.path == "/api/events/create":
            try:
                payload = self.read_json_body()
                event_id = payload.get("id") or payload.get("eventId")
                title = payload.get("title")
                date = payload.get("date")
                venue = payload.get("venue")
                capacity = payload.get("capacity", 100)
                description = payload.get("description", "")
                verified = payload.get("verified", 0)
                
                if not event_id or not title:
                    self.send_json(400, {"error": "id and title required"})
                    return
                
                with get_db() as conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO events (id, title, date, venue, capacity, description, verified)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (event_id, title, date, venue, capacity, description, 1 if verified else 0)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 11. Relational Courses: Create (Admin)
        if self.path == "/api/courses/create":
            try:
                payload = self.read_json_body()
                course_id = payload.get("id") or payload.get("courseId")
                code = payload.get("code")
                name = payload.get("name")
                credits = payload.get("credits", 3)
                instructor = payload.get("instructor")
                days = payload.get("days", [])
                time = payload.get("time")
                room = payload.get("room")
                color = payload.get("color", "blue")
                
                if not course_id or not name:
                    self.send_json(400, {"error": "id and name required"})
                    return
                
                import json
                days_json = json.dumps(days)
                
                with get_db() as conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO courses (id, code, name, credits, instructor, days, time, room, color)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (course_id, code, name, credits, instructor, days_json, time, room, color)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # 12. Relational Attendance: Mark
        if self.path == "/api/attendance/mark":
            try:
                payload = self.read_json_body()
                att_id = payload.get("id")
                course_id = payload.get("courseId")
                course_name = payload.get("courseName")
                subject = payload.get("subject")
                date = payload.get("date")
                status = payload.get("status")
                verifier = payload.get("verifier")
                
                if not att_id or not course_id:
                    self.send_json(400, {"error": "id and courseId required"})
                    return
                
                with get_db() as conn:
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO attendance_records (id, courseId, courseName, subject, date, status, verifier)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        """,
                        (att_id, course_id, course_name, subject, date, status, verifier)
                    )
                    conn.commit()
                self.send_json(200, {"ok": True})
            except Exception as e:
                self.send_json(500, {"error": str(e)})
            return

        # Fallback 404 for unmatched routes
        self.send_json(404, {"error": "Endpoint not found"})


if __name__ == "__main__":
    get_db().close()
    port = int(os.environ.get("PORT", 8000))
    server = ThreadingHTTPServer(("0.0.0.0", port), ChainCampusHandler)
    print(f"ChainCampus running at http://0.0.0.0:{port}")
    print(f"SQLite database: {DB_PATH}")
    server.serve_forever()
