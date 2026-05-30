import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useApi } from "../hooks/useApi";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { session } = useAuth();
  const { bootstrap } = useApi();

  const [state, setState] = useState({
    events: [],
    courses: [],
    attendanceRecords: [],
    notifications: [],
    enrolledCourses: [],
    scholarshipApplications: [],
    txLog: [],
  });
  const [toasts, setToasts] = useState([]);
  const [nfcScanState, setNfcScanState] = useState({
    active: false,
    mode: null,
    onRead: null,
    onError: null,
    payloadData: null
  });

  const showToast = useCallback((title, desc, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, desc, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const data = await bootstrap();
      if (data) {
        setState({
          events: data.chainCampusEvents || [],
          courses: data.chainCampusCourses || [],
          attendanceRecords: data.chainCampusAttendance || [],
          notifications: data.chainCampusNotifications || [],
          enrolledCourses: data.chainCampusEnrolled || [],
          scholarshipApplications: data.chainCampusScholarships || [],
          txLog: data.chainCampusTxLog || [],
        });
      }
    } catch (err) {
      console.error("[app] Failed to refresh bootstrap data:", err);
    }
  }, [bootstrap]);

  const startNfcScan = useCallback((onRead, onError) => {
    setNfcScanState({
      active: true,
      mode: "scan",
      onRead,
      onError,
      payloadData: null
    });
  }, []);

  const startNfcWrite = useCallback((payloadData, onSuccess, onError) => {
    setNfcScanState({
      active: true,
      mode: "write",
      onRead: onSuccess,
      onError,
      payloadData
    });
  }, []);

  const cancelNfcScan = useCallback(() => {
    if (nfcScanState.onError) {
      nfcScanState.onError(new Error("Scan cancelled by user."));
    }
    setNfcScanState({
      active: false,
      mode: null,
      onRead: null,
      onError: null,
      payloadData: null
    });
  }, [nfcScanState]);

  const triggerNfcScan = useCallback((cardData) => {
    if (nfcScanState.onRead) {
      nfcScanState.onRead(cardData, "SIM-NFC-SERIAL-1029");
    }
    setNfcScanState({
      active: false,
      mode: null,
      onRead: null,
      onError: null,
      payloadData: null
    });
  }, [nfcScanState]);

  useEffect(() => {
    refreshData();
  }, [session, refreshData]);

  return (
    <AppContext.Provider
      value={{
        state,
        toasts,
        nfcScanState,
        showToast,
        refreshData,
        startNfcScan,
        startNfcWrite,
        cancelNfcScan,
        triggerNfcScan,
        setState
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
