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
  headers.set("accept", "application/json");
  headers.delete("host");

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const upstreamRes = await fetch(upstreamUrl, {
    method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  const contentType = upstreamRes.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const body: unknown = isJson ? await upstreamRes.json() : await upstreamRes.text();

  return Response.json(body, {
    status: upstreamRes.status,
    headers: {
      "cache-control": "no-store",
    },
  });
};

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
