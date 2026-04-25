"use client";

import { useEffect } from "react";

export default function DemoLoader({ clientId }: { clientId: string }) {
  useEffect(() => {
    if (document.querySelector("script[data-rjl-chat-demo]")) return;
    const s = document.createElement("script");
    s.src = "/widget.js";
    s.async = true;
    s.setAttribute("data-client-id", clientId);
    s.setAttribute("data-rjl-chat-demo", "true");
    document.body.appendChild(s);
  }, [clientId]);
  return null;
}
