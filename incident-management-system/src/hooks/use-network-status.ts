import { useEffect, useState } from "react";

interface NetworkConnection {
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
  mozConnection?: NetworkConnection;
  webkitConnection?: NetworkConnection;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // Always start with true to avoid hydration mismatch
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window === "undefined") return;

    // Set initial online status after client hydration
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Speed / quality check
    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const checkSpeed = () => {
      if (conn) {
        setIsSlowConnection(
          conn.effectiveType === "slow-2g" ||
          conn.effectiveType === "2g" ||
          conn.effectiveType === "3g"
        );
      }
    };

    checkSpeed();
    if (conn && conn.addEventListener) {
      conn.addEventListener("change", checkSpeed);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener("change", checkSpeed);
      }
    };
  }, []);

  return { isOnline: isClient ? isOnline : true, isSlowConnection: isClient ? isSlowConnection : false };
}
