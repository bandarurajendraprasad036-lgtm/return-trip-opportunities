import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/notifications")({
  beforeLoad: () => { throw redirect({ to: '/dashboard', search: { view: 'notifications' } }); },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "అలర్ట్స్ · Alerts — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Your match alerts for jobs and return vehicles." },
      { property: "og:title", content: "Alerts — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Your match alerts for jobs and return vehicles." },
    ],
  }),
  component: Notifications,
});

function Notifications() { return null; }
