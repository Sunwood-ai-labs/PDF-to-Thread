import { GoogleGenAI, Schema, Type } from "@google/genai";
import { GeneratedThread, SlideData } from "../types";

const parseBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const generateThreadContent = async (slides: SlideData[]): Promise<GeneratedThread> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare input parts: Text prompt + All images
  const parts: any[] = [];

  // System instruction / Prompt
  const promptText = `
    あなたはSNS運用のプロフェッショナルです。
    以下のスライド画像を分析し、Twitter/Xのスレッド投稿を作成してください。
    
    各スライドについて以下の2点を出力してください：

    1. threadPost:
       全てのスライド（1枚目を含む）で、以下の構成フォーマットを厳守してください。長文は避け、視認性を最優先します。

         (a) 1行目: 【見出し】 （スライドの内容を端的に表すタイトル）
         (b) 本文: 簡潔な箇条書き。
             - 文末は「〜です/ます」ではなく、体言止めや名詞止めで短く切る。
             - 1枚目のスライドも、スレッドの導入として機能しつつ、この箇条書き形式を守ること。
         (c) 箇条書きの行頭: そのツイート内で使用する絵文字は「1種類に固定」する。
             - ただし、ツイートごと（スライドごと）に異なる絵文字を使用し、スレッド全体で単調にならないようにすること。
             (良い例 - ツイートA:
               🔥 ポイントA
               🔥 ポイントB
               🔥 ポイントC
             )
             (良い例 - ツイートB:
               💡 ポイントX
               💡 ポイントY
             )
             (悪い例 - 絵文字混在:
               🔥 ポイントA
               ⭐️ ポイントB
             )

    2. imageDescription: 
       - その画像が何を表しているかの客観的で詳細な説明文（Alt text用）。

    出力はJSON形式でお願いします。
  `;

  parts.push({ text: promptText });

  // Add images
  // Note: Depending on the total payload size, sending too many high-res images might hit limits.
  // Gemini 2.5 Flash has a large context window, so ~20-30 slides usually fit fine.
  slides.forEach((slide) => {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: parseBase64(slide.imageData),
      },
    });
  });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            slideIndex: { type: Type.INTEGER, description: "0-based index of the slide corresponding to this text" },
            threadPost: { type: Type.STRING, description: "The social media post text for this slide" },
            imageDescription: { type: Type.STRING, description: "Accessibility description of the image" },
          },
          required: ["slideIndex", "threadPost", "imageDescription"],
        },
      },
    },
    required: ["items"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are a helpful social media assistant specializing in technical and educational content.",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeneratedThread;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};