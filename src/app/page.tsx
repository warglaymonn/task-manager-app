"use client";

import { useState, useEffect, useRef } from "react";

const PROJECT_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", dot: "bg-blue-500" },
  { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-300", dot: "bg-violet-500" },
  { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", dot: "bg-orange-500" },
  { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300", dot: "bg-rose-500" },
  { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300", dot: "bg-teal-500" },
] as const;

interface Project {
  id: string;
  name: string;
  colorIndex: number;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  projectId: string | null;
}

type BusyAction = { type: "toggle" | "delete"; id: string } | { type: "add" } | null;

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<BusyAction>(null);
  const [ready, setReady] = useState(false);
  const [addingProject, setAddingProject] = useState(false);
  const [projectInput, setProjectInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const storedProjects = localStorage.getItem("projects-v1");
      if (storedProjects) setProjects(JSON.parse(storedProjects));

      const storedTasks = localStorage.getItem("tasks-v2");
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        const v1 = localStorage.getItem("tasks-v1");
        if (v1) {
          const old = JSON.parse(v1) as Array<{ id: string; text: string; done: boolean }>;
          setTasks(old.map((t) => ({ ...t, projectId: null })));
        }
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("projects-v1", JSON.stringify(projects));
    localStorage.setItem("tasks-v2", JSON.stringify(tasks));
  }, [tasks, projects, ready]);

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  const addTask = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy({ type: "add" });
    await wait(350);
    setTasks((prev) => [
      { id: Date.now().toString(), text, done: false, projectId: selectedProjectId },
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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    setBusy(null);
  };

  const deleteTask = async (id: string) => {
    if (busy) return;
    setBusy({ type: "delete", id });
    await wait(350);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setBusy(null);
  };

  const addProject = () => {
    const name = projectInput.trim();
    if (!name) return;
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      colorIndex: projects.length % PROJECT_COLORS.length,
    };
    setProjects((prev) => [...prev, newProject]);
    setProjectInput("");
    setAddingProject(false);
    setSelectedProjectId(newProject.id);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)));
    if (selectedProjectId === id) setSelectedProjectId(null);
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

  const selectedProject =
    selectedProjectId !== null
      ? (projects.find((p) => p.id === selectedProjectId) ?? null)
      : null;
  const filteredTasks =
    selectedProjectId === null ? tasks : tasks.filter((t) => t.projectId === selectedProjectId);
  const doneCount = filteredTasks.filter((t) => t.done).length;
  const progressPercent =
    filteredTasks.length > 0 ? Math.round((doneCount / filteredTasks.length) * 100) : 0;
  const selectedColor = selectedProject
    ? PROJECT_COLORS[selectedProject.colorIndex % PROJECT_COLORS.length]
    : null;

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">
          やることリスト
        </h1>
        <p className="text-center text-slate-500 text-base mb-6">
          ブラウザを閉じてもデータは保存されます
        </p>

        {/* プロジェクトタブ */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedProjectId(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedProjectId === null
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              すべて
            </button>

            {projects.map((project) => {
              const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length];
              const ptasks = tasks.filter((t) => t.projectId === project.id);
              const pdone = ptasks.filter((t) => t.done).length;
              const isSelected = selectedProjectId === project.id;
              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    isSelected
                      ? `${color.bg} ${color.text} ${color.border}`
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                  {project.name}
                  {ptasks.length > 0 && (
                    <span className="text-xs opacity-60 ml-0.5">
                      {pdone}/{ptasks.length}
                    </span>
                  )}
                </button>
              );
            })}

            {addingProject ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={projectInput}
                  onChange={(e) => setProjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addProject();
                    if (e.key === "Escape") {
                      setAddingProject(false);
                      setProjectInput("");
                    }
                  }}
                  placeholder="プロジェクト名"
                  autoFocus
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addProject}
                  disabled={!projectInput.trim()}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setAddingProject(false);
                    setProjectInput("");
                  }}
                  className="px-2 py-1 border border-slate-200 text-slate-400 rounded-lg text-sm hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingProject(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-600 transition-colors"
              >
                <SmallPlusIcon />
                プロジェクト
              </button>
            )}
          </div>

          {/* 選択中プロジェクトの進捗バー */}
          {selectedProject && filteredTasks.length > 0 && (
            <div className="mt-3 px-1">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="font-medium">{selectedProject.name}</span>
                <span>
                  {doneCount} / {filteredTasks.length} 件完了 ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${selectedColor!.dot}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 追加フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={
              selectedProject
                ? `${selectedProject.name} にやることを追加…`
                : "やることを入力…"
            }
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
        {filteredTasks.length > 0 && (
          <p className="text-base text-slate-500 mb-3 text-right">
            {doneCount} / {filteredTasks.length} 件 完了
          </p>
        )}

        {/* リスト */}
        {!ready ? null : filteredTasks.length === 0 ? (
          <div className="text-center text-slate-400 text-lg py-16">
            やることはまだありません
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredTasks.map((task) => {
              const isToggling = isBusy({ type: "toggle", id: task.id });
              const isDeleting = isBusy({ type: "delete", id: task.id });
              const taskProject = task.projectId
                ? projects.find((p) => p.id === task.projectId)
                : null;
              const taskColor = taskProject
                ? PROJECT_COLORS[taskProject.colorIndex % PROJECT_COLORS.length]
                : null;
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

                  {/* テキスト + プロジェクトバッジ */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-lg leading-snug break-all ${
                        task.done ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {task.text}
                    </span>
                    {selectedProjectId === null && taskProject && taskColor && (
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${taskColor.bg} ${taskColor.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${taskColor.dot}`} />
                          {taskProject.name}
                        </span>
                      </div>
                    )}
                  </div>

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

        {/* 選択中プロジェクトの削除 */}
        {selectedProject && (
          <div className="mt-6 text-center">
            <button
              onClick={() => deleteProject(selectedProject.id)}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              「{selectedProject.name}」を削除する
            </button>
          </div>
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

function SmallPlusIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
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
