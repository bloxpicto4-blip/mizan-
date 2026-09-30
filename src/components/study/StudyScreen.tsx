import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  HelpCircle,
  Layers,
  FileText,
  CheckCircle2,
  XCircle,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  Award,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { QuizQuestion, StudyFlashcard, StudySession } from '../../types';

interface StudyScreenProps {
  onStartChatWithPrompt: (prompt: string, scaffoldLevel?: number) => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ onStartChatWithPrompt }) => {
  const [activeSubTab, setActiveSubTab] = useState<'scaffold' | 'quiz' | 'flashcards' | 'summary'>('scaffold');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // Quiz state
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<StudyFlashcard[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  // Summary state
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryResult, setSummaryResult] = useState('');

  // Scaffold Homework Assistant state
  const [homeworkQuestion, setHomeworkQuestion] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  // Progressive Scaffolding Levels
  const scaffoldLevels = [
    {
      level: 1,
      title: 'المستوى 1: تلميح ذكي (Hint)',
      desc: 'فكرة سريعة تنورلك الطريق وتخليك تفكر بنفسك بدون حرق الحل.',
      color: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
    },
    {
      level: 2,
      title: 'المستوى 2: شرح المفهوم (Concept)',
      desc: 'شرح القاعدة العلمية أو الرياضية المستعملة في المسألة ببساطة.',
      color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    },
    {
      level: 3,
      title: 'المستوى 3: أول خطوة (First Step)',
      desc: 'يوضحلك البداية الصحيحة والمعادلة المبدئية وتسيبك تكمل.',
      color: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    },
    {
      level: 4,
      title: 'المستوى 4: حل تدريجي (Walkthrough)',
      desc: 'يمشي معاك خطوة بخطوة بالاشتراك معاك عشان تفهم طريقة التفكير.',
      color: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
    },
    {
      level: 5,
      title: 'المستوى 5: شرح وحل كامل (Full Solution)',
      desc: 'الحل النموذجي الكامل مع تفصيل دقيق وأهم الأخطاء الشائعة.',
      color: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    },
  ];

  // Start Scaffolding Chat
  const handleLaunchScaffold = () => {
    if (!homeworkQuestion.trim()) return;
    const prompt = `عندي سؤال أو مسألة في المذاكرة محتاج فيها مساعدة بنظام التدرج التربوي:
"${homeworkQuestion}"

محتاج تبدأ معايا بـ: [المستوى ${selectedLevel}]`;
    onStartChatWithPrompt(prompt, selectedLevel);
  };

  // Generate Quiz
  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    try {
      setLoading(true);
      const res = await api.generateQuiz(topic, 5);
      const questions = res.session.quizQuestions || [];
      setCurrentQuiz(questions);
      setQuizIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setQuizScore(null);
    } catch (e) {
      console.error(e);
      alert('حصلت مشكلة في إنشاء الاختبار، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[quizIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [quizIndex]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < currentQuiz.length - 1) {
      setQuizIndex((prev) => prev + 1);
      setShowExplanation(selectedAnswers[quizIndex + 1] !== undefined);
    } else {
      // Calculate score
      let score = 0;
      currentQuiz.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) score++;
      });
      setQuizScore(score);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Generate Flashcards
  const handleGenerateFlashcards = async () => {
    if (!topic.trim()) return;
    try {
      setLoading(true);
      const res = await api.generateFlashcards(topic, 6);
      setFlashcards(res.session.flashcards || []);
      setCardIndex(0);
      setIsFlipped(false);
      setMasteredCount(0);
    } catch (e) {
      console.error(e);
      alert('حصلت مشكلة في إنشاء البطاقات، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextCard = (mastered = false) => {
    if (mastered) setMasteredCount((prev) => prev + 1);
    setIsFlipped(false);
    if (cardIndex < flashcards.length - 1) {
      setCardIndex((prev) => prev + 1);
    }
  };

  // Summarize
  const handleSummarize = async () => {
    if (!summaryInput.trim()) return;
    try {
      setLoading(true);
      const res = await api.summarizeLesson(summaryInput);
      setSummaryResult(res.summary);
    } catch (e) {
      console.error(e);
      alert('تعذر التلخيص حاليًا، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Study Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass-panel border-amber-500/20 shadow-2xl">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <GraduationCap className="w-4 h-4" />
              <span>نظام المذاكرة الذكي والتربوي</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-sans">
              ذاكر وافهم مع MIZAN AI 📚
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              الهدف مش مجرد إجابة تاخدها كوبي وبيست! هدفنا تفهم الفكرة، تحل بنفسك، وتثبت المعلومة باختبارات وبطاقات استذكار تفاعلية.
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('scaffold')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'scaffold'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>مساعد الواجب التدريجي</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quiz')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'quiz'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>اختبار تفاعلي (Quiz)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'flashcards'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>بطاقات استذكار (Flashcards)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('summary')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeSubTab === 'summary'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>تلخيص درس ومذكرة</span>
          </button>
        </div>
      </div>

      {/* 1. Progressive Scaffolding View */}
      {activeSubTab === 'scaffold' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>حل الواجب بدون غش — اختر مستوى المساعدة:</span>
            </h3>

            {/* Level selection cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {scaffoldLevels.map((lvl) => (
                <div
                  key={lvl.level}
                  onClick={() => setSelectedLevel(lvl.level)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLevel === lvl.level
                      ? `${lvl.color} shadow-lg scale-[1.02] ring-2 ring-amber-400/50`
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold block">{lvl.title}</span>
                    <p className="text-[11px] leading-relaxed opacity-90">{lvl.desc}</p>
                  </div>
                  <div className="mt-2 text-left">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/40">
                      L{lvl.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Question Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300">
                اكتب السؤال أو المسألة اللي واقفة قدامك:
              </label>
              <textarea
                value={homeworkQuestion}
                onChange={(e) => setHomeworkQuestion(e.target.value)}
                placeholder="مثال: احسب مساحة الدائرة إذا كان نصف القطر 7 سم، أو اشرحلي قانون نيوتن التاني، أو حل المعادلة 2x + 5 = 15..."
                rows={3}
                className="w-full rounded-2xl glass-card p-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-amber-400/80 transition-all font-sans"
              />
            </div>

            <button
              onClick={handleLaunchScaffold}
              disabled={!homeworkQuestion.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>ابدأ الشرح بالمستوى {selectedLevel} في المحادثة</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Interactive Quiz View */}
      {activeSubTab === 'quiz' && (
        <div className="space-y-6">
          {currentQuiz.length === 0 ? (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100">
                أنشئ اختبار تفاعلي فوري على أي درس:
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثال: الكيمياء العضوية، تاريخ مصر الحديث، أساسيات الـ JavaScript، حساب المثلثات..."
                  className="flex-1 rounded-2xl glass-card px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-amber-400/80 transition-all"
                />
                <button
                  onClick={handleGenerateQuiz}
                  disabled={!topic.trim() || loading}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm transition-all cursor-pointer flex-shrink-0"
                >
                  {loading ? 'جاري الإنشاء...' : 'ابدأ الاختبار'}
                </button>
              </div>
            </div>
          ) : quizScore !== null ? (
            /* Quiz Completed Score Card */
            <div className="glass-panel p-8 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">عاش يا بطل! كملت الاختبار 🎉</h3>
              <p className="text-lg text-slate-300">
                نتيجتك: <span className="font-bold text-amber-400">{quizScore}</span> من{' '}
                <span className="font-bold">{currentQuiz.length}</span>
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setCurrentQuiz([]);
                    setTopic('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  اختبار موضوع تاني
                </button>
              </div>
            </div>
          ) : (
            /* Active Quiz Question Card */
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-semibold text-amber-400">
                  سؤال {quizIndex + 1} من {currentQuiz.length}
                </span>
                <span>الموضوع: {topic}</span>
              </div>

              <h4 className="text-base md:text-lg font-bold text-slate-100 leading-relaxed">
                {currentQuiz[quizIndex].question}
              </h4>

              {/* Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentQuiz[quizIndex].options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[quizIndex] === oIdx;
                  const isCorrect = currentQuiz[quizIndex].correctIndex === oIdx;
                  const hasAnswered = selectedAnswers[quizIndex] !== undefined;

                  let btnStyle = 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-200';
                  if (hasAnswered) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300 font-semibold';
                    } else if (isSelected) {
                      btnStyle = 'border-rose-500/60 bg-rose-500/20 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      disabled={hasAnswered}
                      className={`w-full text-right p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation card */}
              {showExplanation && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                  <span className="font-bold block">💡 الشرح والتوضيح:</span>
                  <p>{currentQuiz[quizIndex].explanation}</p>
                </div>
              )}

              {/* Next Question Button */}
              {selectedAnswers[quizIndex] !== undefined && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextQuizQuestion}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                  >
                    <span>{quizIndex < currentQuiz.length - 1 ? 'السؤال التالي' : 'عرض النتيجة'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Interactive Flashcards View */}
      {activeSubTab === 'flashcards' && (
        <div className="space-y-6">
          {flashcards.length === 0 ? (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-lg font-bold text-slate-100">
                أنشئ بطاقات استذكار سريعة (Flashcards):
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="مثال: مصطلحات ومفاهيم الفيزياء، كلمات إنجليزية مهمة، أوامر Git، قواعد النحو..."
                  className="flex-1 rounded-2xl glass-card px-4 py-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-amber-400/80 transition-all"
                />
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={!topic.trim() || loading}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-sm transition-all cursor-pointer flex-shrink-0"
                >
                  {loading ? 'جاري الإنشاء...' : 'أنشئ البطاقات'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 md:p-8 rounded-3xl space-y-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>بطاقة {cardIndex + 1} من {flashcards.length}</span>
                <span className="text-emerald-400 font-semibold">تم إتقان {masteredCount} بطاقة</span>
              </div>

              {/* Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full min-h-[220px] md:min-h-[260px] rounded-3xl glass-card p-6 md:p-8 border-amber-500/30 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] shadow-2xl relative"
              >
                <div className="text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1 font-mono">
                  <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>انقر للقلب ({isFlipped ? 'ظهر البطاقة - الإجابة' : 'وجه البطاقة - المفهوم'})</span>
                </div>

                <div className="my-auto space-y-3">
                  <h4 className="text-xl md:text-2xl font-bold text-slate-100">
                    {isFlipped
                      ? flashcards[cardIndex].answer
                      : flashcards[cardIndex].question}
                  </h4>
                  {!isFlipped && flashcards[cardIndex].hint && (
                    <p className="text-xs text-amber-400/80">
                      💡 تلميح: {flashcards[cardIndex].hint}
                    </p>
                  )}
                </div>

                <span className="text-[11px] text-slate-500">MIZAN AI Flashcard 🇪🇬</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleNextCard(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
                >
                  محتاج أراجعها تاني
                </button>
                <button
                  onClick={() => handleNextCard(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  عرفتها تمام! ✓
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Lesson Summary View */}
      {activeSubTab === 'summary' && (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-lg font-bold text-slate-100">
            ألصق نص الدرس أو المقال لتلخيصه بذكاء:
          </h3>
          <textarea
            value={summaryInput}
            onChange={(e) => setSummaryInput(e.target.value)}
            placeholder="ضع هنا نص المذكرة أو الفصل الدراسي..."
            rows={5}
            className="w-full rounded-2xl glass-card p-3 text-sm text-slate-100 placeholder-slate-400 outline-none focus:border-amber-400/80 transition-all font-sans"
          />
          <button
            onClick={handleSummarize}
            disabled={!summaryInput.trim() || loading}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
          >
            {loading ? 'جاري التلخيص...' : 'لخص المادة'}
          </button>

          {summaryResult && (
            <div className="p-4 rounded-2xl glass-card border-amber-500/20 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap mt-4">
              {summaryResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
