import { useState } from "react";
import { BrainInput } from "@/components/BrainInput";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { PeopleList } from "@/components/PeopleList";
import { Brain, Lightbulb, Calendar, Users, LogOut, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { signOut, user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"suggestions" | "events" | "people">("suggestions");
  const [searchQuery, setSearchQuery] = useState("");

  const handleInputProcessed = () => {
    setRefreshKey((k) => k + 1);
  };

  const tabs = [
    { id: "suggestions" as const, label: "Suggestions", icon: Lightbulb },
    { id: "events" as const, label: "Events", icon: Calendar },
    { id: "people" as const, label: "People", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Second Brain</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <BrainInput onInputProcessed={handleInputProcessed} />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, events, tasks..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="glass-card rounded-2xl p-6">
          {activeTab === "suggestions" && <SuggestionsPanel refreshKey={refreshKey} searchQuery={searchQuery} />}
          {activeTab === "events" && <UpcomingEvents refreshKey={refreshKey} searchQuery={searchQuery} />}
          {activeTab === "people" && <PeopleList refreshKey={refreshKey} searchQuery={searchQuery} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
