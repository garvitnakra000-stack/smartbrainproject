import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Check, Clock, Trash2, AlertCircle, Flag } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  created_at: string;
}

interface SuggestionsPanelProps {
  refreshKey: number;
  searchQuery: string;
}

export function SuggestionsPanel({ refreshKey, searchQuery }: SuggestionsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    let query = supabase
      .from("tasks")
      .select("id, title, notes, due_date, status, priority, created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (priorityFilter !== "all") {
      query = query.eq("priority", priorityFilter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Tasks fetch error:", fetchError);
      setError(fetchError.message);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshKey, priorityFilter]);

  const markDone = async (id: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update task");
      console.error(error);
    } else {
      toast.success("Marked as done! ✅");
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
    } else {
      toast.success("Deleted!");
      fetchTasks();
    }
  };

  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      t.priority?.toLowerCase().includes(q)
    );
  });

  const priorityConfig = {
    high: { color: "text-destructive", bg: "bg-destructive/10", label: "High" },
    medium: { color: "text-warning", bg: "bg-warning/10", label: "Medium" },
    low: { color: "text-muted-foreground", bg: "bg-muted", label: "Low" },
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Error loading tasks: {error}</span>
      </div>
    );
  }

  // Group by priority for better UX
  const highPriority = filtered.filter(t => t.priority === "high");
  const otherPriority = filtered.filter(t => t.priority !== "high");
  const sortedFiltered = [...highPriority, ...otherPriority];

  return (
    <div>
      {/* Priority filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "high", "medium", "low"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setPriorityFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              priorityFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* High priority alert banner */}
      {priorityFilter === "all" && highPriority.length > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 shrink-0" />
          <span>{highPriority.length} high-priority task{highPriority.length > 1 ? "s" : ""} need attention</span>
        </div>
      )}

      {sortedFiltered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No pending tasks</p>
          <p className="text-xs mt-1 opacity-60">Second Brain will suggest tasks based on your conversations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedFiltered.map((task) => {
            const pConfig = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
            const overdue = isOverdue(task.due_date);

            return (
              <div
                key={task.id}
                className={`glass-card rounded-xl p-4 flex items-start gap-3 group hover:shadow-md transition-shadow ${
                  task.priority === "high" ? "border border-destructive/20" : ""
                }`}
              >
                {/* Priority indicator */}
                <div className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center shrink-0 ${pConfig.bg} ${pConfig.color}`}>
                  <Lightbulb className="h-3 w-3" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.notes}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Priority badge */}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${pConfig.bg} ${pConfig.color}`}>
                      {pConfig.label}
                    </span>
                    {/* Due date */}
                    {task.due_date && (
                      <div className={`flex items-center gap-1 text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" />
                        <span>{overdue ? "Overdue · " : ""}{formatDate(task.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <button
                    onClick={() => markDone(task.id)}
                    className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"
                    title="Mark complete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
