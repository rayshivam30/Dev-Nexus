import { useEffect, useReducer } from "react";

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

interface NetworkState {
  isOnline: boolean;
  isSlowConnection: boolean;
}

type NetworkAction =
  | {
      type: "INIT";
      payload: {
        isOnline: boolean;
        isSlowConnection: boolean;
      };
    }
  | { type: "SET_ONLINE"; payload: boolean }
  | { type: "SET_SLOW_CONNECTION"; payload: boolean };

function networkReducer(
  state: NetworkState,
  action: NetworkAction
): NetworkState {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        isOnline: action.payload.isOnline,
        isSlowConnection: action.payload.isSlowConnection,
      };

    case "SET_ONLINE":
      return {
        ...state,
        isOnline: action.payload,
      };

    case "SET_SLOW_CONNECTION":
      return {
        ...state,
        isSlowConnection: action.payload,
      };

    default:
      return state;
  }
}

export function useNetworkStatus() {
  const [state, dispatch] = useReducer(networkReducer, {
    // SSR-safe defaults
    isOnline: true,
    isSlowConnection: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: "SET_ONLINE",
        payload: true,
      });
    };

    const handleOffline = () => {
      dispatch({
        type: "SET_ONLINE",
        payload: false,
      });
    };

    const nav = navigator as NavigatorWithConnection;

    const conn =
      nav.connection ||
      nav.mozConnection ||
      nav.webkitConnection;

    const isSlowConnection =
      !!conn &&
      ["slow-2g", "2g"].includes(
        conn.effectiveType ?? ""
      );

    // Initialize network state once on mount
    dispatch({
      type: "INIT",
      payload: {
        isOnline: navigator.onLine,
        isSlowConnection,
      },
    });

    const checkSpeed = () => {
      dispatch({
        type: "SET_SLOW_CONNECTION",
        payload:
          !!conn &&
          ["slow-2g", "2g", "3g"].includes(
            conn.effectiveType ?? ""
          ),
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    conn?.addEventListener?.("change", checkSpeed);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);

      conn?.removeEventListener?.("change", checkSpeed);
    };
  }, []);

  return state;
}