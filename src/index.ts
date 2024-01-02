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
            return lastQuery;
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
        } else if (query.includes("!m")) {
          redirectUrl = new URL("https://metaphor.systems/search");
          redirectUrl.searchParams.set(
            "q",
            await swapLastQuery(query.replace("!m", ""))
          );
        } else {
          redirectUrl.searchParams.set("q", await swapLastQuery(query));
        }
      }

      await env.QUERY_CACHE.put(
        "last",
        redirectUrl.searchParams.get("q") || ""
      );

      return Response.redirect(redirectUrl.href, 302);
    }

    switch (url.pathname) {
      // case "/meet": {
      //   const id = url.searchParams.get("id");

      //   if (id) {
      //     const meetUrl = await env.MEET_URL.get(id);

      //     if (meetUrl) {
      //       return Response.redirect(meetUrl, 302);
      //     } else {
      //       return new Response("Not Found", { status: 404 });
      //     }
      //   } else {
      //     const newId = Math.random().toString(36).substring(2, 7);

      //     // Handle /meet path with redirection depth check
      //     let response = await fetch("https://meet.google.com/new", {
      //       redirect: "follow",
      //       headers: {
      //         "User-Agent":
      //           "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      //       },
      //     });
      //     let redirectCount = 0;
      //     while (redirectCount < 5) {
      //       const url = response.url;

      //       console.log({ url });

      //       const newUrl = new URL(url);

      //       if (!newUrl.pathname.includes("unsupported")) {
      //         break;
      //       }

      //       response = await fetch(url, {
      //         redirect: "follow",
      //       });
      //       redirectCount++;
      //     }
      //     if (redirectCount >= 5) {
      //       return new Response("Not Found", { status: 404 });
      //     }

      //     console.log(response.url);

      //     //   await env.MEET_URL.put(newId, response.url);

      //     return Response.redirect(response.url, 302);
      //   }
      // }
      default:
        // Default to search
        return handleSearch(request, env, ctx);
    }
  },
};
