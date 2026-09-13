import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

export function extractMapsUrl(text) {
  if (!text) return null;
  const match = String(text).match(/https?:\/\/[^\s]+google[^\s]*/i);
  return match ? match[0] : null;
}

export function formatAddressForReceipt(text) {
  if (!text) return "—";
  const cleaned = String(text)
    .split("\n")
    .map((line) => line.replace(/https?:\/\/[^\s]+google[^\s]*/gi, "").trim())
    .filter((line) => line && !/^📍\s*Konum:/i.test(line))
    .join("\n")
    .trim();
  return cleaned || "—";
}

export function escapeReceiptHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Web sifariş ünvanından Google Maps QR HTML (qəbz çapı) */
export function buildLocationQrHtml(mapsUrl) {
  if (!mapsUrl) return "";

  const svg = renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: mapsUrl,
      size: 100,
      level: "M",
      includeMargin: true,
    })
  );

  return `
    <div style="text-align:center;margin-top:12px;padding-top:10px;border-top:1px dashed #999">
      <p style="font-size:12px;font-weight:bold;margin:0 0 8px">Çatdırılma konumu — QR skan edin</p>
      ${svg}
    </div>`;
}

export function resolveReceiptMapsUrl(...sources) {
  for (const src of sources) {
    const url = extractMapsUrl(src);
    if (url) return url;
  }
  return null;
}
