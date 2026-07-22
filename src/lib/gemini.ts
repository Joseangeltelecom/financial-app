const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface ExtractedExpense {
  name: string;
  amount: number;
  store: string;
  date: string;
  items: { description: string; amount: number }[];
}

export async function scanReceipt(base64Image: string, mimeType: string = "image/jpeg"): Promise<ExtractedExpense[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const prompt = `Analyze this receipt or expense photo. Extract ALL individual expense items visible.

For EACH item or expense found, provide:
- name: short description of what was bought (e.g. "Cafe Latte", "Uber ride")
- amount: the numeric amount (no currency symbols, just the number)
- store: the store/merchant name if visible
- date: the date in YYYY-MM-DD format if visible, otherwise use today's date

Return a JSON array. Example:
[{"name":"Groceries","amount":45.50,"store":"Walmart","date":"2026-07-22","items":[{"description":"Milk","amount":3.50},{"description":"Bread","amount":2.99}]}]

If you see a single total with no item breakdown, create one entry with the total amount and an empty items array.
If the image is not a receipt or expense, return an empty array [].
Return ONLY valid JSON, no markdown, no explanation.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    throw new Error("Failed to parse receipt data");
  }
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
