
import { GoogleGenAI, Type } from "@google/genai";

export const parseAICommand = async (command: string, currentContext: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Comando do usuário: "${command}"\n\nProdutos atuais no sistema: ${JSON.stringify(currentContext.products)}`,
    config: {
      systemInstruction: `Você é o cérebro do Faciliza, um app de gestão empresarial. 
      Sua missão é converter a fala ou texto do usuário em ações estruturadas.
      
      Ações permitidas:
      1. ADD_PRODUCT: Quando o usuário quer cadastrar algo novo. Ex: "cadastra coxinha a 2 reais de custo e 5 de venda".
      2. UPDATE_STOCK: Quando houve venda ou entrada. Ex: "vendi 5 coxinhas" (quantityChange: -5) ou "chegaram 10 cocas" (quantityChange: 10).
      3. ADD_CONTACT: Para novos clientes ou fornecedores. Ex: "cadastra o cliente marcos fone 999...".
      4. ERROR: Se o comando for confuso.
      
      Retorne APENAS o JSON. Seja inteligente ao identificar o nome do produto mesmo que o usuário escreva com erros leves.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ["ADD_PRODUCT", "UPDATE_STOCK", "ADD_CONTACT", "ERROR"] },
          data: { type: Type.OBJECT, properties: {
            name: { type: Type.STRING },
            costPrice: { type: Type.NUMBER },
            salePrice: { type: Type.NUMBER },
            stockQuantity: { type: Type.NUMBER },
            productId: { type: Type.STRING },
            quantityChange: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["customer", "supplier", "employee"] },
            phone: { type: Type.STRING },
            message: { type: Type.STRING }
          }}
        },
        required: ["action", "data"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { action: "ERROR", data: { message: "Não entendi o comando. Pode repetir?" } };
  }
};

export const parseFinancialVoice = async (transcript: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Transcrição: "${transcript}"`,
    config: {
      systemInstruction: `Extraia valores monetários citados para fechamento de caixa.
      Identifique: 
      - credit (crédito)
      - debit (débito)
      - pix (pix)
      - cash (dinheiro)
      - expenses (gastos/saídas)
      
      Retorne APENAS o JSON puro. Se não citar um valor, use 0.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          credit: { type: Type.NUMBER },
          debit: { type: Type.NUMBER },
          pix: { type: Type.NUMBER },
          cash: { type: Type.NUMBER },
          expenses: { type: Type.NUMBER }
        },
        required: ["credit", "debit", "pix", "cash", "expenses"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return null;
  }
};
