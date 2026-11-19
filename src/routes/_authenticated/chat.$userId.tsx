import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
export const Route = createFileRoute("/_authenticated/chat/$userId")({
  beforeLoad: ({ params, search }) => { throw redirect({ to: '/dashboard', search: { view: 'chat', peer: params.userId, post: search.post } }); },
  validateSearch: (search: Record<string, unknown>): { post?: string | undefined } => ({ post: typeof search["post"] === "string" && z.string().uuid().safeParse(search["post"]).success ? search["post"] : undefined }),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "చాట్ · Chat — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Chat directly with a గాయత్రి వన్ · Gayatri One member." },
      { property: "og:title", content: "Chat — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Chat directly with a గాయత్రి వన్ · Gayatri One member." },
    ],
  }),
  component: Chat,
});

function Chat() { return null; }
