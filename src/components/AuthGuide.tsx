export function AuthGuide({ mode }: { mode: "login" | "signup" }) {
  const steps = mode === "signup"
    ? [
        ["మీ పేరు రాయండి", "Type your name"],
        ["10 అంకెల మొబైల్ నంబర్ (+91 వద్దు)", "10-digit mobile, without +91"],
        ["కనీసం 6 అక్షరాల పాస్‌వర్డ్ పెట్టి గుర్తుంచుకోండి", "Set a 6+ letter password and remember it"],
        ["మీ ఊరు రాయండి — దగ్గరి పనులు చూపిస్తాం", "Your village, to show nearby posts"],
        ["రిజిస్టర్ బటన్ నొక్కండి", "Tap Register"],
      ]
    : [
        ["రిజిస్టర్ చేసిన ఫోన్ నంబర్ ఇవ్వండి", "Enter your registered phone"],
        ["అదే పాస్‌వర్డ్ ఇవ్వండి", "Enter the same password"],
        ["లాగిన్ బటన్ నొక్కండి", "Tap Login"],
      ];
  const fixes = [
    ["'సరైన 10 అంకెల నంబర్' అని వస్తే", "6, 7, 8 లేదా 9 తో మొదలయ్యే 10 అంకెలు మాత్రమే ఇవ్వండి · Use 10 digits starting 6-9"],
    ["'నంబర్ లేదా పాస్‌వర్డ్ తప్పు' అని వస్తే", "నంబర్ సరిచూడండి, కొత్తవారైతే రిజిస్టర్ చేయండి · Check number, or Register first"],
    ["'ఈ నంబర్ ఇప్పటికే ఉంది' అని వస్తే", "పైన 'లాగిన్' నొక్కి లాగిన్ అవ్వండి · Switch to Login"],
    ["పాస్‌వర్డ్ మర్చిపోయారా?", "అడ్మిన్‌ని సంప్రదించండి · Contact admin"],
    ["బటన్ పని చేయకపోతే", "ఇంటర్నెట్ ఆన్ చేసి మళ్ళీ ట్రై చేయండి · Check internet and retry"],
  ];
  return (
    <div className="mx-4 my-5 space-y-3">
      <details open className="rounded-2xl border bg-card p-4 shadow-card">
        <summary className="cursor-pointer text-lg font-bold">📋 ఎలా చేయాలి? · How to</summary>
        <ol className="mt-3 space-y-2">
          {steps.map(([te, en], i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <span><span className="block font-semibold">{te}</span><span className="text-sm text-muted-foreground">{en}</span></span>
            </li>
          ))}
        </ol>
      </details>
      <details className="rounded-2xl border bg-card p-4 shadow-card">
        <summary className="cursor-pointer text-lg font-bold">🛠️ సమస్య వచ్చిందా? · Problems</summary>
        <ul className="mt-3 space-y-3">
          {fixes.map(([q, a], i) => (
            <li key={i}><p className="font-semibold">{q}</p><p className="text-sm text-muted-foreground">{a}</p></li>
          ))}
        </ul>
      </details>
    </div>
  );
}
