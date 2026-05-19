const API_ROOT = "";

async function postJson(path, payload) {
  try {
    await fetch(`${API_ROOT}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn(`[db] SQLite sync skipped for ${path}:`, error);
  }
}

export async function loadDatabaseSnapshot() {
  try {
    const response = await fetch(`${API_ROOT}/api/bootstrap`, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("[db] Running without SQLite backend:", error);
    return null;
  }
}

export function persistState(state) {
  postJson("/api/state", state);
}

export function persistUsers(users) {
  postJson("/api/users", users);
}

export function persistSession(session) {
  postJson("/api/session", session);
}
