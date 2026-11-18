import { Brand } from "@/components/Brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DesignFooter } from "@/components/DesignFooter";
import { PhonePasswordAuth } from "@/components/PhonePasswordAuth";
import { useMe } from "@/lib/session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "లాగిన్ · Login — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్‌లో మొబైల్ నంబర్, పాస్వర్డ్‌తో ప్రవేశించండి లేదా కొత్త ఖాతా తెరవండి." },
      { property: "og:title", content: "Login — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్‌లో మొబైల్ నంబర్, పాస్వర్డ్‌తో ప్రవేశం." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { data: me } = useMe();
  return <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
    <header className="bg-royal px-5 py-8 text-on-royal"><h1 className="text-4xl font-bold"><Brand /></h1><p className="mt-3 text-lg">మొబైల్ నంబర్ + పాస్వర్డ్‌తో ప్రవేశం</p></header>
    <main className="flex-1 space-y-5 px-5 py-8"><PhonePasswordAuth /><Link to="/feed" className="block py-3 text-center text-primary underline">ఉచితంగా ప్రకటనలు చూడండి</Link>{me?.isAdmin === true && <Link to="/admin-login" className="block border-y border-primary py-4 text-center text-lg font-bold text-primary">నిర్వాహకుల ప్రవేశం</Link>}</main>
    <DesignFooter />
  </div>;
}
