import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Check, Edit3, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
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
  themeColor: string;
  isDark: boolean;
}

export function UpcomingEvents({ refreshKey, searchQuery, themeColor, isDark }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date());
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "white";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => { fetchEvents(); }, [refreshKey, statusFilter]);
  useEffect(() => {
  const channel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      () => {
        fetchEvents();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [statusFilter]);
  const fetchEvents = async () => {
    let query = supabase.from("events").select("*")
      .order("event_date", { ascending: true, nullsFirst: false }).limit(60);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    const { data } = await query;
    setEvents((data as Event[]) || []);
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event deleted!");
    fetchEvents();
  };

  const markComplete = async (id: string) => {
    await supabase.from("events").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marked complete! 🎉");
    fetchEvents();
  };

  const saveEdit = async (id: string) => {
    await supabase.from("events").update({
      title: editTitle,
      event_date: editDate || null,
      notes: editNotes,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success("Updated! ✨");
    setEditing(null);
    fetchEvents();
  };

  const filtered = events.filter(ev => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return ev.title?.toLowerCase().includes(q) || ev.notes?.toLowerCase().includes(q);
  });

  // Calendar helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const eventsOnDay = (day: number) => filtered.filter(ev => {
    if (!ev.event_date) return false;
    const d = new Date(ev.event_date);
    return d.getFullYear() === calMonth.getFullYear() && d.getMonth() === calMonth.getMonth() && d.getDate() === day;
  });

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {["upcoming", "completed", "all"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: statusFilter === s ? `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
              color: statusFilter === s ? "white" : "var(--theme-muted)",
              fontSize: 12, fontWeight: 700, fontFamily: "inherit",
              boxShadow: statusFilter === s ? `0 3px 10px ${themeColor}40` : "none",
              transition: "all 0.2s",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div style={{
          display: "flex", borderRadius: 12, overflow: "hidden",
          border: `1px solid ${borderColor}`,
        }}>
          {[["list", <List size={13} />], ["calendar", <Calendar size={13} />]].map(([mode, icon]) => (
            <button key={mode as string} onClick={() => setViewMode(mode as "list" | "calendar")} style={{
              padding: "7px 12px", border: "none", cursor: "pointer",
              background: viewMode === mode ? themeColor : "transparent",
              color: viewMode === mode ? "white" : "var(--theme-muted)",
              transition: "all 0.2s", display: "flex", alignItems: "center",
            }}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--theme-muted)", padding: 4 }}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--theme-text)" }}>
              {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
            </span>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--theme-muted)", padding: 4 }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--theme-muted)", padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
            {Array.from({ length: firstDayOfMonth(calMonth) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(calMonth) }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsOnDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth.getMonth() && new Date().getFullYear() === calMonth.getFullYear();
              return (
                <div key={day} style={{
                  minHeight: 44, borderRadius: 10, padding: "4px 6px",
                  background: isToday ? `${themeColor}20` : dayEvents.length > 0 ? `${themeColor}10` : isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  border: isToday ? `2px solid ${themeColor}` : `1px solid ${borderColor}`,
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? themeColor : "var(--theme-text)" }}>
                    {day}
                  </span>
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} style={{
                      fontSize: 9, fontWeight: 700,
                      padding: "2px 5px", borderRadius: 6,
                      background: themeColor, color: "white",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div style={{ fontSize: 9, color: themeColor, fontWeight: 700 }}>+{dayEvents.length - 2}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--theme-muted)" }}>
              <Calendar size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No events yet. Tell me about upcoming plans!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(event => (
                <div key={event.id} style={{
                  borderRadius: 16, border: `1px solid ${borderColor}`,
                  background: cardBg, overflow: "hidden", transition: "all 0.2s",
                }}>
                  {editing === event.id ? (
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        placeholder="Event title"
                        style={{
                          padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                          background: isDark ? "rgba(255,255,255,0.05)" : "white",
                          color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none",
                        }}
                      />
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                        style={{
                          padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                          background: isDark ? "rgba(255,255,255,0.05)" : "white",
                          color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none",
                        }}
                      />
                      <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                        placeholder="Notes..." rows={2}
                        style={{
                          padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${themeColor}60`,
                          background: isDark ? "rgba(255,255,255,0.05)" : "white",
                          color: "var(--theme-text)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "none",
                        }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => saveEdit(event.id)} style={{
                          flex: 1, padding: "8px", borderRadius: 10, border: "none",
                          background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                          color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                        }}>Save</button>
                        <button onClick={() => setEditing(null)} style={{
                          padding: "8px 16px", borderRadius: 10, border: `1px solid ${borderColor}`,
                          background: cardBg, color: "var(--theme-muted)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}
                      className="event-row"
                    >
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: event.status === "completed" ? "rgba(34,197,94,0.15)" : `${themeColor}15`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        border: `1px solid ${event.status === "completed" ? "rgba(34,197,94,0.3)" : themeColor + "30"}`,
                      }}>
                        {event.event_date ? (
                          <>
                            <span style={{ fontSize: 14, fontWeight: 800, color: event.status === "completed" ? "#22c55e" : themeColor, lineHeight: 1 }}>
                              {new Date(event.event_date).getDate()}
                            </span>
                            <span style={{ fontSize: 9, fontWeight: 600, color: "var(--theme-muted)", textTransform: "uppercase" }}>
                              {new Date(event.event_date).toLocaleString("default", { month: "short" })}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: 18 }}>📅</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 14, color: "var(--theme-text)",
                          textDecoration: event.status === "completed" ? "line-through" : "none",
                          opacity: event.status === "completed" ? 0.6 : 1,
                        }}>
                          {event.title}
                        </div>
                        {event.notes && (
                          <div style={{ fontSize: 12, color: "var(--theme-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {event.notes}
                          </div>
                        )}
                        {event.status !== "upcoming" && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 8,
                            background: event.status === "completed" ? "rgba(34,197,94,0.15)" : "rgba(156,163,175,0.2)",
                            color: event.status === "completed" ? "#22c55e" : "var(--theme-muted)",
                            marginTop: 4, display: "inline-block",
                          }}>
                            {event.status}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6 }} className="event-actions">
                        {event.status === "upcoming" && (
                          <button onClick={() => markComplete(event.id)} title="Mark complete" style={{
                            width: 30, height: 30, borderRadius: 9, border: "none",
                            background: "rgba(34,197,94,0.15)", color: "#22c55e",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Check size={13} />
                          </button>
                        )}
                        <button onClick={() => { setEditing(event.id); setEditTitle(event.title); setEditDate(event.event_date?.split("T")[0] || ""); setEditNotes(event.notes || ""); }}
                          title="Edit" style={{
                            width: 30, height: 30, borderRadius: 9, border: "none",
                            background: `${themeColor}15`, color: themeColor,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => deleteEvent(event.id)} title="Delete" style={{
                          width: 30, height: 30, borderRadius: 9, border: "none",
                          background: "rgba(239,68,68,0.1)", color: "#ef4444",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
