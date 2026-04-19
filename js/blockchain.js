import {
  Connection,
  clusterApiUrl,
  SystemProgram,
  Transaction,
  PublicKey
} from "@solana/web3.js";

// 🔗 Devnet connection (safe for testing)
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

/* =========================
   WALLET CHECK
========================= */
function getProvider() {
  if ("solana" in window) {
    const provider = window.solana;

    if (provider.isPhantom) {
      return provider;
    }
  }

  window.open("https://phantom.app/", "_blank");
  throw new Error("Phantom wallet not found");
}

/* =========================
   CONNECT WALLET
========================= */
export async function connectWallet() {
  const provider = getProvider();
  const resp = await provider.connect();

  return {
    publicKey: resp.publicKey.toString()
  };
}

/* =========================
   BASE TRANSACTION SENDER
========================= */
async function sendTransaction(fromPubkey, toPubkey, label = "SOL Transfer") {
  const provider = getProvider();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: 1000 // small dummy value (0.000001 SOL)
    })
  );

  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const signed = await provider.signTransaction(transaction);
  const txId = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(txId);

  return {
    success: true,
    txId,
    label
  };
}

/* =========================
   REGISTER STUDENT (ON-CHAIN)
========================= */
export async function registerStudentOnChain() {
  const provider = getProvider();

  // Self-transfer as placeholder on-chain action
  return sendTransaction(
    provider.publicKey,
    provider.publicKey,
    "Student Registration"
  );
}

/* =========================
   EVENT REGISTRATION
========================= */
export async function registerForEventOnChain(event) {
  const provider = getProvider();

  return sendTransaction(
    provider.publicKey,
    provider.publicKey,
    `Event Registration: ${event.title}`
  );
}

/* =========================
   EVENT CREATION
========================= */
export async function createEventOnChain(event) {
  const provider = getProvider();

  return sendTransaction(
    provider.publicKey,
    provider.publicKey,
    `Create Event: ${event.title}`
  );
}