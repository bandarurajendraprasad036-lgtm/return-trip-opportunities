import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/chats")({
  beforeLoad: () => { throw redirect({ to: '/dashboard', search: { view: 'chats' } }); },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "చాట్స్ · Chats — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Your conversations on గాయత్రి వన్ · Gayatri One." },
      { property: "og:title", content: "Chats — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Your conversations on గాయత్రి వన్ · Gayatri One." },
    ],
  }),
  component: Chats,
});

function Chats() { return null; }
