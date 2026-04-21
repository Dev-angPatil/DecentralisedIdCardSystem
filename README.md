# ChainCampus Student Platform

## 1. Project Overview
ChainCampus is a modular student platform built with HTML, CSS, and Vanilla JavaScript. It provides a clean multi-page experience for student login, registration, dashboard tracking, event participation, attendance management, and profile viewing.

The project is intentionally designed for future blockchain integration. Core student actions such as registration, event registration, attendance marking, and admin event creation already follow an on-chain-ready flow, so real Solana smart contract calls can be added later with minimal UI changes.

## 2. Features
- Student registration with an on-chain-ready submission flow
- Event registration with blockchain-ready verified states
- Attendance system with student and admin blockchain-ready actions
- Real Phantom wallet connection support through the browser extension
- Dashboard with attendance, event count, wallet status, and last transaction state
- Profile page with mock on-chain data visibility

## 3. Tech Stack
- HTML
- CSS
- Vanilla JavaScript
- Solana (planned integration)
- Anchor (planned integration)

## 4. Project Structure
```text
/
  index.html
  login.html
  register.html
  dashboard.html
  events.html
  attendance.html
  profile.html

  /css/
    styles.css

  /js/
    main.js
    auth.js
    events.js
    attendance.js
    blockchain.js   <-- MAIN SMART CONTRACT INTEGRATION FILE
```

### File Responsibilities
- `index.html`: Landing page and platform overview
- `login.html`: Login UI, Google login placeholder, and Phantom wallet connect flow
- `register.html`: Student registration form that triggers `registerStudentOnChain()`
- `dashboard.html`: Overview of attendance, enrolled events, wallet status, and transaction state
- `events.html`: Event listing, blockchain-ready event registration, and admin event creation
- `attendance.html`: Attendance history plus student/admin blockchain-ready actions
- `profile.html`: Student profile and mock on-chain data display
- `css/styles.css`: Shared glassmorphism UI and responsive layout styles
- `js/main.js`: Shared state, navigation, Phantom wallet connection, notifications, and UI helpers
- `js/auth.js`: Login and registration page logic
- `js/events.js`: Event registration and admin event creation logic
- `js/attendance.js`: Attendance marking and verification logic
- `js/blockchain.js`: The only file where smart contract integration must be implemented

## 5. Smart Contract Integration
This is the most important architectural rule in the project:

- All blockchain logic must be added only in `js/blockchain.js`
- UI files must never directly call Solana programs, wallet adapters, or Anchor clients
- Page scripts such as `auth.js`, `events.js`, and `attendance.js` should only call the exported helper functions from `blockchain.js`
- This keeps the UI layer clean, modular, and easy to maintain
- Replacing mock blockchain behavior with real Solana contract calls should not require rewriting page-level UI logic

### Why this matters
This separation of concerns makes the system easier to scale and safer to maintain:

- UI code handles forms, buttons, loading states, and rendering
- `blockchain.js` handles all future Web3 behavior
- If contract APIs change later, only one file needs to be updated

## 6. Available Blockchain Functions
The following placeholder functions already exist in `js/blockchain.js`:

- `registerStudentOnChain()`
- `registerForEventOnChain()`
- `markAttendanceOnChain()`
- `createEventOnChain()`

These functions currently:

- Simulate async transaction behavior using `setTimeout`
- Return mock success responses
- Generate fake transaction IDs
- Allow the UI to display pending, success, and verified states

These functions must later be replaced with real Solana smart contract calls.

## 7. Integration Steps
To connect this project to Solana smart contracts, follow this flow:

1. Set up a Solana + Anchor development environment.
2. Build and deploy the smart contract that handles student registration, event registration, attendance, and event creation.
3. Open `js/blockchain.js`.
4. Replace the mock placeholder functions with real contract interaction logic.
5. Add real wallet connection support, such as Phantom.
6. Return real transaction results back to the UI in the same response shape used today.
7. Keep all HTML and page-level JavaScript files calling only the exported functions from `blockchain.js`.

### Current integration mode
`js/blockchain.js` now supports both:

- `mock` mode for the existing demo flow
- real Anchor-powered Solana calls when runtime config is provided

By default it runs in `auto` mode:

- if a valid Solana/Anchor config is present, it sends a real transaction
- if config is missing or incomplete, it falls back to the existing mock transaction flow

## 8. Runtime Solana Configuration
Before the page modules load, you can provide your deployed program details on `window.CHAIN_CAMPUS_SOLANA_CONFIG`.

Example:

```html
<script>
  window.CHAIN_CAMPUS_SOLANA_CONFIG = {
    mode: "anchor",
    network: "devnet",
    rpcEndpoint: "https://api.devnet.solana.com",
    programId: "YOUR_PROGRAM_ID",
    idl: YOUR_ANCHOR_IDL_OBJECT,
    actions: {
      registerStudentOnChain: {
        method: "registerStudent",
        getArgs(payload) {
          return [
            payload.name,
            payload.college,
            payload.program,
            payload.year,
            payload.studentId
          ];
        },
        getAccounts(payload, { wallet, web3 }) {
          return {
            authority: wallet.publicKey,
            systemProgram: web3.SystemProgram.programId
          };
        }
      }
    }
  };
</script>
```

Each action in `actions` may define:

- `method`: Anchor method name from your IDL
- `getArgs(payload, context)`: maps current UI payloads into contract arguments
- `getAccounts(payload, context)`: returns the accounts object for `.accounts(...)`

This keeps the UI response shape stable while letting the Solana program evolve behind the adapter.

## 9. Example Replacement
### Before: Mock placeholder
```js
export async function registerStudentOnChain(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, txId: "mock_tx_123" });
    }, 1000);
  });
}
```

### After: Real Solana contract call pattern
```js
export async function registerStudentOnChain(data) {
  const wallet = window.solana;
  if (!wallet || !wallet.isPhantom) {
    throw new Error("Phantom wallet not found");
  }

  await wallet.connect();

  // Initialize Anchor provider and program here
  // Build and send the transaction here
  // Example only: replace with actual program call
  const signature = "real_solana_tx_signature";

  return {
    success: true,
    txId: signature
  };
}
```

## 10. How to Run the Project
Because this is a static frontend built with HTML, CSS, and Vanilla JavaScript, you can run it locally in a few simple ways:

1. Clone or download the project.
2. Open the project folder.
3. Start a local static server.

Examples:

```bash
python -m http.server 8000
```

Or:

```bash
npx serve .
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, but using a local server is recommended for a smoother development setup.

## 11. Development Notes
- Phantom wallet connection now uses the injected browser provider
- Transaction results are mocked for demonstration
- The dashboard reads shared state from local storage
- Event verification and attendance verification are simulated
- Real blockchain integration should preserve the existing UI response structure where possible

## 12. Massive Implementation To-Do List
1.
Finalize the Anchor program interface and IDL
Everything depends on this being stable first.
2.
Define account structure for students, events, registrations, and attendance
Stable accounts make every feature easier to build.
3.
Define PDA for student identity records
Deterministic on-chain address per student wallet.
4.
Define PDA for event records
Predictable address for each event.
5.
Define PDA for event registration records
Prevents duplicate registrations at the contract level.
6.
Define PDA for attendance records
Enables per-student, per-event audit trail.
7.
Add on-chain validation for duplicate student registration
Program rejects registering the same student twice.
8.
Add on-chain validation for duplicate event registration
Students cannot register for the same event more than once.
9.
Add event capacity limits on-chain
Seat limits enforced by the contract, not just the UI.
10.
Add event start and end timestamps
Enables time-based validation for registration and attendance.
11.
Add attendance-window validation
Attendance can only be marked during a valid period.
12.
Add admin authority checks for event creation
Only authorised wallets can create official events.
13.
Add admin authority checks for attendance verification
Verification restricted to admin or faculty accounts.
14.
Add custom program error codes and human-readable messages
Makes debugging and frontend error display much cleaner.
15.
Replace mock transactions with real Anchor instruction calls
Converts the app from a demo into a working Web3 project.
16.
Map each UI action to exact Anchor method arguments and account objects
Adapter layer formally translates form inputs to contract calls.
17.
Add wallet connect, disconnect, and reconnect on page refresh
Core wallet session management every user will hit.
18.
Add wallet account and network change detection
UI updates immediately if the user switches accounts or networks.
19.
Add transaction confirmation polling
Users see whether a transaction is pending, confirmed, or failed.
20.
Add Solana Explorer links for every successful transaction
Makes on-chain activity visible and auditable.
21.
Add support for localnet and devnet clusters with easy switching
Needed for development and demonstration on different networks.
22.
Add a normalised error parser for Solana and Anchor errors
Shows readable messages instead of raw exceptions.
23.
Add retry logic for temporary RPC failures and per-action timeouts
Prevents the UI from hanging on common network hiccups.
24.
Emit Anchor events for student registration, event creation, and attendance
Useful for debugging and future indexing.
25.
Add student ID, department, semester, and university email fields
Core identity fields needed for a student platform.
26.
Add profile image upload
Makes the identity page look complete and presentable.
27.
Add role field (student, admin, faculty)
Required for permission-aware flows in later phases.
28.
Add QR code generation for student identity
QR scanning can power attendance and event check-in.
29.
Add downloadable student identity card view
A natural and impressive feature for a digital ID project.
30.
Add profile completion indicator
Nudges users to fill out all required fields.
31.
Add event creation with title, description, venue, date, and capacity
Core event data that every other feature depends on.
32.
Add event categories (workshop, seminar, hackathon, sports, cultural)
Makes browsing and filtering events practical.
33.
Add event registration and registration deadline support
Students can register and the form closes automatically on time.
34.
Add event capacity display in the UI
Students see available seats before registering.
35.
Add event edit and delete for admins
Admins need basic event management tools.
36.
Add event cancellation support
Clean cancellation preserving the audit trail.
37.
Add registration withdrawal (student unregister)
Students may need to cancel before an event starts.
38.
Add attendance marking via QR code scan
The most practical and impressive attendance flow for a campus demo.
39.
Add attendance marking via one-time session code
A simple fallback alternative to QR scanning.
40.
Add present, late, and absent attendance statuses
More realistic than a simple present/not-present flag.
41.
Add attendance percentage calculation per student
Useful and visible metric for dashboards.
42.
Add attendance history view with filters by event and date
Students and admins both need to browse records easily.
43.
Create a dedicated admin page separate from the student view
A clean separation makes the project far more professional.
44.
Add admin search for students, events, and attendance records
Basic lookup tools are essential for any admin panel.
45.
Add bulk attendance verification for admins
Admins should not have to verify records one by one.
46.
Add attendance export as CSV
Simple download for reports and presentations.
47.
Replace static dashboard values with live on-chain data
Dashboard should reflect real state, not placeholder numbers.
48.
Add KPI cards (total students, total events, attendance rate)
Clean summary metrics make the dashboard look polished.
49.
Add event filters by date, category, and registration status
Makes navigating a growing list of events faster.
50.
Add in-app notifications for registration and attendance confirmation
Users need feedback when key actions complete.
51.
Add event reminder notifications
Timely reminders improve demo engagement.
52.
Add skeleton loading states on all data-fetching views
Makes async waits feel smooth rather than broken.
53.
Add inline form validation messages
Users should know what to fix before submitting.
54.
Improve empty states with helpful guidance text
Empty pages should point the user toward their next action.
55.
Add success feedback after transactions complete
Small confirmation moments reduce uncertainty during blockchain waits.
56.
Add copy-to-clipboard for wallet addresses and transaction IDs
Small but high-value usability detail.
57.
Add confirmation dialogs for admin delete and verify actions
Irreversible actions should require a deliberate second step.
58.
Add environment config file for localnet/devnet switching
Makes running and demonstrating the project much easier.
59.
Add integration tests for registration, event, and attendance flows
Enough coverage to catch regressions in the three main journeys.
60.
Add a sample IDL and contributor setup notes in the README
Makes the project easy to run and review during evaluation.
## 13. Summary
This project is a frontend-first student platform with a clean path to Solana integration. The UI already makes blockchain-triggered actions obvious, and the architecture is intentionally prepared for smart contract adoption.

For future Web3 development, start in `js/blockchain.js`. That file is the single integration boundary for all smart contract work.
