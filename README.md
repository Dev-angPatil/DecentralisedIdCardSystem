# ChainCampus (Decentralised ID Card System)

ChainCampus is a minimalist Web3-ready student platform built for our college MVP presentation. It demonstrates student identity, wallet connection, courses, events, attendance, scholarship applications, admin workflows, local smart contract code, and basic SQLite persistence.

## MVP Status: What's Currently Working?

The project is currently demo-ready in local/mock mode. The frontend flow works without needing deployed Solana smart contracts or real transaction fees.

### 1. Functional User Interfaces

- **Student Login / Signup**: Students can create accounts and log in.
- **Student Dashboard (`dashboard.html`)**: Shows student overview, transaction log, last transaction, and scholarship applications.
- **Profile (`profile.html`)**: Shows student identity details and wallet status.
- **Courses (`courses.html`)**: Students can enroll in courses through the blockchain abstraction layer.
- **Events (`events.html`)**: Students can register for events through the blockchain abstraction layer.
- **Attendance (`attendance.html`)**: Attendance UI and local demo records are available.
- **Scholarships (`schol.html`)**: Students can browse scholarships and apply through the on-chain/mock flow.
- **Admin Dashboard (`admin_dashboard.html`)**: Shows admin metrics and management shortcuts.
- **Manage Courses (`admin_courses.html`)**: Admin can create courses.
- **Manage Events (`admin_events.html`)**: Admin can create events.
- **Manage Scholarships (`admin_scholarships.html`)**: Admin can view scholarship applications and approve/reject them.

Admin login:

```text
Email: admin@college.edu
Password: Admin()09
```

### 2. Web3 Mock Mode & Phantom Integration

- The frontend connects to Phantom wallet through `js/main.js`.
- Blockchain actions go through `js/blockchain.js`.
- The app currently runs in mock/auto mode for smooth demo transactions.
- Actions generate mock transaction IDs and update the dashboard transaction log.

### 3. Smart Contract Blueprints

Anchor/Rust smart contract code exists locally inside:

```text
chain_campus/programs/chain_campus/src/
```

Local smart contract code exists for:

- student registration
- event creation
- event registration
- attendance marking
- attendance verification
- course creation
- course enrollment
- scholarship creation
- scholarship application
- scholarship approval/rejection

Current blockchain status:

```text
Smart contract code: Present locally
Anchor build: Not completed with Anchor CLI
Solana deployment: Not deployed yet
Frontend mode: Mock/auto demo mode
```

### 4. SQLite Demo Storage

The project includes a basic Python SQLite backend:

```text
server.py
```

It stores demo data in:

```text
data/chaincampus.db
```

SQLite currently stores demo data such as users, sessions, app state, transactions, courses, events, attendance records, and scholarship applications. This is intentionally simple and demo-friendly.

Tables used:

```text
app_store
audit_log
```

## Done

- Scholarship smart contract state and instruction files added.
- Scholarship actions connected into the Anchor program entrypoint.
- Scholarship apply flow connected to `js/blockchain.js`.
- Student **My Applications** section added to the dashboard.
- Separate admin **Manage Scholarships** page added.
- Admin approval/rejection flow added for scholarship applications.
- Basic SQLite persistence added using `server.py` and `js/db.js`.
- README updated with current run steps and teammate tasks.

## How To Run and Test The MVP

Use the SQLite-backed demo server:

```bash
cd DecentralisedIdCardSystem
python server.py
```

Then open:

```text
http://localhost:8000
```

For only a static UI preview without SQLite persistence, run:

```bash
python -m http.server 8000
```

## Demo Flow

1. Sign up or log in as a student.
2. Connect Phantom wallet or skip wallet for demo.
3. Open **Scholarships**.
4. Apply for a scholarship.
5. Confirm the student is redirected to **My Applications**.
6. Log in as admin.
7. Open **Manage Scholarships**.
8. Approve or reject the application.
9. Log back in as student and check updated application status.

## Teammates To-Do List & Next Steps

### Demo Testing

1. Test student signup/login.
2. Test admin login.
3. Test course enrollment.
4. Test event registration.
5. Test scholarship apply flow.
6. Test admin scholarship approval/rejection.
7. Confirm SQLite persistence works after refresh when using `python server.py`.

### UI Polish

1. Check all pages on laptop screen size.
2. Fix any remaining text/encoding issues.
3. Prepare a short demo script for presentation.
4. Add screenshots to the report if needed.

### SQLite Improvements

Current SQLite is basic JSON-style persistence. Future improvement can convert it into proper relational tables:

- `users`
- `courses`
- `events`
- `attendance_records`
- `scholarships`
- `scholarship_applications`
- `transactions`

### Blockchain Deployment

To move from mock mode to real Solana localnet/devnet:

1. Install Rust, Solana CLI, and Anchor in WSL Ubuntu.
2. Build the contract:
   ```bash
   anchor build
   ```
3. Start local validator:
   ```bash
   solana-test-validator
   ```
4. Deploy:
   ```bash
   anchor deploy
   ```
5. Update Program ID in:
   - `chain_campus/programs/chain_campus/src/lib.rs`
   - `chain_campus/Anchor.toml`
   - `js/blockchain.js`
6. Connect the generated IDL from:
   ```text
   chain_campus/target/idl/
   ```

## Future Scope

- Deploy smart contracts to Solana devnet.
- Replace mock transactions with real Anchor transactions.
- Add QR/NFC-based student ID verification.
- Normalize SQLite into proper relational tables.
- Add document upload/verification for scholarship applications.
