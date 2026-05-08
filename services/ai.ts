// services/ai.ts
const API_BASE = "https://khmerai.store";

export type ChatResponse = {
  ok: boolean;
  reply?: string;
  error?: string;
};

export async function askAI(
  senderId: string,
  message: string
): Promise<string> {
  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 30000);

    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ senderId, message }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data: ChatResponse = await res.json();

    if (!res.ok || !data.ok || !data.reply) {
      throw new Error(data.error || "AI មិនមានចម្លើយ");
    }

    return data.reply;
  } catch (err: any) {
    console.error("askAI error:", err?.message);

    if (err?.name === "AbortError") {
      throw new Error("AI ឆ្លើយយឺតពេក សូមសាកល្បងម្ដងទៀត");
    }

    throw new Error(
      err?.message || "មានបញ្ហាក្នុងការតភ្ជាប់ទៅ Khmer AI"
    );
  }
}