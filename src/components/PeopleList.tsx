import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, X, Edit3, Check, Users } from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: string;
  name: string;
  notes: string | null;
  relationship: string | null;
  created_at: string;
}

interface PeopleListProps {
  refreshKey: number;
  searchQuery: string;
  themeColor: string;
  isDark: boolean;
}

const RELATIONSHIPS = ["Friend", "Family", "Colleague", "Client", "Partner", "Other"];

const RELATIONSHIP_EMOJI: Record<string, string> = {
  Friend: "👫", Family: "👨‍👩‍👧", Colleague: "💼", Client: "🤝", Partner: "💑", Other: "👤",
};

export function PeopleList({ refreshKey, searchQuery, themeColor, isDark }: PeopleListProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "white";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    fetchPeople();
  }, [refreshKey]);

  const fetchPeople = async () => {
    const { data } = await supabase
      .from("people")
      .select("*")
      .order("created_at", { ascending: false });
    setPeople((data as Person[]) || []);
  };

  const saveEdits = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("people")
      .update({ notes: editNotes, relationship: editRelationship, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Updated! ✨");
      setSelected({ ...selected, notes: editNotes, relationship: editRelationship });
      setEditing(false);
      fetchPeople();
    }
    setSaving(false);
  };

  const filtered = people.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.notes?.toLowerCase().includes(q) || p.relationship?.toLowerCase().includes(q);
  });

  if (selected) {
    const emoji = RELATIONSHIP_EMOJI[selected.relationship || ""] || "👤";
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setEditing(false); }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "var(--theme-muted)",
            background: "none", border: "none", cursor: "pointer",
            marginBottom: 20, fontFamily: "inherit", padding: 0,
          }}
        >
          <X size={14} /> Back to people
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 20,
            background: `linear-gradient(135deg, ${themeColor}30, ${themeColor}15)`,
            border: `2px solid ${themeColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>
            {selected.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--theme-text)" }}>
              {selected.name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: "3px 10px", borderRadius: 20,
                background: `${themeColor}20`, color: themeColor,
              }}>
                {emoji} {selected.relationship || "Unknown"}
              </span>
              <span style={{ fontSize: 11, color: "var(--theme-muted)" }}>
                · Added {new Date(selected.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => { setEditing(!editing); setEditNotes(selected.notes || ""); setEditRelationship(selected.relationship || ""); }}
            style={{
              width: 36, height: 36, borderRadius: 12,
              border: `1px solid ${borderColor}`,
              background: cardBg, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: editing ? themeColor : "var(--theme-muted)",
            }}
          >
            <Edit3 size={14} />
          </button>
        </div>

        {editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-muted)", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
                RELATIONSHIP
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {RELATIONSHIPS.map(r => (
                  <button
                    key={r}
                    onClick={() => setEditRelationship(r)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                      border: editRelationship === r ? `2px solid ${themeColor}` : `1px solid ${borderColor}`,
                      background: editRelationship === r ? `${themeColor}20` : cardBg,
                      color: editRelationship === r ? themeColor : "var(--theme-muted)",
                      fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    {RELATIONSHIP_EMOJI[r]} {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-muted)", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>
                NOTES
              </label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 14,
                  border: `1.5px solid ${themeColor}60`,
                  background: isDark ? "rgba(255,255,255,0.05)" : "white",
                  color: "var(--theme-text)", fontSize: 14, fontFamily: "inherit",
                  outline: "none", resize: "vertical", lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={saveEdits}
                disabled={saving}
                style={{
                  flex: 1, padding: "10px", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                  color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Check size={14} /> {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: "10px 20px", borderRadius: 12,
                  border: `1px solid ${borderColor}`, background: cardBg,
                  color: "var(--theme-muted)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-muted)", letterSpacing: 0.8, display: "block", marginBottom: 10 }}>
              NOTES & MEMORY
            </label>
            <div style={{
              padding: "16px", borderRadius: 14,
              background: isDark ? "rgba(255,255,255,0.04)" : `${themeColor}08`,
              border: `1px solid ${themeColor}20`,
              fontSize: 14, color: "var(--theme-text)", lineHeight: 1.7,
              whiteSpace: "pre-line",
            }}>
              {selected.notes || (
                <span style={{ color: "var(--theme-muted)", fontStyle: "italic" }}>
                  No notes yet. Chat about {selected.name} to add memories!
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditing(true); setEditNotes(selected.notes || ""); setEditRelationship(selected.relationship || ""); }}
              style={{
                marginTop: 12, width: "100%", padding: "10px", borderRadius: 12,
                border: `1px dashed ${themeColor}60`,
                background: "transparent", color: themeColor,
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✏️ Edit notes
            </button>
          </div>
        )}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--theme-muted)" }}>
        <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: 14 }}>
          {searchQuery ? "No people match your search" : "No people yet. Start chatting about people in your life!"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {filtered.map(person => {
        const emoji = RELATIONSHIP_EMOJI[person.relationship || ""] || "👤";
        return (
          <button
            key={person.id}
            onClick={() => setSelected(person)}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 16, width: "100%", textAlign: "left",
              border: `1px solid ${borderColor}`, background: cardBg,
              cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = themeColor + "50";
              (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.08)" : `${themeColor}08`;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = borderColor;
              (e.currentTarget as HTMLElement).style.background = cardBg;
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${themeColor}25, ${themeColor}10)`,
              border: `1.5px solid ${themeColor}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 800, color: themeColor,
            }}>
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--theme-text)" }}>{person.name}</div>
              <div style={{ fontSize: 11, color: "var(--theme-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {emoji} {person.relationship || "Unknown"} · {person.notes?.slice(0, 40) || "No notes yet"}
                {(person.notes?.length || 0) > 40 ? "..." : ""}
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--theme-muted)", flexShrink: 0 }} />
          </button>
        );
      })}
    </div>
  );
}
