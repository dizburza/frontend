export const runtime = "nodejs";

type BackendApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  const baseUrl =
    process.env.BACKEND_URL || process.env.API_URL || "http://localhost:3000";

  const upstreamUrl = new URL(`/api/auth/check/${address}`, baseUrl);

  const upstreamRes = await fetch(upstreamUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const contentType = upstreamRes.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body: unknown = isJson
    ? ((await upstreamRes.json()) as BackendApiResponse<unknown>)
    : await upstreamRes.text();

  return Response.json(body, {
    status: upstreamRes.status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
