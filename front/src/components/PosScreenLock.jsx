import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import SecurityGate from "./SecurityGate";
import { useUiSettings } from "../context/UiSettingsContext";
import { getScreenLockIdleSeconds } from "../config/uiSettings";
import {
  isCategoryEnabled,
  prefetchSecuritySettings,
  shouldBypassSecurityPins,
} from "../utils/securityPasswords";
import { isWebMenuCustomHost } from "../pages/WebMenuHome";

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "touchstart", "click", "scroll"];

const isPublicPosRoute = (pathname) =>
  pathname === "/login" ||
  pathname.startsWith("/forgot-password") ||
  pathname.startsWith("/reset-password") ||
  pathname.startsWith("/adminPage") ||
  pathname.startsWith("/order-details") ||
  pathname.startsWith("/menu") ||
  isWebMenuCustomHost();

const PosScreenLock = () => {
  const location = useLocation();
  const { settings, loaded: uiLoaded } = useUiSettings();
  const [locked, setLocked] = useState(false);
  const [securityReady, setSecurityReady] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const idleSeconds = getScreenLockIdleSeconds(settings);

  const touchActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (locked) return;
  }, [locked]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await prefetchSecuritySettings();
      } catch {
        /* ignore */
      }
      if (!cancelled) setSecurityReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (locked) return undefined;
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, touchActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, touchActivity));
    };
  }, [locked, touchActivity]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !uiLoaded || !securityReady) return undefined;
    if (isPublicPosRoute(location.pathname)) return undefined;
    if (shouldBypassSecurityPins()) return undefined;
    if (!isCategoryEnabled("ekran")) return undefined;
    if (idleSeconds <= 0) return undefined;

    const tick = () => {
      const elapsed = (Date.now() - lastActivityRef.current) / 1000;
      if (elapsed >= idleSeconds) setLocked(true);
    };

    touchActivity();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [location.pathname, uiLoaded, securityReady, idleSeconds, touchActivity]);

  useEffect(() => {
    if (idleSeconds <= 0 || !isCategoryEnabled("ekran")) {
      setLocked(false);
    }
  }, [idleSeconds, location.pathname]);

  const token = localStorage.getItem("token");
  if (!token || !locked || isPublicPosRoute(location.pathname)) return null;

  return (
    <SecurityGate
      category="ekran"
      autoDismiss={false}
      onSuccess={() => {
        lastActivityRef.current = Date.now();
        setLocked(false);
      }}
    />
  );
};

export default PosScreenLock;
