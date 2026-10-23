const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Stub: validates input only. Wire to an email provider (e.g. Mailchimp/Resend) when chosen.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!emailRe.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  return Response.json({ ok: true });
}
