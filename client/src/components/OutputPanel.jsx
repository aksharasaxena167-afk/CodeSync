import { useState } from "react";

export default function OutputPanel({ output }) {
  const isRunning = output.status === "Running...";
  const hasError = Boolean(output.stderr) || output.status === "Error";
  const [tab, setTab] = useState("stdout");

  const tabs = [
    { id: "stdout", label: "stdout", content: output.stdout, color: "text-emerald-300" },
    { id: "stderr", label: "stderr", content: output.stderr, color: "text-red-400" },
  ];

  const activeTab = tabs.find((t) => t.id === tab) || tabs[0];

  return (
    <section className="flex h-48 shrink-0 flex-col border-t border-codesync-border bg-codesync-terminal">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-codesync-border/50 bg-codesync-panel px-2">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1 font-mono text-xs uppercase transition ${tab === t.id ? "bg-codesync-bg text-white" : "text-gray-500 hover:text-gray-300"}`}
            >
              {t.label}
              {t.content ? " •" : ""}
            </button>
          ))}
        </div>
        {output.status && (
          <span className={`mr-2 font-mono text-xs ${isRunning ? "text-yellow-400" : hasError ? "text-red-400" : "text-emerald-400"}`}>
            {isRunning && <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-400" />}
            {output.status}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed">
        {isRunning && !output.stdout && !output.stderr && (
          <p className="animate-pulse text-gray-500">Executing code…</p>
        )}
        {activeTab.content ? (
          <pre className={`whitespace-pre-wrap ${activeTab.color}`}>{activeTab.content}</pre>
        ) : (
          !isRunning && (
            <p className="text-gray-600">
              {tab === "stderr" ? "No errors." : hasError ? "No stdout." : "Run code to see output."}
            </p>
          )
        )}
      </div>
    </section>
  );
}
