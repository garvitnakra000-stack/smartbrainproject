import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Trash2, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("upcoming");

  const fetchEvents = async () => {
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
      .from("events")
      .select("id, title, event_date, notes, status, created_at")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true, nullsFirst: false })
      .limit(30);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Events fetch error:", fetchError);
      setError(fetchError.message);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey, statusFilter]);

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete event");
      console.error(error);
    } else {
      toast.success("Event deleted!");
      fetchEvents();
    }
  };

  const filtered = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.title?.toLowerCase().includes(q) ||
      ev.notes?.toLowerCase().includes(q) ||
      ev.status?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const isSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm p-3 rounded-lg bg-destructive/10">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>Error loading events: {error}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["upcoming", "all", "past"].map((s) => (
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
          <p className="text-sm">No events yet</p>
          <p className="text-xs mt-1 opacity-60">Tell Second Brain about upcoming events in the chat</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                isOverdue(event.event_date)
                  ? "bg-destructive/10 text-destructive"
                  : isSoon(event.event_date)
                  ? "bg-warning/10 text-warning"
                  : "bg-primary/10 text-primary"
              }`}>
                <Calendar className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                {event.notes && (
                  <p className="text-xs text-muted-foreground truncate">{event.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {event.event_date && (
                  <span className={`text-xs whitespace-nowrap ${
                    isOverdue(event.event_date)
                      ? "text-destructive"
                      : isSoon(event.event_date)
                      ? "text-warning"
                      : "text-muted-foreground"
                  }`}>
                    {formatDate(event.event_date)}
                  </span>
                )}
                {isSoon(event.event_date) && !isOverdue(event.event_date) && (
                  <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">Soon</span>
                )}
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all"
                  title="Delete event"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
