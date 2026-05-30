import { showToast } from "./main.js";

class NfcService {
  constructor() {
    this.reader = null;
    this.activeScanController = null;
  }

  isSupported() {
    return typeof NDEFReader !== 'undefined';
  }

  showScanOverlay(message = "Approach your academic NFC card to the back of your device...") {
    this.hideScanOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'nfc-scan-overlay';
    overlay.innerHTML = `
      <div class="nfc-scan-modal glass-card" style="border: 1px solid var(--accent-border); background: var(--glass-strong);">
        <div class="nfc-pulse-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.5h7"/><path d="M5 13h14"/><path d="M1.5 9.5h21"/></svg>
        </div>
        <h3 style="font-family:'Space Grotesk',sans-serif; font-weight:700; color:var(--text); margin: 0;">Scan NFC Card</h3>
        <p style="font-size:0.85rem; color:var(--text-soft); margin: 0; line-height: 1.5;">${message}</p>
        <button class="btn btn-ghost btn-sm" id="btn-cancel-nfc-scan" style="margin-top: 12px; border: 1px solid var(--stroke);">Cancel Scan</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-nfc-scan')?.addEventListener('click', () => {
      this.cancelScan();
    });
  }

  hideScanOverlay() {
    const overlay = document.getElementById('nfc-scan-overlay');
    if (overlay) overlay.remove();
  }

  cancelScan() {
    this.hideScanOverlay();
    this.hideSimulatorWidget();
    if (this.activeScanController) {
      try {
        this.activeScanController.abort();
      } catch(e) {}
      this.activeScanController = null;
    }
  }

  async startScan(onRead, onError) {
    if (this.isSupported()) {
      this.showScanOverlay();
      try {
        this.activeScanController = new AbortController();
        const ndef = new NDEFReader();
        await ndef.scan({ signal: this.activeScanController.signal });
        
        ndef.onreading = ({ message, serialNumber }) => {
          this.hideScanOverlay();
          this.activeScanController = null;

          const decoder = new TextDecoder();
          for (const record of message.records) {
            try {
              const text = decoder.decode(record.data);
              const data = JSON.parse(text);
              if (data && data.type === "chaincampus-card") {
                onRead(data, serialNumber);
                return;
              }
            } catch (err) {
              console.warn("[NFC] Record parsing failed:", err);
            }
          }
          onError(new Error("Invalid NFC card. Not a ChainCampus verified tag."));
        };

        ndef.onreadingerror = () => {
          this.hideScanOverlay();
          this.activeScanController = null;
          onError(new Error("Cannot read NFC tag. Make sure it is close enough."));
        };
      } catch (err) {
        this.hideScanOverlay();
        this.activeScanController = null;
        console.error("[NFC] Error scanning:", err);
        onError(err);
      }
    } else {
      // Fallback: Display premium simulated NFC diagnostic tool
      this.showSimulatorWidget("scan", null, onRead, onError);
    }
  }

  async writeCard(studentData, onSuccess, onError) {
    if (this.isSupported()) {
      this.showScanOverlay("Approach blank NFC tag to write credentials...");
      try {
        this.activeScanController = new AbortController();
        const ndef = new NDEFReader();
        await ndef.scan({ signal: this.activeScanController.signal });
        
        ndef.onreading = async () => {
          try {
            const payload = {
              type: "chaincampus-card",
              ...studentData,
              signature: `verified_academic_sig_${Math.random().toString(36).slice(2, 12)}`
            };
            await ndef.write(JSON.stringify(payload));
            this.hideScanOverlay();
            this.activeScanController = null;
            onSuccess(payload);
          } catch (writeErr) {
            this.hideScanOverlay();
            this.activeScanController = null;
            onError(writeErr);
          }
        };
      } catch (err) {
        this.hideScanOverlay();
        this.activeScanController = null;
        onError(err);
      }
    } else {
      // Fallback: Display simulator widget for writing
      this.showSimulatorWidget("write", studentData, onSuccess, onError);
    }
  }

  showSimulatorWidget(mode, payloadData, onSuccess, onError) {
    this.hideSimulatorWidget();

    const widget = document.createElement('div');
    widget.id = 'nfc-simulator-widget';
    widget.className = 'glass-card';
    widget.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      width: 320px;
      padding: 20px;
      border-radius: var(--r-md);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--accent-border);
      background: var(--glass-strong);
      backdrop-filter: blur(12px);
      animation: fadeInUp 0.4s var(--ease-out);
    `;

    // Extract registered student users
    let students = [];
    try {
      const usersRaw = localStorage.getItem("chainCampusUsers") || "[]";
      const parsedUsers = JSON.parse(usersRaw);
      students = parsedUsers.filter(u => !u.isAdmin);
    } catch(e) {
      console.warn("[NFC Simulator] Failed to fetch local students:", e);
    }

    if (mode === "scan") {
      let studentsHtml = "";
      if (students.length > 0) {
        studentsHtml = students.map((st, idx) => `
          <button class="btn btn-secondary btn-sm" id="sim-tap-student-${idx}" style="justify-content: flex-start; text-align: left; padding: 10px; display: flex; align-items: center; gap: 10px; width: 100%; border: 1px solid var(--stroke); border-radius: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <div style="display:flex; flex-direction:column; text-align:left; gap: 1px;">
              <span style="font-weight:700; font-size:0.75rem; color:var(--text);">${st.name}</span>
              <span style="font-size:0.6rem; color:var(--text-soft); font-family:'JetBrains Mono',monospace;">${st.studentId || 'CC-MEMBER'}</span>
            </div>
          </button>
        `).join('');
      } else {
        studentsHtml = `
          <p style="font-size:0.7rem; color:var(--text-soft); text-align:center; padding:16px; background:rgba(255,255,255,0.01); border: 1px dashed var(--stroke); border-radius:8px; line-height: 1.4; margin: 0;">
            No registered student profiles found.<br>
            <a href="login.html" style="color: var(--teal); font-weight:600; text-decoration:underline;">Register a student profile</a> first to tap.
          </p>
        `;
      }

      widget.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-family:'Space Grotesk',sans-serif; font-size:0.85rem; font-weight:700; color:var(--accent); display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.5h7"/><path d="M5 13h14"/><path d="M1.5 9.5h21"/></svg>
            NFC DIAGNOSTICS
          </h4>
          <button id="close-nfc-sim" class="btn-ghost" style="padding:4px; border:none; background:none; color:var(--text-muted); cursor:pointer; display:grid; place-items:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
          </button>
        </div>
        <p style="font-size:0.7rem; color:var(--text-soft); margin-bottom:14px; line-height: 1.4;">Select a simulated student credentials tag to trigger a card reader scan event.</p>
        <div style="display:flex; flex-direction:column; gap:8px; max-height: 180px; overflow-y: auto; padding-right: 4px;">
          ${studentsHtml}
          <button class="btn btn-secondary btn-sm" id="sim-tap-custom" style="display:none;"></button>
          <button class="btn btn-secondary btn-sm" id="sim-tap-invalid" style="justify-content: flex-start; text-align: left; padding: 10px; display: flex; align-items: center; gap: 10px; width: 100%; border: 1px dashed var(--red); background: rgba(239,68,68,0.03);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
            <span style="font-weight:600; font-size:0.75rem; color:var(--red);">Tap Invalid/Broken Tag</span>
          </button>
        </div>
      `;

      // Check if there is a custom written simulated tag in local storage
      const customTag = localStorage.getItem("chainCampusSimulatedNfc");
      if (customTag) {
        try {
          const parsed = JSON.parse(customTag);
          const customBtn = widget.querySelector('#sim-tap-custom');
          if (customBtn) {
            customBtn.style.cssText = "justify-content: flex-start; text-align: left; padding: 10px; display: flex; align-items: center; gap: 10px; width: 100%; border: 1px solid var(--stroke); border-radius: 8px;";
            customBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
              <div style="display:flex; flex-direction:column; text-align:left; gap: 1px;">
                <span style="font-weight:700; font-size:0.75rem; color:var(--text);">${parsed.name}</span>
                <span style="font-size:0.6rem; color:var(--text-soft); font-family:'JetBrains Mono',monospace;">Custom Tag | ${parsed.studentId}</span>
              </div>
            `;
            customBtn.onclick = () => {
              this.hideSimulatorWidget();
              onSuccess(parsed, "SIM-NFC-SERIAL-CUSTOM");
            };
          }
        } catch(e) {}
      }

      students.forEach((st, idx) => {
        const btn = widget.querySelector(`#sim-tap-student-${idx}`);
        if (btn) {
          btn.onclick = () => {
            this.hideSimulatorWidget();
            const payload = {
              type: "chaincampus-card",
              studentId: st.studentId,
              email: st.email,
              name: st.name,
              walletAddress: st.walletAddress,
              college: st.college,
              program: st.program,
              year: st.year
            };
            onSuccess(payload, `SIM-NFC-SERIAL-${st.studentId}`);
          };
        }
      });

      widget.querySelector('#sim-tap-invalid').onclick = () => {
        this.hideSimulatorWidget();
        onError(new Error("Simulation: An unrecognized/corrupt NFC tag was scanned."));
      };

    } else if (mode === "write") {
      widget.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-family:'Space Grotesk',sans-serif; font-size:0.85rem; font-weight:700; color:var(--amber); display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.5h7"/><path d="M5 13h14"/><path d="M1.5 9.5h21"/></svg>
            NFC CARD WRITER
          </h4>
          <button id="close-nfc-sim" class="btn-ghost" style="padding:4px; border:none; background:none; color:var(--text-muted); cursor:pointer; display:grid; place-items:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
          </button>
        </div>
        <p style="font-size:0.7rem; color:var(--text-soft); margin-bottom:10px; line-height: 1.4;">Writing student identity payload securely to virtual NFC chip...</p>
        <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; border:1px solid var(--stroke); font-family:'JetBrains Mono',monospace; font-size:0.65rem; color:var(--text-soft); margin-bottom:14px; word-break:break-all; max-height:100px; overflow-y:auto; line-height:1.4;">
          ${JSON.stringify(payloadData, null, 2)}
        </div>
        <button class="btn btn-primary btn-sm btn-full" id="sim-btn-write" style="display:flex; align-items:center; justify-content:center; gap:6px; font-weight:700;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Write NFC Identity Card
        </button>
      `;

      widget.querySelector('#sim-btn-write').onclick = () => {
        const payload = {
          type: "chaincampus-card",
          ...payloadData,
          signature: `simulated_sec_sig_${Math.random().toString(36).slice(2, 12)}`
        };
        localStorage.setItem("chainCampusSimulatedNfc", JSON.stringify(payload));
        this.hideSimulatorWidget();
        showToast("Card Written Successfully", `NFC credentials stored for ${payload.name}.`, "success");
        onSuccess(payload);
      };
    }

    document.body.appendChild(widget);

    widget.querySelector('#close-nfc-sim').onclick = () => {
      this.cancelScan();
    };
  }

  hideSimulatorWidget() {
    const widget = document.getElementById('nfc-simulator-widget');
    if (widget) widget.remove();
  }
}

export const NfcManager = new NfcService();
window.NfcManager = NfcManager;
