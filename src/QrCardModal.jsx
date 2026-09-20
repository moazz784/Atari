import React, { useEffect, useState } from "react";
import { Download, Printer, X } from "lucide-react";
import { api, downloadRoomQrPng, guestOrderUrl, printRoomQr } from "./api";

export default function QrCardModal({ room, onClose }) {
  const [src, setSrc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const orderUrl = guestOrderUrl(room.qrToken);

  useEffect(() => {
    let url = "";
    let cancelled = false;
    api.roomQrBlob(room.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "QR download failed");
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [room.id]);

  const run = async (fn) => {
    try {
      setBusy(true);
      await fn();
    } catch (err) {
      window.alert(err.message || "QR action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0c0f17] border border-gray-800 rounded-[24px] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">{room.name || `Room ${room.id}`}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {error ? (
          <p className="text-red-400 text-sm py-10">{error}</p>
        ) : src ? (
          <img src={src} alt="Room QR" className="w-56 h-56 mx-auto rounded-2xl bg-white p-3" />
        ) : (
          <div className="w-56 h-56 mx-auto rounded-2xl bg-[#111622] animate-pulse" />
        )}
        <p className="text-[11px] text-gray-500 mt-4 break-all">{orderUrl || "QR token is created with this room."}</p>
        <div className="flex gap-2 mt-6">
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => printRoomQr(room))}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1e40af] text-white text-xs font-bold disabled:opacity-50"
          >
            <Printer size={14} /> Print / PDF
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => downloadRoomQrPng(room.id, room.name))}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#111622] border border-gray-700 text-white text-xs font-bold disabled:opacity-50"
          >
            <Download size={14} /> PNG
          </button>
        </div>
      </div>
    </div>
  );
}
