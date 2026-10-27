import { DEMO_PASSWORD } from "@/data/dashboard/user";

const NAME = /^[A-Za-z][A-Za-z' -]{1,}$/;
const fail = (field: string, message: string) => Response.json({ error: { field, message } }, { status: 422 });

/**
 * MOCK account API. POST { action, ... }
 *  - "name":     { firstName, surname, middleName? }
 *  - "details":  { email, phone }
 *  - "password": { current, next }  (current must be the demo password; nothing is stored server-side)
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  await new Promise((r) => setTimeout(r, 900));

  switch (body?.action) {
    case "name": {
      if (!NAME.test(String(body.firstName ?? "").trim())) return fail("firstName", "Use letters only, at least 2");
      if (!NAME.test(String(body.surname ?? "").trim())) return fail("surname", "Use letters only, at least 2");
      if (body.middleName && !NAME.test(String(body.middleName).trim())) return fail("middleName", "Use letters only, at least 2");
      return Response.json({ ok: true });
    }
    case "details": {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email ?? ""))) return fail("email", "Please enter a valid email");
      if (!/^\d{7,12}$/.test(String(body.phone ?? "").replace(/\s/g, ""))) return fail("phone", "Please enter a valid phone number");
      return Response.json({ ok: true });
    }
    case "password": {
      if (body.current !== DEMO_PASSWORD) return fail("current", "Your current password is incorrect");
      const next = String(body.next ?? "");
      if (next.length < 8 || !/[A-Z]/.test(next) || !/[a-z]/.test(next) || !/\d/.test(next)) return fail("next", "Password doesn't meet the requirements");
      if (next === body.current) return fail("next", "Choose a password you haven't used before");
      return Response.json({ ok: true });
    }
    default:
      return Response.json({ error: { field: "", message: "Unknown action" } }, { status: 400 });
  }
}
