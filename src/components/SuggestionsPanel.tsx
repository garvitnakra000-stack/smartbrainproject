import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Trash2, Edit3, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  status: string;
  priority: string | null;
  created_at: string;
}

interface SuggestionsPanelProps {
  refreshKey: number;
  searchQuery: string;
  themeColor: string;
  isDark: boolean;
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  high: { color: "#ef4444", label: "High", emoji: "🔴" },
  medium: { color: "#f97316", label: "Medium", emoji: "🟡" },
  low: { color: "#22c55e", label: "Low", emoji: "🟢" },
};

export function SuggestionsPanel({ refreshKey, searchQuery, themeColor, isDark }: SuggestionsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDueDate, setEditDueDate] = useState("");

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "white";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => { fetchTasks(); }, [refreshKey, filter]);
  // Add this inside SuggestionsPanel, after the existing useEffect
useEffect(() => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      () => {
        fetchTasks(); // re-fetch whenever any task row changes
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [filter]); // re-subscribe if filter changes
  
  const fetchTasks = async () => {
    let query = supabase.from("tasks").select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  const markDone = async (id: string) => {
    await supabase.from("tasks").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Done! 🎉");
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Deleted!");
    fetchTasks();
  };

  const saveEdit = async (id: string) => {
    await supabase.from("tasks").update({
      title: editTitle, notes: editNotes, priority: editPriority,
      due_date: editDueDate || null, updated_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success("Updated! ✨");
    setEditing(null);
    fetchTasks();
  };

  const filtered = tasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q);
  });

  // Group by priority
  const high = filtered.filter(t => t.priority === "high");
  const medium = filtered.filter(t => t.priority === "medium" || !t.priority);
  const low = filtered.filter(t => t.priority === "low");
  const grouped = [...high, ...medium, ...low];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 72, borderRadius: 14, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", animation: "pulse 1.5s ease infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["pending", "completed", "all"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
            background: filter === f ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
            color: filter === f ? "white" : "var(--theme-muted)",
            fontSize: 12, fontWeight: 700, fontFamily: "inherit",
            boxShadow: filter === f ? `0 3px 10px ${themeColor}40` : "none",
            transition: "all 0.2s",
          }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--theme-muted)" }}>
          <Lightbulb size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 14 }}>No tasks yet. Tell me what you need to do!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grouped.map(task => {
            const priority = PRIORITY_CONFIG[task.priority || "medium"];
            return (
              <div key={task.id} style={{
                borderRadius: 16, border: `1px solid ${borderColor}`,
                background: cardBg, overflow: "hidden",
                borderLeft: `3px solid ${priority.color}`,
                transition: "all 0.2s",
              }}>
                {editing === task.id ? (
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                      placeholder="Task title"
                      style={{
                        padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                        background: isDark ? "rgba(255,255,255,0.05)" : "white",
                        color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none",
                      }}
                    />
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notes..." rows={2}
                      style={{
                        padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                        background: isDark ? "rgba(255,255,255,0.05)" : "white",
                        color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      {["high", "medium", "low"].map(p => (
                        <button key={p} onClick={() => setEditPriority(p)} style={{
                          flex: 1, padding: "6px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: editPriority === p ? PRIORITY_CONFIG[p].color : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                          color: editPriority === p ? "white" : "var(--theme-muted)",
                          fontSize: 11, fontWeight: 700, fontFamily: "inherit",
                        }}>
                          {PRIORITY_CONFIG[p].emoji} {PRIORITY_CONFIG[p].label}
                        </button>
                      ))}
                    </div>
                    <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                      style={{
                        padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                        background: isDark ? "rgba(255,255,255,0.05)" : "white",
                        color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none",
                      }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => saveEdit(task.id)} style={{
                        flex: 1, padding: "8px", borderRadius: 10, border: "none",
                        background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                        color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                      }}>Save</button>
                      <button onClick={() => setEditing(null)} style={{
                        padding: "8px 16px", borderRadius: 10, border: `1px solid ${borderColor}`,
                        background: cardBg, color: "var(--theme-muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                      }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${priority.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16,
                    }}>
                      {priority.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: 14, color: "var(--theme-text)",
                        textDecoration: task.status === "completed" ? "line-through" : "none",
                        opacity: task.status === "completed" ? 0.6 : 1,
                      }}>
                        {task.title}
                      </div>
                      {task.notes && (
                        <div style={{ fontSize: 12, color: "var(--theme-muted)", marginTop: 3, lineHeight: 1.4 }}>
                          {task.notes}
                        </div>
                      )}
                      {task.due_date && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                            background: `${themeColor}15`, color: themeColor,
                          }}>
                            📅 {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      {task.status === "pending" && (
                        <button onClick={() => markDone(task.id)} title="Mark done" style={{
                          width: 30, height: 30, borderRadius: 9, border: "none",
                          background: "rgba(34,197,94,0.15)", color: "#22c55e",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={13} />
                        </button>
                      )}
                      <button onClick={() => { setEditing(task.id); setEditTitle(task.title); setEditNotes(task.notes || ""); setEditPriority(task.priority || "medium"); setEditDueDate(task.due_date?.split("T")[0] || ""); }}
                        title="Edit" style={{
                          width: 30, height: 30, borderRadius: 9, border: "none",
                          background: `${themeColor}15`, color: themeColor,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        <Edit3 size={13} />
                      </button>
                      <button onClick={() => deleteTask(task.id)} title="Delete" style={{
                        width: 30, height: 30, borderRadius: 9, border: "none",
                        background: "rgba(239,68,68,0.1)", color: "#ef4444",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
