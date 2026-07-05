import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:2000";
/** Image generation can take several minutes */
const EXECUTE_TIMEOUT_MS = 5 * 60 * 1000;

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const res = await fetch(`${BACKEND_URL}/chat/text/${id}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      signal: AbortSignal.timeout(EXECUTE_TIMEOUT_MS),
    });

    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[execute proxy]", err);
    return Response.json(
      {
        msg: "Object creation timed out or the server disconnected. Try again.",
      },
      { status: 504 }
    );
  }
}
