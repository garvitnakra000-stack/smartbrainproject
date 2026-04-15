import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Check, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
}

interface SuggestionsPanelProps {
  refreshKey: number;
  searchQuery: string;
}

export function SuggestionsPanel({ refreshKey, searchQuery }: SuggestionsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "completed" | "all">("pending");

  const fetchTasks = async () => {
    let query = supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setTasks((data as Task[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshKey, filter]);

  const markDone = async (id: string) => {
    await supabase.from("tasks").update({ status: "completed" }).eq("id", id);
    toast.success("Marked as done!");
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    toast.success("Deleted!");
    fetchTasks();
  };

  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["pending", "completed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No tasks yet. Tell me what you need to do!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="glass-card rounded-xl p-4 flex items-start gap-3 group hover:shadow-md transition-shadow"
            >
              <div className="mt-0.5 text-primary">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                {task.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{task.notes}</p>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {task.status === "pending" && (
                  <button
                    onClick={() => markDone(task.id)}
                    className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"
                    title="Mark complete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
