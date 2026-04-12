import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Check, Clock, Phone, Gift } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  person_name: string;
  description: string;
  suggested_action: string;
  due_date: string | null;
  status: string;
  source: string;
  created_at: string;
}

const iconMap: Record<string, typeof Gift> = {
  birthday_reminder: Gift,
  missed_call: Phone,
};

interface SuggestionsPanelProps {
  refreshKey: number;
  searchQuery: string;
}

export function SuggestionsPanel({ refreshKey, searchQuery }: SuggestionsPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "birthday_reminder" | "missed_call" | "follow_up">("all");

  const fetchTasks = async () => {
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("status", "pending")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("source", filter);
    }

    const { data } = await query;
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshKey, filter]);

  const markDone = async (id: string) => {
    await supabase.from("tasks").update({ status: "done" }).eq("id", id);
    toast.success("Marked as done!");
    fetchTasks();
  };

  const filtered = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.description?.toLowerCase().includes(q) ||
      t.person_name?.toLowerCase().includes(q) ||
      t.source?.toLowerCase().includes(q)
    );
  });

  const getIcon = (source: string | null) => iconMap[source || ""] || Lightbulb;
  const getIconColor = (source: string | null) => {
    if (source === "birthday_reminder") return "text-warning";
    if (source === "missed_call") return "text-destructive";
    return "text-suggestion";
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

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["all", "birthday_reminder", "missed_call", "follow_up"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Lightbulb className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No suggestions yet. Start adding information!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task) => {
            const Icon = getIcon(task.source);
            return (
              <div
                key={task.id}
                className="glass-card rounded-xl p-4 flex items-start gap-3 group hover:shadow-md transition-shadow"
              >
                <div className={`mt-0.5 ${getIconColor(task.source)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.description}</p>
                  {task.due_date && (
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => markDone(task.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-all"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
