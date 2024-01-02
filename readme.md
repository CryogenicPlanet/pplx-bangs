# pplx bangs

tiny duckduckgo style bangs for perplexity, google and metaphor

cf worker that routes your search query to either `google`, `perplexity` or `metaphor` depending on the `!g`, `!p` or `!m` prefix.

Default is `perplexity` without copilot, `!p` sets copilot.

You can also use `!! <bang>` to route the last query to a different bang. (cache is only 1 query deep)

Feel free to change the default search engine, and the bangs to your liking.


## Setup/Usage

Fork, clone and cd into the repo.

```bash
pnpm i
npx wrangler kv:namespace create QUERY_CACHE # set this output in wrangler.toml

npx wrangler publish

```

Set the published worker url as your default search engine in your browser.

