export const runtime = "nodejs";

const getBackendBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const createUpstreamUrl = (request: Request, pathSegments: string[]) => {
  const baseUrl = getBackendBaseUrl();
  const incomingUrl = new URL(request.url);
  const joinedPath = pathSegments.map(encodeURIComponent).join("/");
  return new URL(`/api/${joinedPath}${incomingUrl.search}`, baseUrl);
};

const proxy = async (
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) => {
  const { path } = await context.params;
  const upstreamUrl = createUpstreamUrl(request, path);

  const headers = new Headers(request.headers);
  headers.delete("host");
  // The browser talks to this origin, so the backend needs to be told which
  // origin the request really came from for its CSRF check to pass.
  headers.set("origin", new URL(request.url).origin);

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers({ "cache-control": "no-store" });

  // Session cookies are set by the backend and must survive the hop, otherwise
  // login succeeds upstream and the browser never receives the session.
  // getSetCookie keeps multiple Set-Cookie headers separate; joining them into
  // one string would corrupt cookies whose values contain commas.
  for (const cookie of upstreamRes.headers.getSetCookie?.() ?? []) {
    responseHeaders.append("set-cookie", cookie);
  }

  const contentType = upstreamRes.headers.get("content-type") || "";

  // Server-sent events must stream through untouched. Buffering the body here
  // would hold every event until the connection closed.
  if (contentType.includes("text/event-stream")) {
    responseHeaders.set("content-type", "text/event-stream");
    responseHeaders.set("connection", "keep-alive");
    responseHeaders.set("x-accel-buffering", "no");

    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  }

  const isJson = contentType.includes("application/json");
  const body: unknown = isJson ? await upstreamRes.json() : await upstreamRes.text();

  responseHeaders.set("content-type", isJson ? "application/json" : "text/plain");

  return new Response(isJson ? JSON.stringify(body) : String(body), {
    status: upstreamRes.status,
    headers: responseHeaders,
  });
};

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
