import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, ChevronRight, X } from "lucide-react";

interface Person {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

interface PeopleListProps {
  refreshKey: number;
  searchQuery: string;
}

export function PeopleList({ refreshKey, searchQuery }: PeopleListProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);

  useEffect(() => {
    const fetchPeople = async () => {
      const { data } = await supabase
        .from("people")
        .select("*")
        .order("created_at", { ascending: false });
      setPeople((data as Person[]) || []);
    };
    fetchPeople();
  }, [refreshKey]);

  const filtered = people.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  });

  if (selected) {
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

        {selected.notes ? (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-sm text-foreground whitespace-pre-line bg-muted/50 rounded-lg p-3">
              {selected.notes}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        )}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{searchQuery ? "No people match your search" : "No people yet. Start chatting!"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((person) => (
        <button
          key={person.id}
          onClick={() => setSelected(person)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {person.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{person.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {person.notes || "No notes yet"}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}
