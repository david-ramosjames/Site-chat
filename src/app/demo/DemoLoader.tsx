"use client";

import { useEffect } from "react";

export default function DemoLoader({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (document.querySelector("script[data-chatto-convert-demo]")) return;
    const s = document.createElement("script");
    s.src = "/widget.js";
    s.async = true;
    s.setAttribute("data-client-id", clientId);
    s.setAttribute("data-chatto-convert-demo", "true");
    document.body.appendChild(s);
  }, [clientId]);
  return null;
}
