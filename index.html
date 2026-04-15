import { useState, useEffect } from "react";
import { Brain, Sun, Moon, Palette } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrainInput } from "@/components/BrainInput";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { PeopleList } from "@/components/PeopleList";

const THEMES = [
  { id: "coral", label: "Coral Joy", primary: "#FF6B6B", secondary: "#FFE66D", bg: "#FFF9F9", dark: "#1a0a0a" },
  { id: "ocean", label: "Ocean Breeze", primary: "#4ECDC4", secondary: "#45B7D1", bg: "#F0FFFE", dark: "#0a1a1a" },
  { id: "lavender", label: "Lavender Dream", primary: "#A855F7", secondary: "#EC4899", bg: "#FAF5FF", dark: "#0f0a1a" },
  { id: "forest", label: "Forest Fresh", primary: "#22C55E", secondary: "#84CC16", bg: "#F0FDF4", dark: "#0a1a0f" },
  { id: "sunset", label: "Sunset Glow", primary: "#F97316", secondary: "#EAB308", bg: "#FFF7ED", dark: "#1a0f0a" },
  { id: "rose", label: "Rose Garden", primary: "#F43F5E", secondary: "#FB923C", bg: "#FFF1F2", dark: "#1a0a0f" },
];

export default function Index() {
  const { signOut, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"suggestions" | "events" | "people">("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState(() => localStorage.getItem("sb-theme") === "dark");
  const [themeId, setThemeId] = useState(() => localStorage.getItem("sb-color") || "coral");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-secondary", theme.secondary);
    root.style.setProperty("--theme-bg", isDark ? theme.dark : theme.bg);
    root.style.setProperty("--theme-surface", isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)");
    root.style.setProperty("--theme-border", isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)");
    root.style.setProperty("--theme-text", isDark ? "#f0f0f0" : "#1a1a2e");
    root.style.setProperty("--theme-muted", isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)");
    localStorage.setItem("sb-theme", isDark ? "dark" : "light");
    localStorage.setItem("sb-color", themeId);
  }, [isDark, themeId, theme]);

  const handleInputProcessed = () => setRefreshKey(k => k + 1);

  const tabs = [
    { id: "suggestions" as const, label: "Tasks", emoji: "✅" },
    { id: "events" as const, label: "Events", emoji: "📅" },
    { id: "people" as const, label: "People", emoji: "👥" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: `var(--theme-bg)`,
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      transition: "background 0.3s ease",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--theme-border)",
        background: "var(--theme-surface)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          {/* Logo */}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 15px ${theme.primary}40`,
          }}>
            <Brain size={20} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--theme-text)", letterSpacing: "-0.5px" }}>
              Second Brain
            </div>
            <div style={{ fontSize: 11, color: "var(--theme-muted)" }}>{user?.email}</div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme picker */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowThemePicker(!showThemePicker)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1px solid var(--theme-border)",
                  background: "var(--theme-surface)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--theme-muted)",
                  transition: "all 0.2s",
                }}
              >
                <Palette size={16} />
              </button>
              {showThemePicker && (
                <div style={{
                  position: "absolute", right: 0, top: 44,
                  background: isDark ? "#1a1a2e" : "white",
                  border: "1px solid var(--theme-border)",
                  borderRadius: 16,
                  padding: 16,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                  zIndex: 100,
                  width: 220,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--theme-muted)", marginBottom: 10, letterSpacing: 1 }}>
                    CHOOSE THEME
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setThemeId(t.id); setShowThemePicker(false); }}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: themeId === t.id ? `2px solid ${t.primary}` : "2px solid transparent",
                          background: isDark ? "rgba(255,255,255,0.05)" : t.bg,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 8,
                          transition: "all 0.2s",
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--theme-text)" }}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "1px solid var(--theme-border)",
                background: "var(--theme-surface)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--theme-muted)",
                transition: "all 0.2s",
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Sign out */}
            <button
              onClick={signOut}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid var(--theme-border)",
                background: "var(--theme-surface)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--theme-muted)",
                transition: "all 0.2s",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "24px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
        gap: 24,
        height: "calc(100vh - 64px)",
      }}
        className="main-grid"
      >
        {/* LEFT: Chat */}
        <div style={{
          background: "var(--theme-surface)",
          borderRadius: 24,
          border: "1px solid var(--theme-border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(20px)",
          boxShadow: `0 8px 32px ${theme.primary}15`,
        }}>
          <BrainInput onInputProcessed={handleInputProcessed} themeColor={theme.primary} isDark={isDark} />
        </div>

        {/* RIGHT: Tabs */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 16,
            }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search people, events, tasks..."
              style={{
                width: "100%",
                height: 44,
                paddingLeft: 42,
                paddingRight: 16,
                borderRadius: 14,
                border: "1px solid var(--theme-border)",
                background: "var(--theme-surface)",
                backdropFilter: "blur(20px)",
                color: "var(--theme-text)",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Tab bar */}
          <div style={{
            display: "flex",
            gap: 8,
            background: "var(--theme-surface)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: 6,
            border: "1px solid var(--theme-border)",
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                  background: activeTab === tab.id
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`
                    : "transparent",
                  color: activeTab === tab.id ? "white" : "var(--theme-muted)",
                  boxShadow: activeTab === tab.id ? `0 4px 15px ${theme.primary}40` : "none",
                }}
              >
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            flex: 1,
            background: "var(--theme-surface)",
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            border: "1px solid var(--theme-border)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: `0 8px 32px ${theme.primary}10`,
          }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {activeTab === "suggestions" && <SuggestionsPanel refreshKey={refreshKey} searchQuery={searchQuery} themeColor={theme.primary} isDark={isDark} />}
              {activeTab === "events" && <UpcomingEvents refreshKey={refreshKey} searchQuery={searchQuery} themeColor={theme.primary} isDark={isDark} />}
              {activeTab === "people" && <PeopleList refreshKey={refreshKey} searchQuery={searchQuery} themeColor={theme.primary} isDark={isDark} />}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--theme-border); border-radius: 4px; }
        input::placeholder { color: var(--theme-muted); }
        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
