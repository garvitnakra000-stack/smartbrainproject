import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from JWT
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create user-context client to get user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a personal assistant parser. Today's date is ${today}. Extract structured data from user input. Return JSON with these fields:
- person_name: string (the person mentioned)
- event_type: string | null (one of: "birthday", "meeting", "call", "missed_call", "interaction", or null)
- date: string | null (ISO date format YYYY-MM-DD, infer year if not given - use current or next occurrence)
- preferences: string[] (things the person likes/dislikes)
- context: string (what happened or was discussed)
- intent: string (one of: "remember_preference", "log_event", "log_interaction", "set_reminder")
- suggested_task: string | null (a follow-up action if appropriate)
- task_due_date: string | null (when the task should be done, ISO date)

Be smart about dates. If someone says "birthday is 15 April", use the next occurrence. If they say "missed call", suggest calling back.`,
          },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_input",
              description: "Parse user input into structured personal data",
              parameters: {
                type: "object",
                properties: {
                  person_name: { type: "string" },
                  event_type: { type: "string", nullable: true },
                  date: { type: "string", nullable: true },
                  preferences: { type: "array", items: { type: "string" } },
                  context: { type: "string" },
                  intent: { type: "string" },
                  suggested_task: { type: "string", nullable: true },
                  task_due_date: { type: "string", nullable: true },
                },
                required: ["person_name", "context", "intent"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "parse_input" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output from AI");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Store input
    await supabase.from("inputs").insert({
      raw_text: text,
      parsed_data: parsed,
      processed: true,
      user_id: userId,
    });

    // Upsert person (duplicate prevention via user_id + name)
    const { data: existingPeople } = await supabase
      .from("people")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", parsed.person_name);

    let person;
    if (existingPeople && existingPeople.length > 0) {
      person = existingPeople[0];
      const existingAttrs = person.attributes || {};
      const existingLikes = (existingAttrs as any).likes || [];
      const newLikes = [...new Set([...existingLikes, ...(parsed.preferences || [])])];
      await supabase
        .from("people")
        .update({
          attributes: { ...existingAttrs, likes: newLikes },
          notes: person.notes ? `${person.notes}\n${parsed.context}` : parsed.context,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", person.id);
      person = { ...person, attributes: { ...existingAttrs, likes: newLikes } };
    } else {
      const { data: newPerson } = await supabase
        .from("people")
        .insert({
          name: parsed.person_name,
          attributes: { likes: parsed.preferences || [] },
          notes: parsed.context,
          user_id: userId,
          last_interaction_at: new Date().toISOString(),
        })
        .select()
        .single();
      person = newPerson;
    }

    // Create event
    if (parsed.event_type) {
      await supabase.from("events").insert({
        type: parsed.event_type,
        person_id: person?.id,
        person_name: parsed.person_name,
        date: parsed.date || null,
        context: parsed.context,
        raw_input: text,
        user_id: userId,
      });
    }

    // Create task if suggested
    if (parsed.suggested_task) {
      await supabase.from("tasks").insert({
        person_id: person?.id,
        person_name: parsed.person_name,
        description: parsed.suggested_task,
        suggested_action: parsed.suggested_task,
        due_date: parsed.task_due_date || null,
        status: "pending",
        source: text,
        user_id: userId,
      });
    }

    // Birthday reminder
    if (parsed.event_type === "birthday" && parsed.date) {
      const bday = new Date(parsed.date);
      const reminderDate = new Date(bday);
      reminderDate.setDate(reminderDate.getDate() - 2);

      const personAttrs = person?.attributes || {};
      const likes = (personAttrs as any).likes || [];
      const giftSuggestion = likes.length > 0
        ? `Consider getting: ${likes.join(", ")}`
        : "Consider getting a thoughtful gift";

      await supabase.from("tasks").insert({
        person_id: person?.id,
        person_name: parsed.person_name,
        description: `${parsed.person_name}'s birthday is coming on ${parsed.date}! ${giftSuggestion}`,
        suggested_action: giftSuggestion,
        due_date: reminderDate.toISOString().split("T")[0],
        status: "pending",
        source: "birthday_reminder",
        user_id: userId,
      });
    }

    return new Response(
      JSON.stringify({ success: true, parsed, person_id: person?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("parse-input error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
