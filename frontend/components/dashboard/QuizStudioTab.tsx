"use client";

import { useState } from "react";
import {
  LearningMaterial, Quiz, QuizAttemptResult, AssessmentEvaluateResponse
} from "@/lib/api";
import {
  Brain, Upload, FileText, CheckCircle2, XCircle, Award,
  ArrowLeft, ArrowRight, Check, Play, RefreshCw, Loader2,
  AlertTriangle, Info, GraduationCap, Clock, Sparkles, BookOpen
} from "lucide-react";

interface QuizStudioTabProps {
  materials: LearningMaterial[];
  onUploadSubmit: (file: File, title: string) => Promise<void>;
  onGenerateQuiz: (materialId: string, options: { num_questions: number; difficulty: string; topic?: string }) => Promise<Quiz>;
  onSubmitQuiz: (quizId: string, answers: { question_id: string; selected_option: string }[]) => Promise<{
    result: QuizAttemptResult;
    evalRes: AssessmentEvaluateResponse | null;
  }>;
  onStartCourse?: (courseId: string) => Promise<void>;
}

export default function QuizStudioTab({
  materials,
  onUploadSubmit,
  onGenerateQuiz,
  onSubmitQuiz,
  onStartCourse
}: QuizStudioTabProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<LearningMaterial | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [quizTopic, setQuizTopic] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [evaluatingResult, setEvaluatingResult] = useState<AssessmentEvaluateResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg("Please select a PDF, PPTX, or TXT document.");
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    try {
      await onUploadSubmit(uploadFile, uploadTitle);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setGeneratingQuiz(true);
    setErrorMsg(null);
    try {
      const quiz = await onGenerateQuiz(selectedMaterial.id, {
        num_questions: quizNumQuestions,
        difficulty: quizDifficulty,
        topic: quizTopic.trim() || undefined
      });
      setQuizModalOpen(false);
      setActiveQuiz(quiz);
      setUserAnswers({});
      setCurrentQIndex(0);
      setQuizResult(null);
      setEvaluatingResult(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate AI quiz.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectAnswer = (qId: string, opt: string) => {
    setUserAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  const handleSubmitAttempt = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);
    setErrorMsg(null);
    try {
      const formattedAnswers = activeQuiz.questions.map(q => ({
        question_id: q.id,
        selected_option: userAnswers[q.id] || ""
      }));
      const { result, evalRes } = await onSubmitQuiz(activeQuiz.id, formattedAnswers);
      setQuizResult(result);
      setEvaluatingResult(evalRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quiz attempt.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">RAG AI Learning & Quiz Studio</h3>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold">
              Context-Bound AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload official manuals (PDF, PPTX, TXT) to parse, chunk, embed, and generate syllabus-aligned assessments with instant competency scoring.
          </p>
        </div>

        <button
          onClick={() => { setUploadModalOpen(true); setErrorMsg(null); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* ACTIVE QUIZ PLAYER VIEW */}
      {activeQuiz && !quizResult && (
        <div className="bg-white border border-indigo-300 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded font-mono font-bold">
                  {activeQuiz.is_demo ? "DEMO RAG" : "AI RAG"}
                </span>
                <h4 className="text-base font-bold text-slate-900">{activeQuiz.title}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{activeQuiz.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Question <strong className="text-slate-900 font-bold">{currentQIndex + 1}</strong> of {activeQuiz.questions.length}
              </span>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-slate-400 hover:text-slate-700 text-xs underline ml-2"
              >
                Quit Quiz
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Active Question Card */}
          {activeQuiz.questions[currentQIndex] && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h5 className="font-bold text-slate-900 text-sm leading-relaxed">
                  {currentQIndex + 1}. {activeQuiz.questions[currentQIndex].question_text}
                </h5>
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold shrink-0">
                  {activeQuiz.questions[currentQIndex].difficulty}
                </span>
              </div>

              {/* 4 MCQ Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {activeQuiz.questions[currentQIndex].options.map((option, optIdx) => {
                  const isSelected = userAnswers[activeQuiz.questions[currentQIndex].id] === option;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectAnswer(activeQuiz.questions[currentQIndex].id, option)}
                      className={`text-left p-3.5 rounded-xl border text-xs transition flex items-center justify-between ${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-600 text-indigo-950 font-bold shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center font-bold font-mono shrink-0 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 text-slate-500"
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Source Context Snippet */}
              {activeQuiz.questions[currentQIndex].source_reference && (
                <div className="text-[11px] text-slate-600 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Verified Context Source: {activeQuiz.questions[currentQIndex].source_reference}</span>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 disabled:opacity-30 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 transition font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Previous
                </button>

                {currentQIndex < activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-4 py-2 rounded-lg transition shadow-xs"
                  >
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitAttempt}
                    disabled={submittingQuiz}
                    className="flex items-center gap-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold px-5 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {submittingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-4 h-4" />}
                    Submit Assessment
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUIZ RESULT SCREEN */}
      {quizResult && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> {quizResult.quiz_title} — Evaluation Result
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{quizResult.competency_improvement_summary}</p>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-1.5 rounded-lg border text-sm font-extrabold ${
                  quizResult.passed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {quizResult.passed ? "PASSED (≥ 60%)" : "NEEDS REVIEW"}
              </div>

              <button
                onClick={() => { setActiveQuiz(null); setQuizResult(null); }}
                className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 transition font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Done
              </button>
            </div>
          </div>

          {/* Scoreboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-indigo-600">{quizResult.score} / {quizResult.max_score}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-semibold">Correct Answers</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-cyan-600">{quizResult.percentage}%</div>
              <div className="text-xs text-slate-500 mt-0.5 font-semibold">Score Percentage</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-2xl font-black text-emerald-600">{quizResult.passed ? "Qualified" : "Review Required"}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-semibold">Assessment Outcome</div>
            </div>
          </div>

          {/* Phase 7: Dynamic Adaptive Competency Update Banner */}
          {evaluatingResult && (
            <div
              className={`p-4 rounded-xl border space-y-2 text-xs ${
                evaluatingResult.level_changed
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-indigo-50 border-indigo-200 text-indigo-900"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Competency Evidence Verified: {evaluatingResult.skill_name}
                </span>
                <span className="font-mono text-[11px] bg-white px-2.5 py-0.5 rounded text-slate-900 border border-slate-200 font-bold">
                  Level {evaluatingResult.old_level} → Level {evaluatingResult.new_level}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">{evaluatingResult.reason}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                <span>Suggested Next Difficulty: <strong className="text-slate-900">{evaluatingResult.adaptive_next_difficulty}</strong></span>
                <span>Role Benchmark Match: <strong className="text-slate-900">{evaluatingResult.updated_overall_match_percentage}%</strong></span>
              </div>
            </div>
          )}

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h5 className="font-bold text-slate-900 text-sm">Detailed Question Breakdown & Explanations</h5>
            <div className="space-y-3">
              {quizResult.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    ans.is_correct ? "bg-emerald-50/30 border-emerald-200" : "bg-rose-50/30 border-rose-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-900">
                      {idx + 1}. {ans.question_text}
                    </div>
                    {ans.is_correct ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-700 font-bold shrink-0">
                        <XCircle className="w-4 h-4 text-rose-600" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="text-slate-500">Your Selection:</span>{" "}
                      <strong className={ans.is_correct ? "text-emerald-700" : "text-rose-700"}>{ans.selected_option}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Correct Answer:</span>{" "}
                      <strong className="text-emerald-700">{ans.correct_answer}</strong>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg text-slate-700 leading-relaxed border border-slate-200 mt-2">
                    <strong className="text-indigo-700">Explanation:</strong> {ans.explanation}
                  </div>

                  {ans.source_reference && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Source Reference: {ans.source_reference}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Courses */}
          {quizResult.recommended_courses && quizResult.recommended_courses.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h5 className="font-bold text-indigo-700 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Recommended Follow-Up Training Courses
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizResult.recommended_courses.map(rc => (
                  <div key={rc.id} className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1 shadow-xs">
                    <div className="font-bold text-slate-900">{rc.title}</div>
                    <div className="text-slate-500">{rc.provider} • {rc.difficulty} • {rc.duration_hours} hrs</div>
                    {onStartCourse && (
                      <button
                        onClick={() => onStartCourse(rc.id)}
                        className="mt-2 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 transition shadow-xs"
                      >
                        <Play className="w-3 h-3" /> Enroll Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MATERIALS GRID */}
      {(!activeQuiz || quizResult) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 text-sm">Official Study Documents ({materials.length})</h4>
            <span className="text-xs text-slate-500">Select any document to trigger RAG AI quiz generation</span>
          </div>

          {materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(mat => (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                          mat.file_type === "pdf"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : mat.file_type === "pptx"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {mat.file_type}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono font-semibold">
                        {mat.chunk_count} RAG Chunks
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-sm line-clamp-1">{mat.title}</h5>
                    <p className="text-[11px] text-slate-400 font-mono truncate">{mat.file_name}</p>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {mat.content_text}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMaterial(mat);
                      setQuizModalOpen(true);
                      setErrorMsg(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs"
                  >
                    <Brain className="w-3.5 h-3.5" /> Generate AI Quiz
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-10 text-center space-y-3 shadow-xs">
              <FileText className="w-12 h-12 text-indigo-500 mx-auto opacity-50" />
              <h4 className="text-base font-bold text-slate-900">No Learning Materials Uploaded</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload survey manuals, sampling guides, or CPI instructions to build your RAG knowledge base.
              </p>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" /> Upload Study Material
              </h4>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Document File (PDF, PPTX, TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.pptx,.txt"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Custom Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CPI Survey Manual 2026"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Upload & Chunk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE QUIZ MODAL */}
      {quizModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" /> Generate AI Assessment
              </h4>
              <button onClick={() => setQuizModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">✕</button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Selected Document:</span>
              <span className="font-bold text-indigo-700">{selectedMaterial.title}</span>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleStartGeneration} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Number of Questions</label>
                <select
                  value={quizNumQuestions}
                  onChange={e => setQuizNumQuestions(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-medium"
                >
                  {[3, 4, 5, 6, 8, 10].map(n => (
                    <option key={n} value={n}>{n} Questions</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Difficulty</label>
                <select
                  value={quizDifficulty}
                  onChange={e => setQuizDifficulty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-medium"
                >
                  <option value="Easy">Easy (Foundations)</option>
                  <option value="Medium">Medium (Operational Practice)</option>
                  <option value="Hard">Hard (Methodology & Estimation)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Topic / Keyword Filter (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sampling methodology, Jevons formula"
                  value={quizTopic}
                  onChange={e => setQuizTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuizModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingQuiz}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  {generatingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                  Generate Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
