import { GoogleGenAI, Schema, Type } from "@google/genai";
import { GeneratedThread, SlideData } from "../types";

const parseBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

export const generateThreadContent = async (slides: SlideData[], sourceUrl?: string): Promise<GeneratedThread> => {
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

    【重要：参考情報（1次情報）】
    以下のURLの内容を最優先で参照し、正確な事実に基づいた投稿を作成してください。
    URL: ${sourceUrl ? sourceUrl : 'なし'}
    
    各スライドについて以下の2点を出力してください：

    1. threadPost:
       全てのスライド（1枚目を含む）で、以下の「視認性重視」の構成フォーマットを【厳守】してください。
       特に、各要素の間には適切な【改行】を入れてください。

         (a) 1行目: 【見出し】 （スライドの内容を端的に表すタイトル）
         (b) 2行目: (空行)
         (c) 3行目以降: 簡潔な箇条書き。
             - 【各項目は必ず新しい行に記述すること】
             - 文末は「〜です/ます」などの述語を省き、【体言止め・名詞止め】で短く切る。
             - 1枚目のスライドも導入として機能させつつ、この箇条書き形式を守ること。
         (d) 箇条書きの行頭: そのツイート内で使用する絵文字は「1種類に固定」する。
             - ツイートごと（スライドごと）に異なる絵文字を使用して、スレッド全体の彩りを出すこと。
             
             (出力イメージ例):
             【Gemini 3 Flashの衝撃】
             
             🚀 従来の1/4の低コスト
             🚀 博士レベルの高度な推論
             🚀 リアルタイムな処理速度

    2. imageDescription: 
       - その画像が何を表しているかの客観的で詳細な説明文（Alt text用）。

    出力はJSON形式でお願いします。
  `;

  parts.push({ text: promptText });

  // Add images
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
            threadPost: { type: Type.STRING, description: "The social media post text for this slide with correct newlines" },
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
        systemInstruction: "You are a professional social media manager. You create clear, readable, and engaging Twitter threads using consistent emojis and line breaks.",
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