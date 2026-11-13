import { getContact } from "@/lib/api/site";

export async function ChatPill() {
  const { whatsapp } = await getContact();
  // No WhatsApp number from the backend means no chat button.
  if (!whatsapp) return null;
  return (
    <a
      href={whatsapp.href}
      target="_blank"
      rel="noopener noreferrer"
      className="press fixed bottom-[18px] right-[18px] z-50 rounded-full bg-blue-900 px-[14px] py-3 text-[13.33px] font-bold leading-[16px] text-white shadow-[0_14px_30px_rgba(0,0,0,0.18)] animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_0.8s_backwards] hover:bg-navy-900 hover:shadow-[0_18px_36px_rgba(1,40,74,0.28)] motion-reduce:animate-none"
    >
      Live Chat
    </a>
  );
}
