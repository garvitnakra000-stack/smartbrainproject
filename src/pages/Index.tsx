import { useState } from "react";
import { BrainInput } from "@/components/BrainInput";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { PeopleList } from "@/components/PeopleList";
import { Brain, Lightbulb, Calendar, Users } from "lucide-react";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"suggestions" | "events" | "people">("suggestions");

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
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Second Brain</h1>
            <p className="text-xs text-muted-foreground">Your AI-powered memory assistant</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Input */}
        <BrainInput onInputProcessed={handleInputProcessed} />

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

        {/* Content */}
        <div className="glass-card rounded-2xl p-6">
          {activeTab === "suggestions" && <SuggestionsPanel refreshKey={refreshKey} />}
          {activeTab === "events" && <UpcomingEvents refreshKey={refreshKey} />}
          {activeTab === "people" && <PeopleList refreshKey={refreshKey} />}
        </div>
      </main>
    </div>
  );
};

export default Index;
