// Shared AI calling helper with automatic fallback from Lovable Gateway (Gemini) to OpenAI.
// Handles MALFORMED_FUNCTION_CALL and 5xx errors transparently.
import { recordGatewayError } from "./usage-guard.ts";

export interface AICallOptions {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  tool: {
    name: string;
    description: string;
    parameters: any; // JSON schema (do NOT include additionalProperties for Gemini)
  };
  maxTokens?: number;
  functionName: string; // for error logging
  supabase: any;
}

export interface AICallResult {
  toolArguments: any; // parsed JSON from tool call
  provider: "lovable" | "openai";
  rawTokens: number;
}

/**
 * Calls AI with automatic fallback. Tries:
 * 1. Lovable Gateway with google/gemini-2.5-pro
 * 2. If MALFORMED/5xx → OpenAI gpt-4o-mini with same tool schema
 * Throws on irrecoverable failure.
 */
export async function callAIWithFallback(opts: AICallOptions): Promise<AICallResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const maxTokens = opts.maxTokens ?? 4000;

  // Try Lovable Gateway with FAST model first (Gemini 3 Flash Preview — 3-5x faster than Pro)
  if (LOVABLE_API_KEY) {
    try {
      const r = await tryLovable(LOVABLE_API_KEY, opts, maxTokens, "google/gemini-3-flash-preview");
      if (r) return r;
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === "RATE_LIMIT" || msg === "PAYMENT_REQUIRED") throw e;
      console.error(`[ai-fallback] Flash threw:`, e);
    }

    // Fallback 1: same gateway with Pro model (handles MALFORMED on complex schemas)
    try {
      console.log(`[ai-fallback] Flash failed, trying Gemini 2.5 Pro for ${opts.functionName}`);
      const r = await tryLovable(LOVABLE_API_KEY, opts, maxTokens, "google/gemini-2.5-pro");
      if (r) return r;
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg === "RATE_LIMIT" || msg === "PAYMENT_REQUIRED") throw e;
      console.error(`[ai-fallback] Pro threw:`, e);
      await recordGatewayError(opts.supabase, opts.functionName, 0, `lovable_exception: ${msg}`);
    }
  }

  // Fallback 2: OpenAI
  if (OPENAI_API_KEY) {
    console.log(`[ai-fallback] Falling back to OpenAI for ${opts.functionName}`);
    const r = await tryOpenAI(OPENAI_API_KEY, opts, maxTokens);
    if (r) return r;
  }

  throw new Error("AI generation failed on all providers (Lovable Gateway and OpenAI). Verify API keys and quotas.");
}

async function tryLovable(apiKey: string, opts: AICallOptions, maxTokens: number, model: string): Promise<AICallResult | null> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: opts.messages,
      tools: [{
        type: "function",
        function: {
          name: opts.tool.name,
          description: opts.tool.description,
          parameters: opts.tool.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: opts.tool.name } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[ai-fallback] Lovable HTTP ${response.status}:`, text.slice(0, 500));
    await recordGatewayError(opts.supabase, opts.functionName, response.status, text.slice(0, 500));
    if (response.status === 429 || response.status === 402) {
      // Hard limits — don't fallback, propagate
      throw new Error(response.status === 429 ? "RATE_LIMIT" : "PAYMENT_REQUIRED");
    }
    return null; // trigger fallback
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  const finishReason = data.choices?.[0]?.native_finish_reason || data.choices?.[0]?.finish_reason;

  if (!toolCall) {
    console.error(`[ai-fallback] Lovable returned no tool_call. finish_reason=${finishReason}. Response:`, JSON.stringify(data).slice(0, 800));
    await recordGatewayError(opts.supabase, opts.functionName, 200, `no_tool_call:${finishReason}`);
    return null; // trigger fallback
  }

  try {
    const args = JSON.parse(toolCall.function.arguments);
    return { toolArguments: args, provider: "lovable", rawTokens: data.usage?.total_tokens || 0 };
  } catch (e) {
    console.error(`[ai-fallback] Lovable tool args parse error:`, e);
    return null;
  }
}

async function tryOpenAI(apiKey: string, opts: AICallOptions, maxTokens: number): Promise<AICallResult | null> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: maxTokens,
      messages: opts.messages,
      tools: [{
        type: "function",
        function: {
          name: opts.tool.name,
          description: opts.tool.description,
          parameters: opts.tool.parameters,
        },
      }],
      tool_choice: { type: "function", function: { name: opts.tool.name } },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`[ai-fallback] OpenAI HTTP ${response.status}:`, text.slice(0, 500));
    await recordGatewayError(opts.supabase, opts.functionName, response.status, `openai: ${text.slice(0, 400)}`);
    return null;
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    console.error(`[ai-fallback] OpenAI returned no tool_call. Response:`, JSON.stringify(data).slice(0, 800));
    return null;
  }

  try {
    const args = JSON.parse(toolCall.function.arguments);
    console.log(`[ai-fallback] OpenAI succeeded for ${opts.functionName}`);
    return { toolArguments: args, provider: "openai", rawTokens: data.usage?.total_tokens || 0 };
  } catch (e) {
    console.error(`[ai-fallback] OpenAI tool args parse error:`, e);
    return null;
  }
}
