import { showToast } from "./main.js";

class NfcService {
  constructor() {
    this.reader = null;
    this.activeScanController = null;
    this.simulatedStudentData = {
      type: "chaincampus-card",
      studentId: "CC-1001",
      email: "test.student@vit.edu",
      name: "Test Student",
      walletAddress: "CCvWteststudent",
      college: "ChainCampus College",
      program: "B.Tech Computer Science",
      year: "3rd Year"
    };
  }

  isSupported() {
    return typeof NDEFReader !== 'undefined';
  }

  showScanOverlay(message = "Approach your NFC card to the back of your device...") {
    // Remove existing overlay if any
    this.hideScanOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'nfc-scan-overlay';
    overlay.innerHTML = `
      <div class="nfc-scan-modal glass-card">
        <div class="nfc-pulse-circle">📶</div>
        <h3>Scan NFC Card</h3>
        <p>${message}</p>
        <button class="btn btn-ghost btn-sm" id="btn-cancel-nfc-scan" style="margin-top: 16px;">Cancel</button>
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
      // Fallback: Display floating virtual NFC simulator
      this.showSimulatorWidget("scan", null, onRead, onError);
    }
  }

  async writeCard(studentData, onSuccess, onError) {
    if (this.isSupported()) {
      this.showScanOverlay("Approach blank NFC tag to write credentials...");
      try {
        this.activeScanController = new AbortController();
        const ndef = new NDEFReader();
        
        // Web NFC requires scanning to obtain tag proximity before writing
        await ndef.scan({ signal: this.activeScanController.signal });
        
        ndef.onreading = async () => {
          try {
            // Write NDEF text record containing student data JSON
            const payload = {
              type: "chaincampus-card",
              ...studentData,
              signature: `mock_sig_${Math.random().toString(36).slice(2, 12)}`
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
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      animation: fadeInUp 0.4s var(--ease-out);
    `;

    if (mode === "scan") {
      widget.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-family:'Space Grotesk',sans-serif; color:#fbbf24;">⚡ NFC Simulator (Desktop)</h4>
          <button id="close-nfc-sim" class="btn-ghost" style="padding:0; border:none; background:none; color:var(--text-muted); cursor:pointer;">✕</button>
        </div>
        <p style="font-size:0.75rem; color:var(--text-soft); margin-bottom:16px;">Web NFC is not supported on this browser. Select a simulated card to tap.</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <button class="btn btn-secondary btn-sm" id="sim-tap-student">🎓 Tap Student Card (CC-1001)</button>
          <button class="btn btn-secondary btn-sm" id="sim-tap-custom" style="display:none;" id="sim-custom-btn"></button>
          <button class="btn btn-secondary btn-sm" id="sim-tap-invalid">❌ Tap Invalid Card</button>
        </div>
      `;

      // Check if there is a custom written simulated tag in local storage
      const customTag = localStorage.getItem("chainCampusSimulatedNfc");
      if (customTag) {
        try {
          const parsed = JSON.parse(customTag);
          const customBtn = widget.querySelector('#sim-tap-custom');
          if (customBtn) {
            customBtn.style.display = 'block';
            customBtn.textContent = `🎴 Tap Custom: ${parsed.name} (${parsed.studentId})`;
            customBtn.onclick = () => {
              this.hideSimulatorWidget();
              onSuccess(parsed, "SIM-NFC-SERIAL-CUSTOM");
            };
          }
        } catch(e) {}
      }

      widget.querySelector('#sim-tap-student').onclick = () => {
        this.hideSimulatorWidget();
        onSuccess(this.simulatedStudentData, "SIM-NFC-SERIAL-1001");
      };

      widget.querySelector('#sim-tap-invalid').onclick = () => {
        this.hideSimulatorWidget();
        onError(new Error("Simulation: Invalid tag tapped."));
      };

    } else if (mode === "write") {
      widget.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="margin:0; font-family:'Space Grotesk',sans-serif; color:#fbbf24;">⚡ NFC Simulator (Desktop)</h4>
          <button id="close-nfc-sim" class="btn-ghost" style="padding:0; border:none; background:none; color:var(--text-muted); cursor:pointer;">✕</button>
        </div>
        <p style="font-size:0.75rem; color:var(--text-soft); margin-bottom:12px;">Simulating writing credentials onto tag:</p>
        <div style="background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; font-family:'JetBrains Mono',monospace; font-size:0.7rem; color:var(--text-muted); margin-bottom:16px; word-break:break-all;">
          ${JSON.stringify(payloadData, null, 2)}
        </div>
        <button class="btn btn-primary btn-sm btn-full" id="sim-btn-write">Write Simulated Tag</button>
      `;

      widget.querySelector('#sim-btn-write').onclick = () => {
        const payload = {
          type: "chaincampus-card",
          ...payloadData,
          signature: `sim_sig_${Math.random().toString(36).slice(2, 12)}`
        };
        localStorage.setItem("chainCampusSimulatedNfc", JSON.stringify(payload));
        this.hideSimulatorWidget();
        showToast("Simulation Tag Written ✓", `Simulated credentials saved for ${payload.name}.`, "success");
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
