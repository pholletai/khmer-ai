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
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 วินาที

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

    if (!data.ok || !data.reply) {
      throw new Error(data.error || "មិន​មាន​ចម្លើយ​ពី AI");
    }

    return data.reply;
  } catch (err: any) {
    console.error("askAI error:", err.message);
    if (err.name === "AbortError") {
      throw new Error("សំណើ​ចំណាយ​ពេល​យូរ​ពេក សូម​សាកល្បង​ម្តង​ទៀត");
    }
    throw new Error(
      err.message || "មាន​បញ្ហា​ក្នុង​ការ​ទាក់ទង​ជាមួយ​ម៉ាស៊ីន​បម្រើ"
    );
  }
}