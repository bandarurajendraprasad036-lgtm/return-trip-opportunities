import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PostCard, type Post } from "@/components/PostCard";
import { useMe } from "@/lib/session";
import { findAiMatches } from "@/lib/ai-match.functions";

export const Route = createFileRoute("/_authenticated/ai-match")({
  head: () => ({
    meta: [
      { title: "AI సహాయం · AI Match — గాయత్రి వన్ · Gayatri One" },
      { name: "description", content: "గాయత్రి వన్ · Gayatri One — Describe your need in Telugu or English and find matching jobs or return trips." },
      { property: "og:title", content: "AI Match — గాయత్రి వన్ · Gayatri One" },
      { property: "og:description", content: "గాయత్రి వన్ · Gayatri One — Describe your need and find matching jobs or return trips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiMatchPage,
});

const EXAMPLES = [
  "నాకు గుంటూరులో డ్రైవర్ పని కావాలి",
  "I have an empty lorry from Vijayawada to Hyderabad tomorrow",
  "నాకు విజయవాడలో 2 కూలీలు కావాలి",
];

function AiMatchPage() {
  const { data: me } = useMe();
  const [text, setText] = useState("");
  const run = useServerFn(findAiMatches);
  const m = useMutation({ mutationFn: (t: string) => run({ data: { text: t } }) });
  const ids = m.data?.matches.map((x) => x.id) ?? [];
  const { data: posts = [] } = useQuery({
    queryKey: ["ai-posts", ids],
    enabled: ids.length > 0,
    queryFn: async () => (await supabase.from("posts").select("*").in("id", ids)).data as Post[],
  });

  return (
    <div className="space-y-4 p-4">
      <h2 className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="text-secondary" />మీ అవసరం చెప్పండి</h2>
      <p className="text-muted-foreground">Tell us what you need — AI finds matching jobs or trips.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) m.mutate(text); }} className="space-y-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="text-lg" placeholder="ఉదా: నాకు గుంటూరులో పని కావాలి · e.g. I need a job in Guntur" />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button type="button" key={ex} onClick={() => setText(ex)} className="rounded-full bg-muted px-3 py-1 text-sm">{ex}</button>
          ))}
        </div>
        <Button type="submit" size="xl" className="w-full" disabled={m.isPending || !text.trim()}>
          <Sparkles />{m.isPending ? "వెతుకుతోంది... Searching" : "వెతకండి · Find matches"}
        </Button>
      </form>
      {m.isError && <p className="rounded-lg bg-destructive/10 p-3 text-destructive">{(m.error as Error).message}</p>}
      {m.isSuccess && ids.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-6 text-center text-muted-foreground">మ్యాచ్‌లు లేవు · No matches found yet</div>
      )}
      {m.data?.matches.map((x) => {
        const p = posts.find((pp) => pp.id === x.id);
        return p ? (
          <div key={x.id} className="space-y-1">
            <p className="px-1 text-sm font-semibold text-primary">✨ {x.reason}</p>
            <PostCard post={p} meId={me?.id} highlight />
          </div>
        ) : null;
      })}
    </div>
  );
}
