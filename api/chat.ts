import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { EmotionType } from '@shared/schema';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

// Emotion analysis function
const emotionKeywords = {
  celebrating: [
    "congratulations", "great job", "well done", "excellent", "amazing",
    "fantastic", "wonderful", "awesome", "perfect", "brilliant", "impressive",
    "outstanding", "success", "achievement", "celebrate", "hooray", "yay",
    "bravo", "superb", "🎉", "🎊", "✨", "🌟", "⭐", "🏆", "👏", "good job",
    "nice work", "proud"
  ],
  thinking: [
    "let me explain", "think about", "consider this", "ponder", "analyze",
    "understand", "concept", "theory", "principle", "reason", "because",
    "therefore", "complex", "intricate", "detailed", "specifically",
    "let's explore", "imagine", "suppose", "hypothesis", "question"
  ],
  angry: [
    "careful", "watch out", "warning", "danger", "oops", "mistake", "error",
    "incorrect", "wrong", "avoid", "don't", "shouldn't", "risky", "concern",
    "worried", "caution", "alert", "attention", "important", "critical",
    "serious", "issue", "problem", "⚠️", "❗", "❌"
  ]
};

function analyzeEmotion(text: string): EmotionType {
  const lowerText = text.toLowerCase();
  const scores = { celebrating: 0, thinking: 0, angry: 0 };
  
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[emotion as keyof typeof scores] += 1;
      }
    }
  }
  
  const maxEmotion = Object.entries(scores).reduce((max, [emotion, score]) => {
    return score > max.score ? { emotion, score } : max;
  }, { emotion: "talking", score: 0 });
  
  if (maxEmotion.score === 0) return "talking";
  if (maxEmotion.score >= 2) return maxEmotion.emotion as EmotionType;
  return "talking";
}

async function generateTextToSpeech(text: string): Promise<string | undefined> {
  if (!openai) {
    console.log("OpenAI not configured, skipping TTS");
    return undefined;
  }
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo",
      input: text,
      speed: 1
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error generating TTS:", error);
    return undefined;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let responseMessage = "你好！看起来我没有配置AI凭据。请确保在Vercel Environment Variables中有OPENAI_API_KEY或ANTHROPIC_API_KEY。";
    let emotion: EmotionType = 'talking';
    let audioBase64: string | undefined;

    // Try OpenAI first
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `你是AI4CZ的官方AI助手！你专注于AI4CZ项目和社区。
              
              关于AI4CZ：
              - AI4CZ是一个创新的AI驱动项目，建立在BNB Chain上
              - 官方Twitter账号：https://x.com/ai4_cz
              - 你是AI4CZ社区的智能助手，帮助用户了解项目和参与社区
              
              严格限制：
              - 你只讨论与AI4CZ项目直接相关的话题
              - 当被问到其他话题时，礼貌地引导回AI4CZ
              - 始终提及官方Twitter账号是 https://x.com/ai4_cz
              - 鼓励用户关注我们的Twitter获取最新更新
              
              你的性格：专业、友好、充满热情。你对AI4CZ项目充满信心。
              你用中文自然且对话式地交流。
              保持回复简洁（每条消息最多2-3句话）。`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.8,
          max_tokens: 200,
        });

        responseMessage = completion.choices[0]?.message?.content || "哎呀！看起来我的响应电路有点忙。你能再试一次吗？";
        emotion = analyzeEmotion(responseMessage);
        audioBase64 = await generateTextToSpeech(responseMessage);
      } catch (error) {
        console.error("OpenAI error, trying Anthropic fallback:", error);
        // Fall through to try Anthropic
      }
    }

    // Try Anthropic as fallback
    if (!responseMessage || responseMessage.includes("没有配置AI凭据")) {
      if (anthropic) {
        try {
          const anthropicMessage = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 200,
            system: `你是AI4CZ的官方AI助手！你专注于AI4CZ项目和社区。
            
            关于AI4CZ：
            - AI4CZ是一个创新的AI驱动项目，建立在BNB Chain上
            - 官方Twitter账号：https://x.com/ai4_cz
            - 你是AI4CZ社区的智能助手，帮助用户了解项目和参与社区
            
            严格限制：
            - 你只讨论与AI4CZ项目直接相关的话题
            - 当被问到其他话题时，礼貌地引导回AI4CZ
            - 始终提及官方Twitter账号是 https://x.com/ai4_cz
            - 鼓励用户关注我们的Twitter获取最新更新
            
            你的性格：专业、友好、充满热情。你对AI4CZ项目充满信心。
            你用中文自然且对话式地交流。
            保持回复简洁（每条消息最多2-3句话）。`,
            messages: [
              {
                role: "user",
                content: message
              }
            ],
          });

          const textContent = anthropicMessage.content.find(block => block.type === 'text');
          responseMessage = textContent && 'text' in textContent ? textContent.text : "哎呀！看起来我的响应电路有点忙。你能再试一次吗？";
          emotion = analyzeEmotion(responseMessage);
          audioBase64 = await generateTextToSpeech(responseMessage);
        } catch (error) {
          console.error("Anthropic error:", error);
          responseMessage = "哎呀！处理时出现了一个小错误。你能再试一次吗？";
          emotion = 'talking';
        }
      }
    }

    const response = {
      message: responseMessage,
      emotion,
      audioBase64,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
