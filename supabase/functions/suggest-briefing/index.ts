import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_context } = await req.json();
    if (!business_context?.trim()) {
      return new Response(JSON.stringify({ error: "business_context is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a content strategy expert. Given a business description, generate contextual suggestion chips for a briefing form. Return suggestions in Portuguese (Brazil). Each chip should be concise (2-5 words). Make suggestions specific to the business type described.`,
          },
          {
            role: "user",
            content: `Business description: "${business_context}"

Generate contextual suggestions for 3 form questions about this business:
1. Ideal audience (who they should target with videos) - 6-8 suggestions
2. Desired outcome (what action viewers should take) - 5-6 suggestions  
3. Brand voice (how the brand should sound) - 5-6 suggestions`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_suggestions",
            description: "Return contextual chip suggestions for briefing form questions",
            parameters: {
              type: "object",
              properties: {
                audience_chips: {
                  type: "array",
                  items: { type: "string" },
                  description: "6-8 audience suggestion chips in Portuguese",
                },
                outcome_chips: {
                  type: "array",
                  items: { type: "string" },
                  description: "5-6 desired outcome chips in Portuguese",
                },
                voice_chips: {
                  type: "array",
                  items: { type: "string" },
                  description: "5-6 brand voice chips in Portuguese",
                },
              },
              required: ["audience_chips", "outcome_chips", "voice_chips"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
