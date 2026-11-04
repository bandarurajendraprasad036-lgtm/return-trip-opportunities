import { Brand } from "@/components/Brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { DesignFooter } from "@/components/DesignFooter";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "లాగిన్ · Login — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Login to గాయత్రి వన్ · Gayatri One with Google." },
      { property: "og:title", content: "Login — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Login to గాయత్రి వన్ · Gayatri One with Google." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
    <header className="bg-royal px-5 py-8 text-on-royal"><h1 className="text-4xl font-bold"><Brand /></h1><p className="mt-3 text-lg">గూగుల్ ద్వారా ప్రవేశం · Google sign-in</p></header>
    <main className="flex-1 space-y-5 px-5 py-8"><GoogleSignIn /><Link to="/feed" className="block py-3 text-center text-primary underline">ప్రకటనలు చూడండి · Browse advertisements</Link></main>
    <DesignFooter />
  </div>;
}
