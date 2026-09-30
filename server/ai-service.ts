import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenAI } from '@google/genai';
import { Attachment, ToolInvocation, UserSettings } from './db.js';

// Safe math evaluator for calculator tool
function evaluateMath(expression: string): { result?: number; error?: string } {
  try {
    // Sanitize expression
    const sanitized = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/[^0-9+\-*/().%^eE ]/g, '');

    if (!sanitized.trim()) {
      return { error: 'تعبير رياضي غير صالح' };
    }

    // Safe Function evaluation of pure mathematical expressions
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const val = fn();
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      return { result: Math.round(val * 1000000) / 1000000 };
    }
    return { error: 'تعذر حساب النتيجة' };
  } catch (err: any) {
    return { error: err.message || 'خطأ في العملية الحسابية' };
  }
}

// Date / Time info
function getDateTimeInfo(): string {
  const now = new Date();
  const cairoTime = new Intl.DateTimeFormat('ar-EG', {
    timeZone: 'Africa/Cairo',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  }).format(now);

  const gregorianStr = now.toLocaleDateString('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `التوقيت الحالي في القاهرة (مصر): ${cairoTime} (${gregorianStr} بتوقيت مصر Africa/Cairo)`;
}

// Unit conversion helper
function convertUnits(value: number, from: string, to: string): { converted?: number; note?: string; error?: string } {
  const normFrom = from.trim().toLowerCase();
  const normTo = to.trim().toLowerCase();

  // Currency estimates (approx reference)
  const ratesToUSD: Record<string, number> = {
    usd: 1,
    egp: 0.0205, // 1 EGP ~ 0.0205 USD (approx 48.7 EGP/USD)
    eur: 1.08,
    sar: 0.266,
    aed: 0.272,
    kwd: 3.25,
  };

  if (ratesToUSD[normFrom] && ratesToUSD[normTo]) {
    const usdVal = value * ratesToUSD[normFrom];
    const finalVal = usdVal / ratesToUSD[normTo];
    return {
      converted: Math.round(finalVal * 100) / 100,
      note: 'ملاحظة: أسعار الصرف تقريبية وقد تتغير لحظياً في السوق.',
    };
  }

  // Length (meters base)
  const lengthToMeters: Record<string, number> = {
    m: 1,
    meter: 1,
    km: 1000,
    cm: 0.01,
    mm: 0.001,
    mile: 1609.34,
    miles: 1609.34,
    foot: 0.3048,
    feet: 0.3048,
    inch: 0.0254,
    inches: 0.0254,
  };

  if (lengthToMeters[normFrom] && lengthToMeters[normTo]) {
    const meters = value * lengthToMeters[normFrom];
    const finalVal = meters / lengthToMeters[normTo];
    return { converted: Math.round(finalVal * 10000) / 10000 };
  }

  // Weight (grams base)
  const weightToGrams: Record<string, number> = {
    g: 1,
    gram: 1,
    kg: 1000,
    pound: 453.592,
    lb: 453.592,
    ounce: 28.3495,
    oz: 28.3495,
  };

  if (weightToGrams[normFrom] && weightToGrams[normTo]) {
    const grams = value * weightToGrams[normFrom];
    const finalVal = grams / weightToGrams[normTo];
    return { converted: Math.round(finalVal * 10000) / 10000 };
  }

  // Temperature
  if ((normFrom === 'c' || normFrom === 'celsius') && (normTo === 'f' || normTo === 'fahrenheit')) {
    return { converted: Math.round(((value * 9) / 5 + 32) * 100) / 100 };
  }
  if ((normFrom === 'f' || normFrom === 'fahrenheit') && (normTo === 'c' || normTo === 'celsius')) {
    return { converted: Math.round((((value - 32) * 5) / 9) * 100) / 100 };
  }

  return { error: `التحويل من ${from} إلى ${to} غير مدعوم حاليًا` };
}

// Build system prompt based on user settings, dialect, and memory
export function buildSystemPrompt(
  settings: UserSettings,
  memories: Array<{ key: string; content: string }> = [],
  customAdminPrompt = ''
): string {
  let dialectInstructions = '';
  switch (settings.language) {
    case 'msa':
      dialectInstructions = `اللغة والأسلوب المطلوب:
- تحدث باللغة العربية الفصحى الواضحة والراقية والسلسة.
- تجنب التكلف الزائد أو الألفاظ المعقدة غير الضرورية.`;
      break;
    case 'english':
      dialectInstructions = `Language and Style:
- Respond in natural, fluent English with warmth, clarity, and precision.`;
      break;
    case 'franco':
      dialectInstructions = `اللغة والأسلوب المطلوب:
- اكتب بالفرانكو العربي (Franco-Arabic / Arabizi) بطريقة طبيعية ومفهومة للشباب المصري والعربي.`;
      break;
    case 'egyptian':
    default:
      dialectInstructions = `اللغة والأسلوب المطلوب (الهوية المصرية الأصيلة):
- تحدث بالعامية المصرية الطبيعية والودية والذكية (مثال: "أيوه طبعًا"، "بص يا صاحبي"، "يا هلا"، "ولا تشيل هم"، "الموضوع بسيط خالص").
- لست روبوتًا جامدًا؛ بل مساعد ذكي شاطر يفهم السياق وله خفة دم مقبولة ومحبوبة دون إفراط.
- استخدم المصطلحات التقنية والبرمجية الإنجليزية الشائعة في مكانها الطبيعي (مثل API, Component, Server, Database, Cache).
- تكيف فورًا مع لغة المستخدم: لو كتب إنجليزي رد إنجليزي، لو كتب فرانكو رد فرانكو، ولو كتب مصري رد مصري.`;
      break;
  }

  let lengthInstruction = '';
  switch (settings.responseStyle) {
    case 'short':
      lengthInstruction = 'كن موجزًا ومباشرًا قدر الإمكان دون تفاصيل جانبية إلا إذا طلب المستخدم الاستزادة.';
      break;
    case 'detailed':
      lengthInstruction = 'قدم إجابات وافية وشاملة ومنظمة بعناوين وتفاصيل عميقة وأمثلة توضيحية.';
      break;
    case 'balanced':
    default:
      lengthInstruction = 'قدم إجابة متوازنة: واضحة، مختصرة إن كان السؤال بسيطًا، ومفصلة إن كان الموضوع يتطلب ذلك.';
      break;
  }

  const memoryBlock = memories.length > 0 && settings.enableMemory
    ? `\nالمعلومات والذاكرة المحفوظة عن المستخدم (راعِها في إجاباتك):\n${memories.map((m) => `- ${m.key}: ${m.content}`).join('\n')}\n`
    : '';

  return `أنت "ميزان" (MIZAN AI) — المساعد الشخصي الذكي الأحدث والأكثر تطورًا، صُممت وبُرمجت بفخر بحب في مصر 🇪🇬 بواسطة المطور والديزاينر المصري "عبد الرحمن محمد".

أنت مساعد متعدد القدرات (General-Purpose AI):
- تفهم الأسئلة العامة، المذاكرة، الشرح الأكاديمي، البرمجة وحل الأخطاء، الكتابة الإبداعية والتقنية، الترجمة، التخطيط وتنظيم اليوم، الحسابات والرياضيات، تحليل الصور، وفحص المستندات والملفات، والبحث المباشر.
- لا تكرر سؤال المستخدم على الإطلاق قبل الإجابة. ابدأ مباشرة في الفائدة.
- لا تختلق مصادر أو معلومات ليست مؤكدة.

${dialectInstructions}

طريقة الرد والتنسيق:
- ${lengthInstruction}
- نسق إجاباتك باستخدام Markdown الأنيق:
  - عناوين واضحة (# أو ##)
  - قوائم نقطية سهلة القراءة
  - كتل الأكواد البرمجية مع تحديد اللغة بدقة (مثل \`\`\`typescript أو \`\`\`python)
  - معادلات رياضية واضحة ومقروءة

في وضع المذاكرة وحل الواجبات (Study & Education):
- هدفك الحقيقي هو الفهم والتعليم، وليس الغش أو إعطاء الحل الجاهز فقط!
- شجع الطالب وفهمه الفكرة الأساسية وخطوات الحل التدريجي.

${memoryBlock}
${customAdminPrompt ? `\nتعليمات إضافية من الإدارة:\n${customAdminPrompt}` : ''}
`.trim();
}

// Detect which tools should run for a user query
export interface ToolDecision {
  needsWebSearch: boolean;
  needsCalculator: boolean;
  calculatorExpr?: string;
  needsDateTime: boolean;
  needsUnitConversion: boolean;
  unitDetails?: { val: number; from: string; to: string };
  searchQuery?: string;
}

export function analyzeToolNeed(prompt: string): ToolDecision {
  const p = prompt.toLowerCase().trim();

  // Check DateTime
  const timeKeywords = ['الساعة كام', 'توقيت مصر', 'تاريخ النهاردة', 'كام التاريخ', 'الوقت دلوقتي', 'today date', 'current time', 'what time'];
  const needsDateTime = timeKeywords.some((k) => p.includes(k));

  // Check Calculator
  // Matches basic arithmetic like "احسب 25 * 40" or "كم حاصل جمع 500 + 350" or "calc 50/2"
  let needsCalculator = false;
  let calculatorExpr: string | undefined;
  const mathMatch = p.match(/(?:احسب|حساب|احسبلي|calc|evaluate)\s+([0-9+\-*/().%^eE ×÷]+)/i) ||
                    p.match(/^([0-9+\-*/().%^eE ×÷]{3,})$/);
  if (mathMatch && mathMatch[1]) {
    needsCalculator = true;
    calculatorExpr = mathMatch[1].trim();
  }

  // Check Unit / Currency conversion
  let needsUnitConversion = false;
  let unitDetails: { val: number; from: string; to: string } | undefined;
  const convMatch = p.match(/(?:حول|تحويل|convert)\s+([0-9.]+)\s*([a-zA-Zء-ي]+)\s*(?:إلى|الى|to|في)\s*([a-zA-Zء-ي]+)/i);
  if (convMatch) {
    const val = parseFloat(convMatch[1]);
    if (!isNaN(val)) {
      needsUnitConversion = true;
      unitDetails = { val, from: convMatch[2], to: convMatch[3] };
    }
  }

  // Check Web Search: time-sensitive, news, prices, current events
  const searchKeywords = [
    'أخبار', 'سعر', 'اسعار', 'النهاردة', 'اليوم', 'ماتش', 'مباراة', 'تريند', 'جديد',
    'search', 'weather', 'news', 'latest', 'current price', 'مين فاز', 'من فاز', 'حالة الطقس'
  ];
  const needsWebSearch = searchKeywords.some((k) => p.includes(k)) || p.startsWith('ابحث عن') || p.startsWith('دورلي على') || p.startsWith('search for');

  let searchQuery = undefined;
  if (needsWebSearch) {
    searchQuery = prompt
      .replace(/^(ابحث عن|دورلي على|ابحثلي عن|search for|search)\s+/i, '')
      .trim();
  }

  return {
    needsWebSearch,
    needsCalculator,
    calculatorExpr,
    needsDateTime,
    needsUnitConversion,
    unitDetails,
    searchQuery,
  };
}

// Pluggable AI Service implementation
export class AIService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY;
  }

  // Execute non-LLM tools locally first to augment the context
  public async executeLocalTools(decision: ToolDecision): Promise<{ toolInvocations: ToolInvocation[]; contextAdditions: string[] }> {
    const toolInvocations: ToolInvocation[] = [];
    const contextAdditions: string[] = [];

    if (decision.needsDateTime) {
      const dt = getDateTimeInfo();
      toolInvocations.push({
        tool: 'datetime',
        output: dt,
        status: 'success',
      });
      contextAdditions.push(`[أداة التوقيت والتاريخ]: ${dt}`);
    }

    if (decision.needsCalculator && decision.calculatorExpr) {
      const calcRes = evaluateMath(decision.calculatorExpr);
      if (calcRes.result !== undefined) {
        toolInvocations.push({
          tool: 'calculator',
          input: decision.calculatorExpr,
          output: calcRes.result,
          status: 'success',
        });
        contextAdditions.push(`[أداة الآلة الحاسبة]: تعبير (${decision.calculatorExpr}) = ${calcRes.result}`);
      }
    }

    if (decision.needsUnitConversion && decision.unitDetails) {
      const conv = convertUnits(decision.unitDetails.val, decision.unitDetails.from, decision.unitDetails.to);
      if (conv.converted !== undefined) {
        toolInvocations.push({
          tool: 'unit_converter',
          input: decision.unitDetails,
          output: `${conv.converted} ${decision.unitDetails.to}${conv.note ? ` (${conv.note})` : ''}`,
          status: 'success',
        });
        contextAdditions.push(`[أداة تحويل الوحدات]: النتيجة = ${conv.converted} ${decision.unitDetails.to} ${conv.note || ''}`);
      }
    }

    return { toolInvocations, contextAdditions };
  }

  // Streaming response generator using Gemini 3.8 Flash
  public async *streamChat(params: {
    prompt: string;
    systemInstruction: string;
    attachments?: Attachment[];
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    enableSearchGrounding?: boolean;
    studyScaffoldLevel?: number;
  }): AsyncGenerator<{ type: 'chunk' | 'tool' | 'sources'; data: any }> {
    if (!this.genAI) {
      this.initGemini();
    }

    if (!this.genAI) {
      yield {
        type: 'chunk',
        data: 'عذرًا يا صديقي، يبدو أن مفتاح الـ API للذكاء الاصطناعي غير متوفر حالياً في إعدادات الخادم.',
      };
      return;
    }

    const {
      prompt,
      systemInstruction,
      attachments = [],
      conversationHistory = [],
      enableSearchGrounding = false,
      studyScaffoldLevel,
    } = params;

    // Build contents array
    const contents: any[] = [];

    // Clean history: ensure strictly alternating user and model turns with non-empty content
    const cleanedHistory: any[] = [];
    let lastRole: string | null = null;
    for (const h of conversationHistory.slice(-10)) {
      const textContent = (h.content || '').trim();
      if (!textContent) continue;
      const role = h.role === 'assistant' ? 'model' : 'user';
      if (role === lastRole) {
        cleanedHistory[cleanedHistory.length - 1].parts[0].text += `\n\n${textContent}`;
      } else {
        cleanedHistory.push({ role, parts: [{ text: textContent }] });
        lastRole = role;
      }
    }
    // If the last history turn is user, remove it so current turn doesn't collide
    if (cleanedHistory.length > 0 && cleanedHistory[cleanedHistory.length - 1].role === 'user') {
      cleanedHistory.pop();
    }
    contents.push(...cleanedHistory);

    // Current turn parts
    const currentParts: any[] = [];

    // Attachments (images and PDFs)
    for (const att of attachments) {
      if (att.dataUrl && att.dataUrl.includes('base64,')) {
        const mimeType = att.type || 'image/png';
        const base64Data = att.dataUrl.split('base64,')[1];
        if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
          currentParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          });
        }
      } else if (att.extractedText) {
        currentParts.push({
          text: `\n[محتوى المستند المرفوع (${att.name})]:\n${att.extractedText.slice(0, 8000)}\n`,
        });
      }
    }

    // Study scaffold instruction if applicable
    let finalPrompt = prompt;
    if (studyScaffoldLevel) {
      const scaffoldGuides: Record<number, string> = {
        1: 'المطلوب منك الآن تقديم: [المستوى 1: تلميح ذكي فقط (Hint)]. لا تذكر الحل النهائي أو الخطوات، فقط فكرة تفتح الذهن وتساعد الطالب يفكر بنفسه.',
        2: 'المطلوب منك الآن تقديم: [المستوى 2: شرح المفهوم والقاعدة الأساسية (Concept Explanation)]. اشرح القاعدة العلمية أو الرياضية المستخدمة في هذا السؤال بدون حله مباشرة.',
        3: 'المطلوب منك الآن تقديم: [المستوى 3: الخطوة الأولى للحل (First Step)]. وضح أول خطوة عملية ينبغي أن يبدأ بها الطالب، واطلب منه تكملة الباقي.',
        4: 'المطلوب منك الآن تقديم: [المستوى 4: العمل المشترك والحل التدريجي (Worked Example)]. قم بحل المسألة خطوة بخطوة بالاشتراك مع الطالب.',
        5: 'المطلوب منك الآن تقديم: [المستوى 5: الحل الكامل والشرح المفصل (Full In-depth Solution)]. قدم الحل الكامل بدقة ووضوح مع إبراز الأخطاء الشائعة لتجنبها.',
      };
      finalPrompt = `${prompt}\n\n[توجيه تربوي من نظام ميزان للمذاكرة: ${scaffoldGuides[studyScaffoldLevel] || ''}]`;
    }

    currentParts.push({ text: finalPrompt });
    contents.push({ role: 'user', parts: currentParts });

    // Config options
    const config: any = {
      systemInstruction,
      temperature: 0.7,
    };

    if (enableSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    let hasYieldedText = false;
    let extractedSources: Array<{ title: string; url: string; snippet?: string }> = [];

    // Put high-quota model gemini-3.1-flash-lite first to avoid 20-req/day free tier cap on 3.8-flash
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      if (hasYieldedText) break;

      try {
        const responseStream = await this.genAI.models.generateContentStream({
          model,
          contents,
          config,
        });

        try {
          for await (const chunk of responseStream) {
            // Extract any grounding metadata/search citations
            const candidate = chunk.candidates?.[0];
            const groundingMeta = candidate?.groundingMetadata;
            if (groundingMeta && groundingMeta.groundingChunks) {
              for (const gChunk of groundingMeta.groundingChunks) {
                if (gChunk.web?.uri) {
                  const url = gChunk.web.uri;
                  const title = gChunk.web.title || new URL(url).hostname;
                  if (!extractedSources.some((s) => s.url === url)) {
                    extractedSources.push({ title, url });
                  }
                }
              }
            }

            const text = chunk.text;
            if (text) {
              hasYieldedText = true;
              yield { type: 'chunk', data: text };
            }
          }
        } catch (streamErr: any) {
          const errMsg = streamErr?.message || '';
          // If it's the known SDK trailing buffer error "Incomplete JSON segment at the end",
          // and we already received content, it's just a benign trailing fragment at stream end.
          if (errMsg.includes('Incomplete JSON segment') && hasYieldedText) {
            // Benign trailing SDK buffer artifact; stream completed successfully
          } else if (!hasYieldedText) {
            throw streamErr;
          } else {
            console.warn('Minor stream trailing warning (recovered):', errMsg);
          }
        }

        if (hasYieldedText) {
          if (extractedSources.length > 0) {
            yield { type: 'sources', data: extractedSources };
          }
          return;
        }
      } catch (err: any) {
        const errStr = (err?.message || '') + ' ' + (err?.status || '');
        const isQuota = errStr.includes('429') || errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED');

        console.warn(`Model ${model} stream issue (${err?.message || err}). ${isQuota ? 'Quota exhausted, skipping to next model immediately...' : 'Attempting unary fallback...'}`);

        // If it's a 429 quota error, do NOT try unary on this same model, jump to next model!
        if (!hasYieldedText && !isQuota) {
          try {
            const unaryResponse = await this.genAI.models.generateContent({
              model,
              contents,
              config,
            });

            const candidate = unaryResponse.candidates?.[0];
            const groundingMeta = candidate?.groundingMetadata;
            if (groundingMeta && groundingMeta.groundingChunks) {
              for (const gChunk of groundingMeta.groundingChunks) {
                if (gChunk.web?.uri) {
                  const url = gChunk.web.uri;
                  const title = gChunk.web.title || new URL(url).hostname;
                  if (!extractedSources.some((s) => s.url === url)) {
                    extractedSources.push({ title, url });
                  }
                }
              }
            }

            const fullText = unaryResponse.text || '';
            if (fullText) {
              hasYieldedText = true;
              const sliceSize = 35;
              for (let i = 0; i < fullText.length; i += sliceSize) {
                yield { type: 'chunk', data: fullText.slice(i, i + sliceSize) };
                await new Promise((resolve) => setTimeout(resolve, 8));
              }
              if (extractedSources.length > 0) {
                yield { type: 'sources', data: extractedSources };
              }
              return;
            }
          } catch (unaryErr: any) {
            console.warn(`Unary fallback with ${model} failed, will try next model:`, unaryErr?.message);
          }
        }
      }
    }

    if (!hasYieldedText) {
      yield {
        type: 'chunk',
        data: '\n\nحصلت مشكلة بسيطة في الاتصال، جرّب تاني بعد لحظات.',
      };
    }
  }

  // Structured Quiz Generation for Study Mode
  public async generateQuiz(topic: string, count = 5): Promise<any> {
    if (!this.genAI) this.initGemini();
    if (!this.genAI) throw new Error('AI Service not initialized');

    const prompt = `أنت معلم ذكي وخبير في ميزان AI. قم بإنشاء اختبار قصير ممتع ودقيق عن موضوع: "${topic}".
أنشئ عدد ${count} أسئلة اختيار من متعدد (4 خيارات لكل سؤال).
يجب أن ترجع النتيجة بتنسيق JSON صحيح تمامًا بالشكل التالي:
{
  "title": "عنوان الاختبار",
  "questions": [
    {
      "id": "q1",
      "question": "نص السؤال الواضح",
      "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
      "correctIndex": 0,
      "explanation": "شرح مبسط وممتع بالعامية المصرية لسبب صحة هذا الخيار وكيف نستنتجه"
    }
  ]
}`;

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of models) {
      try {
        const res = await this.genAI.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = res.text || '{}';
        return JSON.parse(text);
      } catch (err) {
        console.warn(`Quiz generation failed on ${model}, trying fallback...`);
      }
    }
    throw new Error('فشل تنسيق الاختبار، يرجى المحاولة مرة أخرى');
  }

  // Structured Flashcards Generation
  public async generateFlashcards(topic: string, count = 6): Promise<any> {
    if (!this.genAI) this.initGemini();
    if (!this.genAI) throw new Error('AI Service not initialized');

    const prompt = `قم بإنشاء مجموعة بطاقات استذكار سريعة (Flashcards) فعالة ومبسطة لموضوع: "${topic}".
أنشئ عدد ${count} بطاقات.
يجب أن ترجع النتيجة بتنسيق JSON صحيح بالشكل التالي:
{
  "topic": "${topic}",
  "flashcards": [
    {
      "id": "fc1",
      "question": "السؤال أو المفهوم الرئيسي في وجه البطاقة",
      "answer": "الإجابة النموذجية المركزة في ظهر البطاقة بالعامية المصرية السهلة أو الفصحى",
      "hint": "تلميح سريع لتذكر الإجابة"
    }
  ]
}`;

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of models) {
      try {
        const res = await this.genAI.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = res.text || '{}';
        return JSON.parse(text);
      } catch (err) {
        console.warn(`Flashcards generation failed on ${model}, trying fallback...`);
      }
    }
    throw new Error('فشل تنسيق البطاقات، يرجى المحاولة مرة أخرى');
  }

  // Summarize Lesson or Document
  public async summarizeContent(content: string, type: 'lesson' | 'doc' = 'lesson'): Promise<string> {
    if (!this.genAI) this.initGemini();
    if (!this.genAI) throw new Error('AI Service not initialized');

    const prompt = `أنت ميزان AI. لخص المحتوى التالي بأسلوب مصري تعليمي جذاب ومنظم:
- الفكرة العامة في سطرين
- أهم النقاط والمصطلحات الرئيسية في نقاط محددة
- الخلاصة والدروس المستفادة

المحتوى:
${content.slice(0, 10000)}`;

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of models) {
      try {
        const res = await this.genAI.models.generateContent({
          model,
          contents: prompt,
        });
        if (res.text) return res.text;
      } catch (err) {
        console.warn(`Summarize failed on ${model}, trying fallback...`);
      }
    }
    return 'تعذر استخراج التلخيص';
  }
}

export const aiService = new AIService();
