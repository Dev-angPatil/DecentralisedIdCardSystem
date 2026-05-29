const SOLANA_WEB3_IMPORT_URL = "https://esm.sh/@solana/web3.js@1.98.4";
const ANCHOR_IMPORT_URL = "https://esm.sh/@coral-xyz/anchor@0.30.1";

import { deductGasOnServer } from "./db.js";

export function getOrCreateVirtualWallet() {
  let address = localStorage.getItem("chainCampusVirtualAddress");
  if (!address) {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let randomPart = "";
    for (let i = 0; i < 36; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    address = "CCvW" + randomPart;
    localStorage.setItem("chainCampusVirtualAddress", address);
    localStorage.setItem("chainCampusWalletType", "virtual");
  }
  return address;
}

export function getActiveWalletAddress() {
  const type = localStorage.getItem("chainCampusWalletType") || "virtual";
  if (type === "phantom" && window.solana && window.solana.isPhantom) {
    return window.solana.publicKey?.toBase58() || "";
  }
  return getOrCreateVirtualWallet();
}

const DEFAULT_CONFIG = {
  mode: "auto",
  network: "devnet",
  rpcEndpoint: "https://api.devnet.solana.com",
  commitment: "confirmed",
  programId: "BS8XqoJPFs6ifw1LGUwUVZX2BdfYr1b5RzrooNDPwUGK", // ChainCampus Program ID
  idl: {
    "version": "0.1.0",
    "name": "chain_campus",
    "constants": [
      {"name": "STUDENT_SEED", "type": "bytes", "value": "[115, 116, 117, 100, 101, 110, 116]"},
      {"name": "EVENT_SEED", "type": "bytes", "value": "[101, 118, 101, 110, 116]"},
      {"name": "REGISTRATION_SEED", "type": "bytes", "value": "[114, 101, 103, 105, 115, 116, 114, 97, 116, 105, 111, 110]"},
      {"name": "ATTENDANCE_SEED", "type": "bytes", "value": "[97, 116, 116, 101, 110, 100, 97, 110, 99, 101]"},
      {"name": "COURSE_ENROLLMENT_SEED", "type": "bytes", "value": "[99, 111, 117, 114, 115, 101, 95, 101, 110, 114, 111, 108, 108, 109, 101, 110, 116]"},
      {"name": "COURSE_SEED", "type": "bytes", "value": "[99, 111, 117, 114, 115, 101]"},
      {"name": "SCHOLARSHIP_SEED", "type": "bytes", "value": "[115, 99, 104, 111, 108, 97, 114, 115, 104, 105, 112]"},
      {"name": "SCHOLARSHIP_APPLICATION_SEED", "type": "bytes", "value": "[115, 99, 104, 111, 108, 97, 114, 115, 104, 105, 112, 95, 97, 112, 112, 108, 105, 99, 97, 116, 105, 111, 110]"}
    ],
    "instructions": [
      {
        "name": "registerStudent",
        "accounts": [
          {"name": "student", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "studentId", "type": "string"},
          {"name": "name", "type": "string"},
          {"name": "department", "type": "string"},
          {"name": "semester", "type": "string"},
          {"name": "email", "type": "string"}
        ]
      },
      {
        "name": "createEvent",
        "accounts": [
          {"name": "event", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "eventId", "type": "string"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "venue", "type": "string"},
          {"name": "capacity", "type": "u32"},
          {"name": "startTime", "type": "i64"},
          {"name": "endTime", "type": "i64"}
        ]
      },
      {
        "name": "registerForEvent",
        "accounts": [
          {"name": "registration", "isMut": true, "isSigner": false},
          {"name": "student", "isMut": false, "isSigner": false},
          {"name": "event", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": []
      },
      {
        "name": "markAttendance",
        "accounts": [
          {"name": "attendance", "isMut": true, "isSigner": false},
          {"name": "student", "isMut": false, "isSigner": false},
          {"name": "event", "isMut": false, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": []
      },
      {
        "name": "verifyAttendance",
        "accounts": [
          {"name": "attendance", "isMut": true, "isSigner": false},
          {"name": "event", "isMut": false, "isSigner": false},
          {"name": "authority", "isMut": false, "isSigner": true}
        ],
        "args": []
      },
      {
        "name": "enrollCourse",
        "accounts": [
          {"name": "enrollment", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "courseId", "type": "string"}
        ]
      },
      {
        "name": "createCourse",
        "accounts": [
          {"name": "course", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "courseId", "type": "string"},
          {"name": "name", "type": "string"},
          {"name": "credits", "type": "u8"},
          {"name": "instructor", "type": "string"}
        ]
      },
      {
        "name": "createScholarship",
        "accounts": [
          {"name": "scholarship", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "scholarshipId", "type": "string"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "eligibility", "type": "string"},
          {"name": "amount", "type": "u64"},
          {"name": "deadline", "type": "i64"}
        ]
      },
      {
        "name": "applyScholarship",
        "accounts": [
          {"name": "application", "isMut": true, "isSigner": false},
          {"name": "student", "isMut": false, "isSigner": false},
          {"name": "scholarship", "isMut": true, "isSigner": false},
          {"name": "authority", "isMut": true, "isSigner": true},
          {"name": "systemProgram", "isMut": false, "isSigner": false}
        ],
        "args": [
          {"name": "statement", "type": "string"}
        ]
      },
      {
        "name": "reviewScholarshipApplication",
        "accounts": [
          {"name": "application", "isMut": true, "isSigner": false},
          {"name": "scholarship", "isMut": false, "isSigner": false},
          {"name": "authority", "isMut": false, "isSigner": true}
        ],
        "args": [
          {"name": "approved", "type": "bool"}
        ]
      }
    ],
    "accounts": [
      {
        "name": "EventRegistration",
        "type": {"kind": "struct", "fields": [
          {"name": "student", "type": "publicKey"},
          {"name": "event", "type": "publicKey"},
          {"name": "timestamp", "type": "i64"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "AttendanceRecord",
        "type": {"kind": "struct", "fields": [
          {"name": "student", "type": "publicKey"},
          {"name": "event", "type": "publicKey"},
          {"name": "verified", "type": "bool"},
          {"name": "timestamp", "type": "i64"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "CourseEnrollment",
        "type": {"kind": "struct", "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "courseId", "type": "string"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "Course",
        "type": {"kind": "struct", "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "courseId", "type": "string"},
          {"name": "name", "type": "string"},
          {"name": "credits", "type": "u8"},
          {"name": "instructor", "type": "string"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "Event",
        "type": {"kind": "struct", "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "eventId", "type": "string"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "venue", "type": "string"},
          {"name": "capacity", "type": "u32"},
          {"name": "registrations", "type": "u32"},
          {"name": "startTime", "type": "i64"},
          {"name": "endTime", "type": "i64"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "Scholarship",
        "type": {"kind": "struct", "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "scholarshipId", "type": "string"},
          {"name": "title", "type": "string"},
          {"name": "description", "type": "string"},
          {"name": "eligibility", "type": "string"},
          {"name": "amount", "type": "u64"},
          {"name": "deadline", "type": "i64"},
          {"name": "applications", "type": "u32"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "ScholarshipApplication",
        "type": {"kind": "struct", "fields": [
          {"name": "scholarship", "type": "publicKey"},
          {"name": "student", "type": "publicKey"},
          {"name": "applicant", "type": "publicKey"},
          {"name": "statement", "type": "string"},
          {"name": "status", "type": "u8"},
          {"name": "appliedAt", "type": "i64"},
          {"name": "reviewedAt", "type": "i64"},
          {"name": "bump", "type": "u8"}
        ]}
      },
      {
        "name": "Student",
        "type": {"kind": "struct", "fields": [
          {"name": "authority", "type": "publicKey"},
          {"name": "studentId", "type": "string"},
          {"name": "name", "type": "string"},
          {"name": "department", "type": "string"},
          {"name": "semester", "type": "string"},
          {"name": "email", "type": "string"},
          {"name": "bump", "type": "u8"}
        ]}
      }
    ],
    "errors": [
      {"code": 6000, "name": "StudentAlreadyRegistered", "msg": "Student is already registered."},
      {"code": 6001, "name": "EventAlreadyRegistered", "msg": "Event is already registered."},
      {"code": 6002, "name": "EventFull", "msg": "This event is full."},
      {"code": 6003, "name": "AttendanceWindowClosed", "msg": "Attendance marking window is closed."},
      {"code": 6004, "name": "Unauthorised", "msg": "You are not authorized to perform this action."},
      {"code": 6005, "name": "StudentIdTooLong", "msg": "The provided student ID is too long."},
      {"code": 6006, "name": "EventIdTooLong", "msg": "The provided event ID is too long."}
    ]
  },
  actions: {}
};

const DEFAULT_ACTION_METHODS = {
  registerStudentOnChain: "registerStudent",
  registerForEventOnChain: "registerForEvent",
  markAttendanceOnChain: "markAttendance",
  createEventOnChain: "createEvent",
  enrollCourseOnChain: "enrollCourse",
  createCourseOnChain: "createCourse",
  createScholarshipOnChain: "createScholarship",
  applyScholarshipOnChain: "applyScholarship",
  reviewScholarshipApplicationOnChain: "reviewScholarshipApplication"
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

async function simulateTransaction(action, payload) {
  try {
    const isVirtual = localStorage.getItem("chainCampusWalletType") !== "phantom";
    if (isVirtual) {
      await deductGasOnServer(0.005, `Gas fee for ${action}`);
    }
  } catch (error) {
    console.warn("[blockchain] Failed to deduct gas fee on server:", error);
  }
  
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
    }, 1000);
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
      return [
        payload.eventId || "", 
        payload.title || "",
        payload.venue || "",
        payload.capacity || 0, 
        payload.start_time || 0, 
        payload.end_time || 0
      ];
    case "enrollCourseOnChain":
      return [payload.courseId || ""];
    case "createCourseOnChain":
      return [
        payload.courseId || "", 
        payload.name || "", 
        payload.credits || 0, 
        payload.instructor || ""
      ];
    case "createScholarshipOnChain":
      return [
        payload.scholarshipId || payload.id || "",
        payload.title || "",
        payload.description || "",
        payload.eligibility || "",
        payload.amountLamports || payload.amount || 0,
        payload.deadlineTimestamp || payload.deadline || 0
      ];
    case "applyScholarshipOnChain":
      return [payload.statement || ""];
    case "reviewScholarshipApplicationOnChain":
      return [Boolean(payload.approved)];
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
    console.error(`[blockchain.js] Error in ${actionName}:`, error);
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

export async function createCourseOnChain(data) {
  return runChainAction("createCourseOnChain", data);
}

export async function createScholarshipOnChain(data) {
  return runChainAction("createScholarshipOnChain", data);
}

export async function applyScholarshipOnChain(data) {
  return runChainAction("applyScholarshipOnChain", data);
}

export async function reviewScholarshipApplicationOnChain(data) {
  return runChainAction("reviewScholarshipApplicationOnChain", data);
}
