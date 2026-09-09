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
  return env.MY_SITE_WORKER.fetch(request);
};
