function createMockTxId() {
  return "tx_" + Math.random().toString(36).slice(2, 11);
}

function simulateTransaction(action, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        action,
        txId: createMockTxId(),
        payload
      });
    }, 1500);
  });
}

export async function registerStudentOnChain(data) {
  return simulateTransaction("registerStudentOnChain", data);
}

export async function registerForEventOnChain(data) {
  return simulateTransaction("registerForEventOnChain", data);
}

export async function markAttendanceOnChain(data) {
  return simulateTransaction("markAttendanceOnChain", data);
}

export async function createEventOnChain(data) {
  return simulateTransaction("createEventOnChain", data);
}
