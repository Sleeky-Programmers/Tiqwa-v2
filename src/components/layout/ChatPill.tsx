import { contact } from "@/data/contact";

export function ChatPill() {
  return (
    <a
      href={contact.whatsapp.href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[18px] right-[18px] z-50 rounded-full bg-blue-900 px-[14px] py-3 text-[13.33px] font-bold leading-[16px] text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition hover:bg-navy-900"
    >
      Live Chat
    </a>
  );
}
