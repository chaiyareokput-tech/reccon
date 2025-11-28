import { GoogleGenAI } from "@google/genai";
import { MatchResult } from '../types';

export const analyzeMismatch = async (
  matchResult: MatchResult
): Promise<string> => {
  // Use process.env.API_KEY directly as per @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let prompt = "";
  
  if (matchResult.bankTx && !matchResult.bookTx) {
    prompt = `
      คุณเป็นผู้เชี่ยวชาญด้านบัญชี ฉันมีรายการใน Bank Statement แต่ไม่พบในสมุดบัญชี (Book/GL)
      
      ข้อมูล Bank:
      - วันที่: ${matchResult.bankTx.date}
      - รายการ: ${matchResult.bankTx.description}
      - จำนวนเงิน: ${matchResult.bankTx.amount}
      
      ช่วยวิเคราะห์ว่าสาเหตุที่เป็นไปได้คืออะไร (เช่น ลืมบันทึกค่าธรรมเนียม, ดอกเบี้ยรับ, หรือเช็คคืน) และแนะนำวิธีการบันทึกบัญชีที่ถูกต้องสั้นๆ (ภาษาไทย).
    `;
  } else if (!matchResult.bankTx && matchResult.bookTx) {
    prompt = `
      คุณเป็นผู้เชี่ยวชาญด้านบัญชี ฉันมีรายการในสมุดบัญชี (Book/GL) แต่ไม่พบใน Bank Statement
      
      ข้อมูล Book:
      - วันที่: ${matchResult.bookTx.date}
      - รายการ: ${matchResult.bookTx.description}
      - จำนวนเงิน: ${matchResult.bookTx.amount}
      
      ช่วยวิเคราะห์สาเหตุที่เป็นไปได้ (เช่น Outstanding Check, บันทึกวันที่ผิด, หรือรายการซ้ำ) และแนะนำการปรับปรุงสั้นๆ (ภาษาไทย).
    `;
  } else if (matchResult.bankTx && matchResult.bookTx) {
    prompt = `
      คุณเป็นผู้เชี่ยวชาญด้านบัญชี ฉันจับคู่รายการได้แต่มีความคลาดเคลื่อน (Potential Match)
      
      ข้อมูล Bank: ${matchResult.bankTx.date}, ${matchResult.bankTx.description}, ${matchResult.bankTx.amount}
      ข้อมูล Book: ${matchResult.bookTx.date}, ${matchResult.bookTx.description}, ${matchResult.bookTx.amount}
      
      วิเคราะห์ความแตกต่างและแนะนำว่าควรปรับปรุง Book ให้ตรงกับ Bank อย่างไร.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "ไม่สามารถวิเคราะห์ได้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI";
  }
};