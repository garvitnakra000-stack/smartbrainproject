import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Cake, Phone, Users, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: string;
  type: string;
  person_name: string;
  date: string | null;
  context: string;
  created_at: string;
}

const typeIcons: Record<string, typeof Calendar> = {
  birthday: Cake,
  meeting: Users,
  call: Phone,
  missed_call: Phone,
};

interface UpcomingEventsProps {
  refreshKey: number;
  searchQuery: string;
}

export function UpcomingEvents({ refreshKey, searchQuery }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchEvents = async () => {
    let query = supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true, nullsFirst: false })
      .limit(30);

    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    const { data } = await query;
    setEvents(data || []);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey, typeFilter]);

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted!");
    fetchEvents();
  };

  const filtered = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.person_name?.toLowerCase().includes(q) ||
      ev.context?.toLowerCase().includes(q) ||
      ev.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["all", "birthday", "meeting", "call", "missed_call"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const Icon = typeIcons[event.type] || Calendar;
            return (
              <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.person_name} — {event.type}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{event.context}</p>
                </div>
                {event.date && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all"
                  title="Delete event"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
