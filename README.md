# ChainCampus (Decentralised ID Card System)

ChainCampus is a minimalist, Web3-ready student platform built for our college MVP presentation. It features a modern user interface geared towards student identity, event registration, and scholarship applications integrated tightly with Solana blockchain abstractions.

## 🚀 MVP Status: What's Currently Working?

We have established a robust Minimum Viable Product (MVP) aimed at demonstrating the flow and user experience without needing active smart contracts deployed or transaction fees.

### 1. Functional User Interfaces
- **Student Dashboard (`dashboard.html`)**: Real-time mock data aggregations showing active Web3 status, total registered events, and attendance.
- **Identity Registration (`register.html`)**: Forms capture core student fields: Name, College, Program, Year, Semester, Department, and Email.
- **Event Admin (`events.html`)**: Event creation with specific details like capacity, descriptions, venue, and date.
- **Scholarships Portal (`schol.html`)**: A beautiful, dynamic UI prototype listing various scholarships with details and eligibility. (Note: This is currently UI-only and represents future implementation scope).
- **UI Architecture**: Fully responsive, glassmorphism design utilizing `css/styles.css`.

### 2. Web3 "Mock Mode" & Phantom Integration
- **Persistent Wallet Sessions**: The frontend successfully connects to the Phantom wallet browser extension via `js/main.js`. Even upon refreshing the page, session persistence maintains the login state smoothly.
- **Mock Transactions**: To facilitate easy demonstrations and testing by professors or non-crypto native users, the UI currently operates under a "Mock State". This means pressing "Register (On-Chain)" simulates a Solana transaction layer perfectly across `js/blockchain.js`, presenting a UI loader, and generating a mock transaction signature.

### 3. Smart Contract Blueprints (Anchor / Solana)
The mathematical foundations of our Solana smart contract have been written in Rust but are not yet compiled or deployed to localnet/devnet.
- **Schema Mapping**: The `Student` struct and `Event` struct in `chain_campus/programs/chain_campus/src/state` have been expanded and mapped exactly to match the current HTML forms.

---

## 🛠️ How To Run and Test The MVP

This frontend is lightweight. There's no need to install Node, run Docker, or deploy Solana programs for a simple visual demonstration.

1. Clone the repository and navigate into the folder.
2. Spin up a basic local static server. If you have Python installed, run this in your terminal:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.
4. Once loaded, click **Connect Wallet** using the Phantom Extension.
5. You can now explore the dashboard, "Register" a fake student, or "Create" an event to witness how the app mimics blockchain boundaries flawlessly.

---

## 📝 Teammates To-Do List & Next Steps

If you are picking up this project, your goal is to transition the frontend away from "Mock Mode" into a compiled, deployment-ready Solana project.

### Phase 1: Smart Contract Compilation (Rust/Solana Devs)
The underlying Solana smart contracts reside within the `chain_campus/` directory.

1. **Setup Your Environment**: Install [Rust](https://rustup.rs/) and the [Solana CLI tools](https://docs.solana.com/cli/install-solana-cli-tools). **Important Tip:** If you are on Windows, you should strictly use WSL (Ubuntu Terminal) to develop Anchor scripts, as natively installing Anchor on Windows is highly unstable and unsupported.
2. **Build the Contract**: Open your terminal in the `chain_campus` directory and compile the rust code into a deployed binary schema by running:
   ```bash
   anchor build
   ```
3. **Deploy to Devnet**: Ensure you have funded your local Solana configuration with SOL and deploy the resulting programs to Solana's `devnet`. 
   > **Critical Step**: You must grab the `Target Program ID` generated after your first deployment and insert it into the `declare_id!(...)` string block in `chain_campus/src/lib.rs`. Then build it one last time!

### Phase 2: Frontend Abstraction Integration (JS Devs)
Once the Smart Contract is built, `anchor build` will spit out an `IDL (Interface Description Language)` JSON file containing your contract's ABI. 

1. **Swap to Anchor Mode**: Open `js/blockchain.js`. Find or configure `window.CHAIN_CAMPUS_SOLANA_CONFIG` so `mode:` becomes `"anchor"`.
2. **Import the IDL**: Import the `.json` IDL file exported from step 1 into the `js/blockchain.js` configuration object. This forces the UI HTML elements to format their arguments exactly how the smart contract expects them over the RPC.
3. **Finish the Scholarships Prototype**: `schol.html` operates robustly, but it needs an anchor foundation. You need to write a new `scholarship.rs` state struct inside the `chain_campus/programs/chain_campus/src/state/` folder and hook it into `js/blockchain.js`'s methods.
