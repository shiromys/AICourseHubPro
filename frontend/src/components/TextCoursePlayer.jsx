import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, CheckCircle, PlayCircle, FileText, Menu, BookOpen, Award, MessageSquare } from 'lucide-react';
import API_BASE_URL from '../config';
import RoleplayLesson from './RoleplayLesson'; // <--- IMPORTED HERE

const TextCoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Navigation State
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  // Quiz State
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    fetchCourseAndProgress();
  }, [id]);

  const fetchCourseAndProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const foundCourse = response.data.find(c => c.id === parseInt(id));
      
      if (foundCourse) {
        setCourse(foundCourse);
        try {
          const progressRes = await axios.get(`${API_BASE_URL}/api/enrollment/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (progressRes.data && progressRes.data.last_module_index != null) {
             setActiveModuleIndex(progressRes.data.last_module_index);
             setActiveLessonIndex(progressRes.data.last_lesson_index);
          }
        } catch (err) {
          console.log("No progress found, starting fresh.");
        }
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const modules = course?.modules || course?.course_data?.modules || [];
  const currentModule = modules[activeModuleIndex];
  const currentLesson = currentModule?.lessons[activeLessonIndex];

  const saveProgress = async (modIdx, lesIdx, status = 'in-progress', quizScore = null) => {
    try {
      const token = localStorage.getItem('token');
      const totalModules = modules.length;
      let progressPercent = 0;

      if (status === 'completed') {
        progressPercent = 100;
      } else {
        progressPercent = Math.round(((modIdx + 1) / totalModules) * 100);
        if (progressPercent > 90) progressPercent = 90;
      }

      await axios.post(`${API_BASE_URL}/api/update-progress`, {
        course_id: course.id,
        progress: progressPercent,
        status: status,
        score: quizScore,
        module_idx: modIdx,
        lesson_idx: lesIdx
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleLessonChange = (modIdx, lesIdx) => {
      setActiveModuleIndex(modIdx);
      setActiveLessonIndex(lesIdx);
      resetQuiz();
      saveProgress(modIdx, lesIdx, 'in-progress'); 
      window.scrollTo(0, 0);
  };

  const goToNextLesson = () => {
    const currentModuleLessons = modules[activeModuleIndex].lessons;
    let nextM = activeModuleIndex;
    let nextL = activeLessonIndex;

    if (activeLessonIndex < currentModuleLessons.length - 1) {
      nextL = activeLessonIndex + 1;
    } else if (activeModuleIndex < modules.length - 1) {
      nextM = activeModuleIndex + 1;
      nextL = 0;
    }
    
    setActiveModuleIndex(nextM);
    setActiveLessonIndex(nextL);
    resetQuiz();
    window.scrollTo(0, 0);
    saveProgress(nextM, nextL, 'in-progress');
  };

  const goToPrevLesson = () => {
    let prevM = activeModuleIndex;
    let prevL = activeLessonIndex;

    if (activeLessonIndex > 0) {
      prevL = activeLessonIndex - 1;
    } else if (activeModuleIndex > 0) {
      prevM = activeModuleIndex - 1;
      const prevModuleLessons = modules[prevM].lessons;
      prevL = prevModuleLessons.length - 1;
    }

    setActiveModuleIndex(prevM);
    setActiveLessonIndex(prevL);
    resetQuiz();
    window.scrollTo(0, 0);
    saveProgress(prevM, prevL, 'in-progress');
  };

  const isFirstLesson = activeModuleIndex === 0 && activeLessonIndex === 0;
  const isLastLesson = activeModuleIndex === modules.length - 1 && activeLessonIndex === modules[modules.length - 1].lessons.length - 1;

  // --- QUIZ FUNCTIONS ---
  const handleOptionSelect = (qIndex, optionKey) => {
    if (showResults) return; 
    setUserAnswers({ ...userAnswers, [qIndex]: optionKey });
  };

  const submitQuiz = () => {
    if (!currentLesson?.questions) return;
    let calculatedScore = 0;
    const totalQuestions = currentLesson.questions.length;

    currentLesson.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correct_answer) calculatedScore++;
    });

    setScore(calculatedScore);
    const percentage = (calculatedScore / totalQuestions) * 100;
    const isPassed = percentage >= 60;
    
    setPassed(isPassed);
    setShowResults(true);
    
    if (isPassed) {
      saveProgress(activeModuleIndex, activeLessonIndex, 'completed', percentage);
    }
    window.scrollTo(0, 0);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setShowResults(false);
    setScore(0);
    setPassed(false);
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-bold">Loading...</div>;
  if (!course) return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Course not found.</div>;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col flex-shrink-0 relative z-20`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <button onClick={() => navigate('/dashboard')} className="mb-2 text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 transition">
             <ChevronLeft size={14} /> Back to Dashboard
           </button>
           <h2 className="font-bold text-sm text-gray-900 leading-tight">{course.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {modules.map((module, mIdx) => (
            <div key={mIdx} className="border-b border-gray-100">
              <div className="px-4 py-3 bg-gray-50/50 font-bold text-xs text-gray-400 uppercase tracking-wider">
                {module.title}
              </div>
              <div>
                {module.lessons.map((lesson, lIdx) => {
                  const isActive = mIdx === activeModuleIndex && lIdx === activeLessonIndex;
                  // Determine Icon based on type
                  let Icon = FileText;
                  if (lesson.type === 'video') Icon = PlayCircle;
                  if (lesson.type === 'roleplay') Icon = MessageSquare; 
                  
                  return (
                    <button
                      key={lIdx}
                      onClick={() => handleLessonChange(mIdx, lIdx)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 text-sm transition border-l-4 ${
                        isActive 
                        ? 'bg-red-50 border-red-600 text-red-700 font-medium' 
                        : 'border-transparent text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                        <Icon size={16} className="mt-0.5 shrink-0" />
                        <span>{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 left-4 z-10 p-2 bg-white border border-gray-200 rounded shadow-sm text-gray-600 hover:text-red-600 transition">
          <Menu size={20} />
        </button>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex justify-center">
          <div className="max-w-4xl w-full pt-8">
            {currentLesson ? (
              <div className="animate-fade-in">
                  
                  {/* Header */}
                  <div className="border-b border-gray-100 pb-6 mb-8">
                      <span className="text-red-600 font-bold text-xs uppercase tracking-wide">{currentModule?.title}</span>
                      <h1 className="text-3xl font-black text-gray-900 mt-2">{currentLesson.title}</h1>
                  </div>

                  {/* --- 1. VIDEO RENDERER --- */}
                  {currentLesson.type === 'video' && (
                      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg mb-8">
                          <iframe src={currentLesson.content} className="w-full h-full" frameBorder="0" allowFullScreen title="Video Player" />
                      </div>
                  )}

                  {/* --- 2. TEXT RENDERER --- */}
                  {currentLesson.type === 'text' && (
                    <div className="prose prose-lg max-w-none text-gray-700">
                      {Array.isArray(currentLesson.content) ? (
                        <ul className="space-y-4 list-disc pl-6">{currentLesson.content.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                      )}
                    </div>
                  )}

                  {/* --- 3. AI ROLEPLAY RENDERER (NEW) --- */}
                  {currentLesson.type === 'roleplay' && (
                    <RoleplayLesson 
                      lesson={currentLesson} 
                      onNext={goToNextLesson} 
                      onPrevious={goToPrevLesson} // <--- NEW: Pass the previous function
                      onComplete={(score) => {
                        saveProgress(activeModuleIndex, activeLessonIndex, 'completed', score);
                      }}
                    />
                  )}
                  

                  {/* --- 4. QUIZ RENDERER --- */}
                  {currentLesson.type === 'quiz' && currentLesson.questions && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                      {showResults ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center space-y-6">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {passed ? <CheckCircle size={40} /> : <div className="text-3xl font-bold">X</div>}
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{passed ? "Assessment Passed!" : "Assessment Failed"}</h2>
                            <p className="text-gray-500 text-lg">You scored <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}</span> / <span className="font-bold">{currentLesson.questions.length}</span></p>
                          </div>
                          <div className="flex gap-4 pt-4">
                            <button onClick={resetQuiz} className="px-6 py-2 bg-white text-gray-700 font-bold border border-gray-300 rounded-lg hover:bg-gray-50">Retake Quiz</button>
                            {passed && (
                              <button onClick={() => navigate(`/certificate/${course.id}`)} className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg">
                                <Award size={18} /> View Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 space-y-8">
                          {currentLesson.questions.map((q, qIdx) => (
                            <div key={qIdx} className="space-y-3">
                              <p className="font-bold text-gray-900 text-lg"><span className="text-gray-400 mr-2">{qIdx + 1}.</span> {q.question}</p>
                              <div className="space-y-2 pl-4">
                                {Object.entries(q.options).map(([key, text]) => {
                                  const isSelected = userAnswers[qIdx] === key;
                                  return (
                                    <div key={key} onClick={() => handleOptionSelect(qIdx, key)} className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-red-50 border-red-500 ring-1 ring-red-500 text-red-900 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 bg-white ${isSelected ? 'border-red-600' : 'border-gray-300'}`}>{isSelected && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}</div>
                                      <span>{text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div className="pt-6 text-right">
                            <button onClick={submitQuiz} disabled={Object.keys(userAnswers).length < currentLesson.questions.length} className="px-8 py-3 bg-red-600 text-white font-bold rounded shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition">Submit Answers</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FOOTER NAV (Hidden for Quiz & Roleplay) */}
                  {currentLesson.type !== 'quiz' && currentLesson.type !== 'roleplay' && (
                    <div className="mt-16 flex justify-between border-t border-gray-100 pt-8">
                      <button onClick={goToPrevLesson} disabled={isFirstLesson} className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50 transition">&larr; Previous Lesson</button>
                      <button onClick={goToNextLesson} disabled={isLastLesson} className="px-6 py-3 rounded-lg bg-gray-900 text-white font-bold hover:bg-black disabled:opacity-50 transition flex items-center gap-2">Next Lesson &rarr;</button>
                    </div>
                  )}
              </div>
            ) : (
              <div className="text-center mt-20 text-gray-400"><p>Select a lesson to start.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCoursePlayer;