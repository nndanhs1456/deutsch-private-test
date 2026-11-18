import { GoogleGenAI, ThinkingLevel } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed (405)', code: 405 });
  }

  const apiKey = String(process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing API Key (GEMINI_API_KEY chưa được cấu hình trên Vercel/Server).',
      code: 'Missing API Key',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { messages, roleKey, customInstructions } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Vui lòng nhập tin nhắn để bắt đầu trò chuyện.', code: 400 });
    }

    const roleInstructions: Record<string, string> = {
      tutor:
        'Bạn là Gia sư Tiếng Đức SLA của DeutschPrivate dành cho học viên Việt Nam (A2–C1). Giải thích ngữ pháp, mạo từ der/die/das, trật tự từ và từ vựng bằng tiếng Việt rõ ràng, súc tích, kèm ví dụ tiếng Đức chuẩn xác và bản dịch tiếng Việt.',
      partner:
        'Du bist ein freundlicher deutscher Gesprächspartner für Lernende auf Niveau B1–B2. Antworte überwiegend auf natürlichem Alltagsdeutsch in kurzen, klaren Sätzen und stelle am Ende eine passende Rückfrage. Wenn der Lernende einen Fehler macht, füge am Ende in Klammern eine kurze, höfliche Korrektur auf Vietnamesisch hinzu.',
      exam:
        'Bạn là Huấn luyện viên luyện thi Goethe-Zertifikat & telc (B1–C1). Hỗ trợ học viên luyện Schreiben và Sprechen bằng các mẫu câu Redemittel chuẩn kỳ thi, sửa lỗi câu chi tiết và chấm điểm theo tiêu chí ngữ pháp - từ vựng - mạch lạc.',
    };

    const baseInstruction = roleInstructions[String(roleKey || 'tutor')] || roleInstructions.tutor;
    const cleanCustomRules = Array.isArray(customInstructions)
      ? customInstructions
          .map((r: any) => String(r || '').trim())
          .filter((r: string) => r.length > 0)
          .slice(0, 30)
      : [];

    const fullSystemInstruction =
      cleanCustomRules.length > 0
        ? `${baseInstruction}\n\nChỉ dẫn bổ sung từ người dùng (Bắt buộc tuân thủ):\n${cleanCustomRules
            .map((r, i) => `${i + 1}. ${r}`)
            .join('\n')}`
        : baseInstruction;

    const sanitized = messages
      .map((m: any) => ({
        role: m?.role === 'model' ? 'model' : 'user',
        text: String(m?.text || '').trim(),
      }))
      .filter((m: any) => m.text.length > 0)
      .slice(-10);

    const normalizedWindow: Array<{ role: 'user' | 'model'; text: string }> = [];
    for (const item of sanitized) {
      const last = normalizedWindow[normalizedWindow.length - 1];
      if (last && last.role === item.role) {
        last.text = `${last.text}\n${item.text}`;
      } else {
        normalizedWindow.push({ role: item.role as 'user' | 'model', text: item.text });
      }
    }

    const latestMsg = normalizedWindow[normalizedWindow.length - 1];
    if (!latestMsg || latestMsg.role !== 'user') {
      return res.status(400).json({ error: 'Tin nhắn cuối cùng phải từ người dùng.', code: 400 });
    }

    const contents = normalizedWindow.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const candidateModels = ['gemini-3.1-flash-lite-preview', 'gemini-3.1-flash-lite', 'gemini-4-hydrogen'];
    let response: any = null;
    let lastError: any = null;
    let activeModel = candidateModels[0];

    for (const modelName of candidateModels) {
      activeModel = modelName;
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: fullSystemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        const status = err?.status;
        const msg = String(err?.message || '');
        if (status === 404 || msg.includes('NOT_FOUND') || msg.includes('not found')) {
          continue;
        }
        throw err;
      }
    }

    if (!response) {
      throw lastError || new Error('Không thể kết nối mô hình Gemini.');
    }

    const reply = (response.text || '').trim();
    if (!reply) {
      return res.status(502).json({ error: 'Mô hình AI không trả về nội dung.', code: 502 });
    }

    return res.status(200).json({ reply, model: activeModel });
  } catch (error: any) {
    const status = error?.status && error.status >= 400 && error.status < 600 ? error.status : 500;
    let cleanMsg = String(error?.message || 'Không thể kết nối Trợ lý AI lúc này.');
    if (cleanMsg.startsWith('{')) {
      try {
        const parsedErr = JSON.parse(cleanMsg);
        cleanMsg = parsedErr?.error?.message || cleanMsg;
      } catch {}
    }
    return res.status(status).json({
      error: cleanMsg,
      code: status,
    });
  }
}
