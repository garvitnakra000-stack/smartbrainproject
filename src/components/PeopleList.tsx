import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, ChevronRight, Heart, X, Clock } from "lucide-react";

interface Person {
  id: string;
  name: string;
  attributes: { likes?: string[] } | null;
  notes: string | null;
  created_at: string;
  last_interaction_at: string | null;
}

interface PersonEvent {
  id: string;
  type: string;
  date: string | null;
  context: string;
  created_at: string;
}

interface PeopleListProps {
  refreshKey: number;
  searchQuery: string;
}

export function PeopleList({ refreshKey, searchQuery }: PeopleListProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [events, setEvents] = useState<PersonEvent[]>([]);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await supabase
        .from("people")
        .select("*")
        .order("last_interaction_at", { ascending: false, nullsFirst: false });
      setPeople((data as unknown as Person[]) || []);
    };
    fetchPeople();
  }, [refreshKey]);

  const selectPerson = async (person: Person) => {
    setSelected(person);
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("person_id", person.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setEvents(data || []);
  };

  const filtered = people.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.attributes?.likes || []).some((l) => l.toLowerCase().includes(q))
    );
  });

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (selected) {
    const likes = selected.attributes?.likes || [];
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <X className="h-4 w-4" /> Back to people
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
            {selected.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Added {new Date(selected.created_at).toLocaleDateString()}</span>
              {selected.last_interaction_at && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last interaction {formatRelativeTime(selected.last_interaction_at)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {likes.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {likes.map((like) => (
                <span key={like} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                  <Heart className="h-3 w-3" /> {like}
                </span>
              ))}
            </div>
          </div>
        )}

        {selected.notes && (
          <div className="mb-5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-sm text-foreground whitespace-pre-line bg-muted/50 rounded-lg p-3">{selected.notes}</p>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">History</h4>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events recorded</p>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="text-sm p-3 rounded-lg bg-muted/30">
                  <span className="font-medium capitalize">{ev.type}</span>
                  {ev.date && <span className="text-muted-foreground"> · {new Date(ev.date).toLocaleDateString()}</span>}
                  <p className="text-muted-foreground mt-0.5">{ev.context}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{searchQuery ? "No people match your search" : "No people yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((person) => (
        <button
          key={person.id}
          onClick={() => selectPerson(person)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {person.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{person.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {(person.attributes?.likes || []).join(", ") || "No preferences yet"}
            </p>
          </div>
          <div className="text-right">
            {person.last_interaction_at && (
              <p className="text-xs text-muted-foreground">{formatRelativeTime(person.last_interaction_at)}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
