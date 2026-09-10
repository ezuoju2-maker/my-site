interface Env {
  MY_SITE_WORKER: {
    fetch(request: Request): Promise<Response>;
  };
}

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) => {
  const upstream = await env.MY_SITE_WORKER.fetch(request);

  // 手动重建响应，确保 set-cookie 头完整传递。
  //
  // Cloudflare Pages Functions 在 Service Binding 转发时，
  // 可能丢失或错误合并 set-cookie（这是已知坑）。
  // 这里用 getSetCookie() 逐个取出，再用 append 逐个写回。
  const newHeaders = new Headers();

  for (const [key, value] of upstream.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      continue;
    }
    newHeaders.set(key, value);
  }

  const response = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: newHeaders,
  });

  // getSetCookie() 是较新的 API，环境支持时优先使用
  const setCookies: string[] =
    typeof (upstream.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie === "function"
      ? (
          upstream.headers as unknown as { getSetCookie: () => string[] }
        ).getSetCookie()
      : (() => {
          const single = upstream.headers.get("set-cookie");
          return single ? [single] : [];
        })();

  for (const cookie of setCookies) {
    response.headers.append("set-cookie", cookie);
  }

  return response;
};
