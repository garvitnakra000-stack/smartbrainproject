import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, ChevronRight, Heart, X } from "lucide-react";

interface Person {
  id: string;
  name: string;
  attributes: { likes?: string[] };
  notes: string | null;
  created_at: string;
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
}

export function PeopleList({ refreshKey }: PeopleListProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [events, setEvents] = useState<PersonEvent[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("people")
        .select("*")
        .order("updated_at", { ascending: false });
      setPeople(data || []);
    };
    fetch();
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
            <p className="text-xs text-muted-foreground">
              Added {new Date(selected.created_at).toLocaleDateString()}
            </p>
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

  if (people.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No people yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {people.map((person) => (
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
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
