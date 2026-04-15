import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  title: string;
  event_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface UpcomingEventsProps {
  refreshKey: number;
  searchQuery: string;
}

export function UpcomingEvents({ refreshKey, searchQuery }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");

  const fetchEvents = async () => {
    let query = supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true, nullsFirst: false })
      .limit(30);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setEvents((data as Event[]) || []);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey, statusFilter]);

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted!");
    fetchEvents();
  };

  const markComplete = async (id: string) => {
    await supabase.from("events").update({ status: "completed" }).eq("id", id);
    toast.success("Marked as complete!");
    fetchEvents();
  };

  const filtered = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(q) ||
      ev.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["upcoming", "completed", "obsolete", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events yet. Tell me about upcoming plans!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                {event.notes && (
                  <p className="text-xs text-muted-foreground truncate">{event.notes}</p>
                )}
              </div>
              {event.event_date && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(event.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {event.status === "upcoming" && (
                  <button
                    onClick={() => markComplete(event.id)}
                    className="h-8 w-8 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"
                    title="Mark complete"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteEvent(event.id)}
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
