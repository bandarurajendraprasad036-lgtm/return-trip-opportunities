import { Brand } from "@/components/Brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DesignFooter } from "@/components/DesignFooter";
import { PhonePasswordAuth } from "@/components/PhonePasswordAuth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { useMe } from "@/lib/session";
import { Button } from '@/components/ui/button';

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
    <header className="bg-royal px-5 py-8 text-on-royal"><h1 className="text-4xl font-bold"><Brand /></h1>{me?.isAdmin === true && <Link to="/admin" className="block py-3 text-lg font-bold underline">నిర్వాహకుల ప్రవేశం</Link>}<p className="mt-3 text-lg">Google తో లాగిన్ అవ్వండి</p></header>
    <main className="flex-1 space-y-5 px-5 py-8"><GoogleSignInButton /><details><summary className="cursor-pointer py-2 text-base underline">పాత ఖాతా (నంబర్ + పిన్) ఉన్నవాళ్ళు ఇక్కడ</summary><PhonePasswordAuth /></details><Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal"><Link to="/feed">ధృవీకరణ లేకుండా అతిథిగా కొనసాగించండి</Link></Button></main>
    <DesignFooter />
  </div>;
}
