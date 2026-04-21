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
## 🚀 Project Roadmap

### 🔹 Blockchain & Smart Contract Layer (Anchor / Solana)

1. Finalize the Anchor program interface and IDL as the foundational contract layer.  
2. Define account structures for students, events, registrations, and attendance.  
3. Define a PDA for student identity records (one per wallet).  
4. Define a PDA for event records with deterministic addressing.  
5. Define a PDA for event registration to prevent duplicates.  
6. Define a PDA for attendance records for audit tracking.  
7. Implement on-chain validation to prevent duplicate student registrations.  
8. Implement on-chain validation to prevent duplicate event registrations.  
9. Enforce event capacity limits at the smart contract level.  
10. Add event start and end timestamps for time-based logic.  
11. Implement attendance window validation constraints.  
12. Add admin authority checks for event creation.  
13. Add admin authority checks for attendance verification.  
14. Define custom program error codes with readable messages.  
15. Emit Anchor events for registration, event creation, and attendance.  

---

### 🔹 Web3 Integration Layer

16. Replace mock transactions with actual Anchor instruction calls.  
17. Map each UI action to corresponding Anchor methods and accounts.  
18. Implement wallet connect, disconnect, and session persistence.  
19. Detect wallet account and network changes in real time.  
20. Add transaction confirmation tracking and status polling.  
21. Provide Solana Explorer links for transaction visibility.  
22. Support localnet and devnet clusters with easy switching.  
23. Implement a normalized error parser for Anchor and Solana errors.  
24. Add retry logic and timeouts for RPC reliability.  

---

### 🔹 Student Identity System

25. Add student fields: ID, department, semester, and university email.  
26. Implement profile image upload functionality.  
27. Add role-based fields (student, admin, faculty).  
28. Generate QR codes for student identity.  
29. Provide downloadable student ID card view.  
30. Add profile completion progress indicator.  

---

### 🔹 Event Management System

31. Enable event creation with core fields (title, description, venue, date, capacity).  
32. Add event categories (workshop, seminar, hackathon, sports, cultural).  
33. Implement event registration with deadline enforcement.  
34. Display real-time event capacity in the UI.  
35. Add admin controls for event edit and delete.  
36. Support event cancellation with audit preservation.  
37. Enable student registration withdrawal before event start.  

---

### 🔹 Attendance System

38. Implement attendance marking via QR code scanning.  
39. Add fallback attendance via one-time session code.  
40. Support attendance states: present, late, absent.  
41. Calculate attendance percentage per student.  
42. Provide attendance history with filters (event/date).  

---

### 🔹 Admin Panel

43. Build a dedicated admin dashboard separate from student UI.  
44. Add admin search for students, events, and attendance.  
45. Enable bulk attendance verification for admins.  
46. Provide attendance export functionality (CSV format).  

---

### 🔹 Dashboard & Analytics

47. Replace static dashboard data with live on-chain data.  
48. Add KPI cards (total students, events, attendance rate).  
49. Implement event filtering (date, category, registration status).  

---

### 🔹 UX & Frontend Improvements

50. Add in-app notifications for registration and attendance updates.  
51. Implement event reminder notifications.  
52. Add skeleton loaders for async data states.  
53. Provide inline form validation messages.  
54. Improve empty states with actionable guidance.  
55. Add success feedback after transaction completion.  
56. Enable copy-to-clipboard for wallet addresses and transaction IDs.  
57. Add confirmation dialogs for destructive admin actions.  

---

### 🔹 DevOps, Testing & Documentation

58. Create environment config for network switching.  
59. Add integration tests for core flows (registration, events, attendance).  
60. Include sample IDL and contributor setup in README.  ## 13. Summary
This project is a frontend-first student platform with a clean path to Solana integration. The UI already makes blockchain-triggered actions obvious, and the architecture is intentionally prepared for smart contract adoption.

For future Web3 development, start in `js/blockchain.js`. That file is the single integration boundary for all smart contract work.
