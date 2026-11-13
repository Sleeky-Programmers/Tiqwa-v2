import { fail, isLive, mockDelay, upstream, type ApiError } from "@/lib/api/upstream";

const NAME = /^[A-Za-z][A-Za-z' -]{1,}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field = (name: string, message: string) => fail({ code: "VALIDATION", status: 422, message, fields: { [name]: message } });

/** Renames the backend's snake_case field names to the ones the forms use. */
const rename = (e: ApiError, map: Record<string, string>): ApiError => {
  if (!e.fields) return e;
  const fields = Object.fromEntries(Object.entries(e.fields).map(([k, m]) => [map[k] ?? k, m]));
  return { ...e, fields };
};

/**
 * POST { action, ... } — account changes.
 *  - "name":          { firstName, surname, middleName?, phone }  → PUT  /user/profile/update
 *  - "password":      { currentPassword, password }               → POST /user/change-password       (current_password, new_password)
 *  - "email-start":   { email, currentPassword }                  → POST /user/email/change          (new_email, current_password)
 *  - "email-confirm": { email, code }                             → POST /user/email/change/confirm  (new_email, token)
 * Title and middle name have no endpoint and are saved on the device.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  switch (body?.action) {
    case "name":
      return changeName(body);
    case "password":
      return changePassword(body);
    case "email-start":
      return startEmailChange(body);
    case "email-confirm":
      return confirmEmailChange(body);
    default:
      return fail({ code: "UNKNOWN_ACTION", status: 400, message: "Unknown action." });
  }
}

async function changeName(body: Record<string, unknown>) {
  const firstName = String(body.firstName ?? "").trim();
  const surname = String(body.surname ?? "").trim();
  const phone = String(body.phone ?? "").replace(/[^\d+]/g, "");
  if (!NAME.test(firstName)) return field("firstName", "Use letters only, at least 2");
  if (!NAME.test(surname)) return field("surname", "Use letters only, at least 2");
  if (body.middleName && !NAME.test(String(body.middleName).trim())) return field("middleName", "Use letters only, at least 2");
  if (phone && !/^\+?\d{7,15}$/.test(phone)) return field("phone", "Please enter a valid phone number");

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  const res = await upstream("/user/profile/update", {
    method: "PUT",
    body: { first_name: firstName, last_name: surname, phone },
    fallback: "We couldn't save your changes right now. Please try again.",
  });
  return res.ok ? Response.json({ ok: true }) : fail(rename(res.error, { first_name: "firstName", last_name: "surname" }));
}

async function changePassword(body: Record<string, unknown>) {
  const current = String(body.currentPassword ?? "");
  const next = String(body.password ?? "");
  if (!current) return field("currentPassword", "Enter your current password");
  if (next.length < 8) return field("password", "Use at least 8 characters");
  if (next === current) return field("password", "Choose a password you haven't used here before");

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  const res = await upstream("/user/change-password", {
    method: "POST",
    body: { current_password: current, new_password: next },
    fallback: "We couldn't change your password right now. Please try again.",
  });
  return res.ok ? Response.json({ ok: true }) : fail(rename(res.error, { current_password: "currentPassword", new_password: "password" }));
}

async function startEmailChange(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim();
  const current = String(body.currentPassword ?? "");
  if (!EMAIL.test(email)) return field("email", "Enter a valid email address");
  if (!current) return field("currentPassword", "Enter your current password");

  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ ok: true });
  }
  const res = await upstream("/user/email/change", {
    method: "POST",
    body: { new_email: email, current_password: current },
    fallback: "We couldn't start the email change right now. Please try again.",
  });
  return res.ok ? Response.json({ ok: true }) : fail(rename(res.error, { new_email: "email", current_password: "currentPassword" }));
}

async function confirmEmailChange(body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim();
  const code = String(body.code ?? "").replace(/\D/g, "");
  if (!EMAIL.test(email)) return field("email", "Enter a valid email address");
  if (code.length !== 6) return field("code", "Enter the 6-digit code from your email");

  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ ok: true });
  }
  const res = await upstream("/user/email/change/confirm", {
    method: "POST",
    body: { new_email: email, token: code },
    fallback: "That code didn't work. Check it and try again.",
  });
  return res.ok ? Response.json({ ok: true }) : fail(rename(res.error, { token: "code", new_email: "email" }));
}
