import React from "react";
import { useApp } from "../context/AppContext";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export function ToastStack() {
  const { toasts } = useApp();

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="toast-item">
          <div className={`toast-icon ${t.type}`}>
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "failed" && <AlertCircle size={16} />}
            {t.type === "pending" && <Info size={16} />}
          </div>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            <div className="toast-desc">{t.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
