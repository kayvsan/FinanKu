export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Ambil URL backend dari Environment Variables di dashboard Cloudflare Pages
  const backendBase = context.env.BACKEND_URL;
  if (!backendBase) {
    return new Response(
      JSON.stringify({ error: 'BACKEND_URL belum diatur di Environment Variables Cloudflare Pages.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Arahkan /api/* ke backend VPS
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  const newRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'follow',
  });

  return fetch(newRequest);
}
