"use client";

import { waLink } from "@/lib/whatsapp";
import { track, useConfig } from "../StoreProvider";
import WhatsAppIcon from "../WhatsAppIcon";

export default function WhatsAppFloat() {
  const config = useConfig();
  const href = waLink(config.whatsappNumber, `¡Hola ${config.storeName}! 👋 Vi la tienda y quiero información de hoy.`);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click")}
      aria-label="Chatear directamente por WhatsApp"
      className="fixed bottom-24 right-4 z-40 grid size-14 place-items-center rounded-full bg-wa text-white shadow-pop transition hover:scale-110 hover:bg-wa-deep md:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
