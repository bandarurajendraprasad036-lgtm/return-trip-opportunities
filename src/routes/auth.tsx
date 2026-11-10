import { Brand } from "@/components/Brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GoogleSignIn } from "@/components/GoogleSignIn";
import { DesignFooter } from "@/components/DesignFooter";
import { PhoneSignIn } from "@/components/PhoneSignIn";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "లాగిన్ · Login — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "Login to గాయత్రి వన్ · Gayatri One with a phone code or Google." },
      { property: "og:title", content: "Login — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "Login to గాయత్రి వన్ · Gayatri One with a phone code or Google." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
    <header className="bg-royal px-5 py-8 text-on-royal"><h1 className="text-4xl font-bold"><Brand /></h1><p className="mt-3 text-lg">మొబైల్ లేదా గూగుల్ ద్వారా ప్రవేశం · Phone or Google sign-in</p></header>
    <main className="flex-1 space-y-5 px-5 py-8"><PhoneSignIn /><GoogleSignIn /><Link to="/feed" className="block py-3 text-center text-primary underline">ప్రకటనలు చూడండి · Browse advertisements</Link><Link to="/admin-login" className="block py-3 text-center text-sm text-muted-foreground underline">అడ్మిన్ ప్రవేశం · Admin login</Link></main>
    <DesignFooter />
  </div>;
}
