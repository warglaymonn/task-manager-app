"use client";

import { useState, useEffect, useRef } from "react";

interface Task {
  id: string;
  text: string;
  done: boolean;
}

type BusyAction = { type: "toggle" | "delete"; id: string } | { type: "add" } | null;

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tasks-v1");
      if (stored) setTasks(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("tasks-v1", JSON.stringify(tasks));
  }, [tasks, ready]);

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const addTask = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy({ type: "add" });
    await wait(350);
    setTasks((prev) => [
      { id: Date.now().toString(), text, done: false },
      ...prev,
    ]);
    setInput("");
    setBusy(null);
    inputRef.current?.focus();
  };

  const toggleTask = async (id: string) => {
    if (busy) return;
    setBusy({ type: "toggle", id });
    await wait(250);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
    setBusy(null);
  };

  const deleteTask = async (id: string) => {
    if (busy) return;
    setBusy({ type: "delete", id });
    await wait(350);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setBusy(null);
  };

  const isBusy = (action: BusyAction) => {
    if (!busy) return false;
    if (busy.type === "add" && action?.type === "add") return true;
    if (
      (busy.type === "toggle" || busy.type === "delete") &&
      action &&
      (action.type === "toggle" || action.type === "delete") &&
      "id" in busy &&
      "id" in action
    )
      return busy.id === action.id && busy.type === action.type;
    return false;
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">
          やることリスト
        </h1>
        <p className="text-center text-slate-500 text-base mb-8">
          ブラウザを閉じてもデータは保存されます
        </p>

        {/* 追加フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="やることを入力..."
            disabled={!!busy}
            className="flex-1 border border-slate-300 rounded-xl px-4 text-lg min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <button
            onClick={addTask}
            disabled={!input.trim() || !!busy}
            aria-label="追加する"
            className="min-h-[44px] min-w-[44px] px-5 bg-blue-600 text-white rounded-xl font-semibold text-base flex items-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
          >
            {isBusy({ type: "add" }) ? (
              <>
                <SpinIcon />
                <span>追加中…</span>
              </>
            ) : (
              <>
                <PlusIcon />
                <span>追加</span>
              </>
            )}
          </button>
        </div>

        {/* カウント */}
        {tasks.length > 0 && (
          <p className="text-base text-slate-500 mb-3 text-right">
            {doneCount} / {tasks.length} 件 完了
          </p>
        )}

        {/* リスト */}
        {!ready ? null : tasks.length === 0 ? (
          <div className="text-center text-slate-400 text-lg py-16">
            やることはまだありません
          </div>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => {
              const isToggling = isBusy({ type: "toggle", id: task.id });
              const isDeleting = isBusy({ type: "delete", id: task.id });
              return (
                <li
                  key={task.id}
                  className={`flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm transition-opacity ${
                    isDeleting ? "opacity-40" : ""
                  }`}
                >
                  {/* 完了ボタン */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    disabled={!!busy}
                    aria-label={task.done ? "未完了に戻す" : "完了にする"}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border-2 text-xl flex-shrink-0 transition-transform active:scale-90 disabled:cursor-not-allowed ${
                      task.done
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isToggling ? (
                      <SpinIcon className="text-slate-400" />
                    ) : task.done ? (
                      <CheckIcon className="text-emerald-600" />
                    ) : (
                      <CircleIcon className="text-slate-300" />
                    )}
                  </button>

                  {/* テキスト */}
                  <span
                    className={`flex-1 text-lg leading-snug break-all ${
                      task.done ? "line-through text-slate-400" : "text-slate-800"
                    }`}
                  >
                    {task.text}
                  </span>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    disabled={!!busy}
                    aria-label="削除する"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 rounded-lg border border-slate-200 text-slate-500 text-sm font-medium flex-shrink-0 transition-transform active:scale-90 disabled:cursor-not-allowed hover:border-red-300 hover:text-red-500"
                  >
                    {isDeleting ? (
                      <SpinIcon />
                    ) : (
                      <>
                        <TrashIcon />
                        <span className="sr-only">削除</span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function SpinIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin w-5 h-5 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-5 h-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
