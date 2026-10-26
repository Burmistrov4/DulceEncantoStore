"use client";

import { useEffect } from "react";
import { track } from "../StoreProvider";

// Cuenta 1 visita por sesión de navegador (métrica de leads en el admin)
export default function TrackView() {
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("dulces-view")) {
        sessionStorage.setItem("dulces-view", "1");
        track("view");
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
