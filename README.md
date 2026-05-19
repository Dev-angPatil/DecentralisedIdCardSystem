# ChainCampus (Decentralised ID Card System)

ChainCampus is a Web3-ready student platform for our college MVP presentation. It demonstrates student identity, courses, events, attendance, scholarships, admin workflows, Phantom wallet connection, mock blockchain transactions, local Anchor smart contract code, and SQLite-backed demo persistence.

## Current MVP Status

The project is demo-ready in local/mock mode. Smart contract code is present locally, but it has not yet been deployed to Solana localnet/devnet.

### Working Student Features

- **Login / Signup**: Student accounts can be created and used for login.
- **Student Dashboard (`dashboard.html`)**: Shows student overview, transaction log, and last blockchain action.
- **Profile / ID Card (`profile.html`)**: Shows student identity details and wallet status.
- **Courses (`courses.html`)**: Students can enroll in courses through the blockchain abstraction layer.
- **Events (`events.html`)**: Students can register for events through the blockchain abstraction layer.
- **Attendance (`attendance.html`)**: Attendance UI and local demo records are available.
- **Scholarships (`schol.html`)**: Students can browse scholarships, apply on-chain through mock mode, and get redirected to **My Applications**.
- **My Applications**: Submitted scholarship applications appear on the student dashboard with status updates.

### Working Admin Features

- **Admin Dashboard (`admin_dashboard.html`)**: Shows admin-level metrics and quick actions.
- **Manage Courses (`admin_courses.html`)**: Admin can create courses through the blockchain abstraction layer.
- **Manage Events (`admin_events.html`)**: Admin can create events through the blockchain abstraction layer.
- **Manage Scholarships (`admin_scholarships.html`)**: Admin can view student scholarship applications and approve/reject them.

Admin login:

```text
Email: admin@college.edu
Password: Admin()09
```

### Blockchain / Smart Contract Status

The frontend uses `js/blockchain.js` as a single abstraction layer for all blockchain actions. Right now it works in mock/auto mode so the demo runs smoothly without fees or deployed programs.

Local Anchor smart contract code exists for:

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

Important status:

```text
Smart contract code: Present locally
Anchor build: Not completed with Anchor CLI
Solana deployment: Not deployed yet
Frontend mode: Mock/auto demo mode
```

### SQLite Demo Storage

The project now includes a tiny Python SQLite backend:

```text
server.py
```

It stores demo data in:

```text
data/chaincampus.db
```

SQLite currently stores data as JSON snapshots for demo persistence:

- users
- current session
- app state
- wallet address
- events
- courses
- attendance records
- transaction log
- scholarship applications

Tables used:

```text
app_store
audit_log
```

This is intentionally basic and FY-friendly. It is not a fully normalized production database yet.

## How To Run

Use the SQLite-backed demo server:

```bash
cd DecentralisedIdCardSystem
python server.py
```

Then open:

```text
http://localhost:8000
```

For a static preview without SQLite persistence, you can still run:

```bash
python -m http.server 8000
```

## What Was Added Recently

- Added scholarship smart contract files in the Anchor program.
- Added scholarship application and review instructions.
- Connected scholarship functions into `lib.rs`, `instructions/mod.rs`, `state/mod.rs`, and `constants.rs`.
- Connected scholarship apply flow to `js/blockchain.js`.
- Added `js/scholarships.js` for student scholarship applications.
- Added **My Applications** section on the student dashboard.
- Added separate **Manage Scholarships** admin page.
- Added admin approval/rejection flow for scholarship applications.
- Added SQLite-backed persistence using `server.py` and `js/db.js`.
- Updated the README and run instructions for the new SQLite server.

## Teammates To-Do List

### Demo Testing Team

1. Test student signup and login.
2. Test admin login.
3. Test wallet connect/skip flow.
4. Apply for a scholarship as a student.
5. Confirm the student is redirected to **My Applications**.
6. Login as admin and approve/reject the application in **Manage Scholarships**.
7. Login again as student and confirm the application status changed.
8. Test course enrollment and event registration.
9. Check that data remains after refresh when running `python server.py`.

### UI / Presentation Team

1. Fix any remaining weird encoded symbols in page text.
2. Make sure all pages look clean on laptop screen size.
3. Prepare a short demo script:
   - student login
   - wallet connect
   - scholarship apply
   - admin approval
   - student status update
4. Add screenshots to the project report if needed.

### Backend / Database Team

1. Keep current SQLite as basic demo persistence.
2. Optional future upgrade: convert JSON storage into proper tables:
   - `users`
   - `courses`
   - `events`
   - `scholarships`
   - `scholarship_applications`
   - `transactions`
   - `attendance_records`
3. Add a simple admin database viewer only if time permits.

### Blockchain Team

1. Install Rust, Solana CLI, and Anchor in WSL Ubuntu.
2. Run:
   ```bash
   anchor build
   ```
3. Start local Solana validator:
   ```bash
   solana-test-validator
   ```
4. Deploy to localnet:
   ```bash
   anchor deploy
   ```
5. Update the deployed Program ID in:
   - `chain_campus/programs/chain_campus/src/lib.rs`
   - `chain_campus/Anchor.toml`
   - `js/blockchain.js`
6. Import/configure the generated IDL from:
   ```text
   chain_campus/target/idl/
   ```
7. Configure real PDA accounts for frontend Anchor mode.

## Future Scope

- Deploy contracts to Solana devnet.
- Replace mock mode with real Anchor transactions.
- Add QR/NFC-based student ID verification.
- Normalize SQLite into proper relational tables.
- Add role-based backend authentication.
- Add document upload/verification for scholarship applications.
