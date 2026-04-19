# ChainCampus Student Platform

## 1. Project Overview
ChainCampus is a modular student platform built with HTML, CSS, and Vanilla JavaScript. It provides a clean multi-page experience for student login, registration, dashboard tracking, event participation, attendance management, and profile viewing.

The project is intentionally designed for future blockchain integration. Core student actions such as registration, event registration, attendance marking, and admin event creation already follow an on-chain-ready flow, so real Solana smart contract calls can be added later with minimal UI changes.

## 2. Features
- Student registration with an on-chain-ready submission flow
- Event registration with blockchain-ready verified states
- Attendance system with student and admin blockchain-ready actions
- Wallet connection UI placeholder for future Phantom integration
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
- `login.html`: Login UI, Google login placeholder, and wallet connect placeholder
- `register.html`: Student registration form that triggers `registerStudentOnChain()`
- `dashboard.html`: Overview of attendance, enrolled events, wallet status, and transaction state
- `events.html`: Event listing, blockchain-ready event registration, and admin event creation
- `attendance.html`: Attendance history plus student/admin blockchain-ready actions
- `profile.html`: Student profile and mock on-chain data display
- `css/styles.css`: Shared glassmorphism UI and responsive layout styles
- `js/main.js`: Shared state, navigation, wallet placeholder, notifications, and UI helpers
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

## 8. Example Replacement
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

## 9. How to Run the Project
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

## 10. Development Notes
- The current wallet connection is a UI placeholder only
- Transaction results are mocked for demonstration
- The dashboard reads shared state from local storage
- Event verification and attendance verification are simulated
- Real blockchain integration should preserve the existing UI response structure where possible

## 11. Summary
This project is a frontend-first student platform with a clean path to Solana integration. The UI already makes blockchain-triggered actions obvious, and the architecture is intentionally prepared for smart contract adoption.

For future Web3 development, start in `js/blockchain.js`. That file is the single integration boundary for all smart contract work.
