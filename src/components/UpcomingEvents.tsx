import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Cake, Phone, Users } from "lucide-react";

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
}

export function UpcomingEvents({ refreshKey }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true, nullsFirst: false })
        .limit(10);
      setEvents(data || []);
    };
    fetch();
  }, [refreshKey]);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((event) => {
        const Icon = typeIcons[event.type] || Calendar;
        return (
          <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
          </div>
        );
      })}
    </div>
  );
}
