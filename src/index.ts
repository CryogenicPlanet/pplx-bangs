/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // MEET_URL: KVNamespace;
  QUERY_CACHE: KVNamespace;
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    async function handleSearch(
      request: Request,
      env: Env,
      ctx: ExecutionContext
    ): Promise<Response> {
      const query = url.searchParams.get("q");

      let redirectUrl = new URL("https://www.perplexity.ai/search");

      const swapLastQuery = async (query: string) => {
        if (query?.includes("!!")) {
          const lastQuery = await env.QUERY_CACHE.get("last");
          if (lastQuery) {
            return `${lastQuery} ${query
              .replace("!!", "")
              .replace(/!g|!p|!m/g, "")}`;
          }
        }
        return query;
      };

      if (query) {
        if (query.includes("!g")) {
          redirectUrl = new URL("https://www.google.com/search");
          redirectUrl.searchParams.set(
            "q",
            await swapLastQuery(query.replace("!g", ""))
          );
        } else if (query.includes("!p")) {
          redirectUrl = new URL("https://www.perplexity.ai/search");
          redirectUrl.searchParams.set(
            "q",
            await swapLastQuery(query.replace("!p", ""))
          );
          redirectUrl.searchParams.set("copilot", "true");
        } else if (query.includes("!m")) {
          redirectUrl = new URL("https://metaphor.systems/search");
          redirectUrl.searchParams.set(
            "q",
            await swapLastQuery(query.replace("!m", ""))
          );
        } else {
          redirectUrl.searchParams.set("q", await swapLastQuery(query));
        }

        ctx.waitUntil(
          env.QUERY_CACHE.put("last", query.replace(/!g|!p|!m/g, ""))
        );
      }

      return Response.redirect(redirectUrl.href, 302);
    }

    switch (url.pathname) {
      default:
        // Default to search
        return handleSearch(request, env, ctx);
    }
  },
};
