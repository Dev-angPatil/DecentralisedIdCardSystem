const SOLANA_WEB3_IMPORT_URL = "https://esm.sh/@solana/web3.js@1.98.4";
const ANCHOR_IMPORT_URL = "https://esm.sh/@coral-xyz/anchor@0.30.1";

const DEFAULT_CONFIG = {
  mode: "anchor",
  network: "localhost",
  rpcEndpoint: "http://127.0.0.1:8899",
  commitment: "confirmed",
  programId: "Fg6Pa4H2X4CWdU3EajNf8C8ViPyMskGuFA6shVe6icMd", // ChainCampus Program ID
  idl: null,
  actions: {}
};

const DEFAULT_ACTION_METHODS = {
  registerStudentOnChain: "registerStudent",
  registerForEventOnChain: "registerForEvent",
  markAttendanceOnChain: "markAttendance",
  createEventOnChain: "createEvent",
  enrollCourseOnChain: "enrollCourse"
};

let blockchainConfig = {
  ...DEFAULT_CONFIG,
  ...(window.CHAIN_CAMPUS_SOLANA_CONFIG || {})
};

let libraryPromise;

function createMockTxId() {
  return "tx_" + Math.random().toString(36).slice(2, 11);
}

function resolveConfig() {
  const runtimeConfig = window.CHAIN_CAMPUS_SOLANA_CONFIG || {};
  return {
    ...DEFAULT_CONFIG,
    ...blockchainConfig,
    ...runtimeConfig,
    actions: {
      ...(DEFAULT_CONFIG.actions || {}),
      ...(blockchainConfig.actions || {}),
      ...(runtimeConfig.actions || {})
    }
  };
}

function simulateTransaction(action, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        action,
        txId: createMockTxId(),
        payload,
        network: "mock",
        source: "mock"
      });
    }, 1500);
  });
}

function getWallet() {
  const wallet = window.solana;
  if (!wallet || !wallet.isPhantom) {
    throw new Error("Phantom wallet not found. Install Phantom to continue.");
  }
  return wallet;
}

async function connectWallet() {
  const wallet = getWallet();
  if (!wallet.isConnected) {
    await wallet.connect();
  }
  return wallet;
}

async function loadSolanaLibraries() {
  if (!libraryPromise) {
    libraryPromise = Promise.all([
      import(SOLANA_WEB3_IMPORT_URL),
      import(ANCHOR_IMPORT_URL)
    ]).then(([web3, anchor]) => ({ web3, anchor }));
  }

  return libraryPromise;
}

function isActionConfigured(actionName, config) {
  const actionConfig = config.actions?.[actionName];
  return Boolean(
    config.programId &&
      config.idl &&
      actionConfig &&
      (actionConfig.method || DEFAULT_ACTION_METHODS[actionName])
  );
}

function shouldUseMock(actionName, config) {
  if (config.mode === "mock") {
    return true;
  }

  if (config.mode === "anchor") {
    return false;
  }

  return !isActionConfigured(actionName, config);
}

function getActionConfig(actionName, config) {
  return config.actions?.[actionName] || {};
}

function resolveArgs(actionName, payload, actionConfig, context) {
  if (typeof actionConfig.getArgs === "function") {
    return actionConfig.getArgs(payload, context) || [];
  }

  if (Array.isArray(actionConfig.args)) {
    return actionConfig.args;
  }

  switch (actionName) {
    case "registerStudentOnChain":
      return [
        payload.studentId || "",
        payload.name || ""
      ];
    case "registerForEventOnChain":
      return [payload.id || payload.eventId || "", payload.title || ""];
    case "markAttendanceOnChain":
      return [payload.mode || "student"];
    case "createEventOnChain":
      return [payload.title || "", payload.date || "", payload.venue || ""];
    case "enrollCourseOnChain":
      return [payload.courseId || ""];
    default:
      return [];
  }
}

function resolveAccounts(actionConfig, payload, context) {
  if (typeof actionConfig.getAccounts === "function") {
    return actionConfig.getAccounts(payload, context) || {};
  }

  return actionConfig.accounts || {};
}

function getProgramMethod(program, methodName, args) {
  const methods = program?.methods;
  const method = methods?.[methodName];

  if (typeof method !== "function") {
    throw new Error(
      `Anchor method "${methodName}" was not found in the loaded IDL.`
    );
  }

  return method(...args);
}

function createAnchorProgram(anchor, idl, programId, provider) {
  if (typeof anchor.setProvider === "function") {
    anchor.setProvider(provider);
  }

  const idlWithAddress =
    idl && !idl.address
      ? { ...idl, address: programId.toBase58() }
      : idl;

  const constructorAttempts = [
    () => new anchor.Program(idlWithAddress, provider),
    () => new anchor.Program(idlWithAddress, programId, provider),
    () => new anchor.Program(idlWithAddress, { connection: provider.connection })
  ];

  let lastError;
  for (const buildProgram of constructorAttempts) {
    try {
      return buildProgram();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function submitAnchorTransaction(actionName, payload) {
  const config = resolveConfig();
  const actionConfig = getActionConfig(actionName, config);
  const { web3, anchor } = await loadSolanaLibraries();
  const wallet = await connectWallet();
  const connection = new web3.Connection(
    config.rpcEndpoint,
    config.commitment
  );
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: config.commitment
  });
  const programId = new web3.PublicKey(config.programId);
  const program = createAnchorProgram(anchor, config.idl, programId, provider);

  const context = {
    actionName,
    config,
    wallet,
    provider,
    program,
    connection,
    web3,
    anchor
  };

  const methodName =
    actionConfig.method || DEFAULT_ACTION_METHODS[actionName];
  const args = resolveArgs(actionName, payload, actionConfig, context);
  const accounts = resolveAccounts(actionConfig, payload, context);

  let requestBuilder = getProgramMethod(program, methodName, args);
  if (Object.keys(accounts).length > 0) {
    requestBuilder = requestBuilder.accounts(accounts);
  }

  const signature = await requestBuilder.rpc();

  return {
    success: true,
    action: actionName,
    txId: signature,
    payload,
    network: config.network,
    source: "anchor"
  };
}

async function runChainAction(actionName, payload) {
  const config = resolveConfig();

  if (shouldUseMock(actionName, config)) {
    return simulateTransaction(actionName, payload);
  }

  try {
    return await submitAnchorTransaction(actionName, payload);
  } catch (error) {
    if (config.mode === "auto") {
      console.warn(
        `[blockchain.js] ${actionName} fell back to mock mode:`,
        error
      );
      return simulateTransaction(actionName, payload);
    }

    throw error;
  }
}

export function setBlockchainConfig(nextConfig = {}) {
  blockchainConfig = {
    ...resolveConfig(),
    ...nextConfig,
    actions: {
      ...(resolveConfig().actions || {}),
      ...(nextConfig.actions || {})
    }
  };
}

export function getBlockchainConfig() {
  return resolveConfig();
}

export async function registerStudentOnChain(data) {
  return runChainAction("registerStudentOnChain", data);
}

export async function registerForEventOnChain(data) {
  return runChainAction("registerForEventOnChain", data);
}

export async function markAttendanceOnChain(data) {
  return runChainAction("markAttendanceOnChain", data);
}

export async function createEventOnChain(data) {
  return runChainAction("createEventOnChain", data);
}

export async function enrollCourseOnChain(data) {
  return runChainAction("enrollCourseOnChain", data);
}
