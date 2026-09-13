import React from "react";
import Login from "./Login";
import { WebMenuResolver } from "./WebMenuPage";

const POS_HOSTS = new Set([
  "login.smartcafe.az",
  "localhost",
  "127.0.0.1",
]);

/** Öz domainində `/` açılanda web menyu; POS hostunda login səhifəsi */
export function isWebMenuCustomHost(hostname = window.location.hostname) {
  const host = String(hostname).toLowerCase().replace(/^www\./, "");
  if (POS_HOSTS.has(host)) return false;
  if (host.endsWith(".localhost")) return false;
  return true;
}

export default function WebMenuHome() {
  if (isWebMenuCustomHost()) {
    return <WebMenuResolver />;
  }
  return <Login />;
}
