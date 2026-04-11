import { useState } from "react";
import { Send, Brain, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const EXAMPLES = [
  "Rohit likes Dairy Milk",
  "Rohit's birthday is 15 April",
  "Spoke to Ankit about invoice delay",
  "Missed call from Priya",
];

interface BrainInputProps {
  onInputProcessed: () => void;
}

export function BrainInput({ onInputProcessed }: BrainInputProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-input", {
        body: { text: input.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Got it! Information stored.", {
        description: `Understood: ${data.parsed?.context || input}`,
      });
      setInput("");
      onInputProcessed();
    } catch (e: any) {
      toast.error("Failed to process", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">What's on your mind?</h2>
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Tell me something... e.g. 'Rohit likes Dairy Milk'"
          disabled={loading}
          className="w-full h-14 pl-5 pr-14 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-base shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setInput(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
