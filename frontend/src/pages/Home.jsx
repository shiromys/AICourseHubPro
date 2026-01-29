import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  const navigate = useNavigate();

  // --- 1. NEW: AUTO-REDIRECT LOGIC ---
  // If the user is already logged in, kick them to the Dashboard immediately.
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role'); // Assuming you store role in login

    if (token) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  // --- STATE ---
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingWords = ["Human Resources", "Automation", "Education", "Business Analytics"];
  const [userCount, setUserCount] = useState(0);
  const targetCount = 1000;
  const [openFaq, setOpenFaq] = useState(null);

  // --- CAROUSEL STATE ---
  const [currentCatIndex, setCurrentCatIndex] = useState(0);

  // Course Categories Data
  const categories = [
    { title: "AI for HR", icon: "👥" },
    { title: "Prompt Engineering", icon: "💬" },
    { title: "AI for Developers", icon: "💻" },
    { title: "Marketing & SEO", icon: "📈" },
    { title: "Business Strategy", icon: "📊" },
    { title: "AI Ethics & Law", icon: "⚖️" },
  ];

  // Carousel Logic (Show 3 at a time)
  const itemsToShow = 3;
  const maxIndex = categories.length - itemsToShow; 
  const isAtEnd = currentCatIndex >= maxIndex;

  const handleNextClick = () => {
    if (isAtEnd) {
      navigate('/courses');
    } else {
      setCurrentCatIndex(prev => prev + 1);
    }
  };

  const handlePrevClick = () => {
    if (currentCatIndex > 0) {
      setCurrentCatIndex(prev => prev - 1);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Typewriter Logic
  useEffect(() => {
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseTime = 700;
    const handleTyping = () => {
      const currentWord = typingWords[textIndex];
      if (isDeleting) {
        if (charIndex > 0) {
          setCharIndex(prev => prev - 1);
        } else {
          setIsDeleting(false);
          setTextIndex(prev => (prev + 1) % typingWords.length);
        }
      } else {
        if (charIndex < currentWord.length) {
          setCharIndex(prev => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      }
    };
    const timer = setTimeout(handleTyping, isDeleting ? deletingSpeed : typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  // Counter Logic
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const incrementTime = 20;
    const step = Math.ceil(targetCount / (duration / incrementTime));
    const timer = setInterval(() => {
      start += step;
      if (start >= targetCount) {
        setUserCount(targetCount);
        clearInterval(timer);
      } else {
        setUserCount(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      <Navbar />

      {/* ================= 1. HERO SECTION (GREY TO BLACK GRADIENT) ================= */}
      <div className="relative bg-gradient-to-b from-gray-800 to-black text-white pt-36 pb-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gray-700/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/50 border border-gray-700 shadow-xl mb-8 animate-fade-in-up backdrop-blur-md">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <span className="text-sm font-bold tracking-wide text-gray-300 uppercase">
              #1 AI Platform for Professionals
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-8 h-32 md:h-auto text-white">
            Master AI In <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-white">
              {typingWords[textIndex].substring(0, charIndex)}
            </span>
            <span className="animate-pulse text-red-500">|</span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Less theory. More real-life AI. Learn how to apply AI to everyday challenges, decisions, and workflows—no complexity, just clarity.
          </p>

          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900/80 border border-gray-700 rounded-full mb-10 backdrop-blur-md">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse" />
            <span className="text-lg text-gray-300">
              <strong className="text-white font-black text-xl">{userCount.toLocaleString()}+</strong> active learners
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={() => navigate('/courses')} className="px-10 py-4 bg-red-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:scale-105 transition-all duration-300 border border-red-500">
              Explore Catalog
            </button>
            <button onClick={() => navigate('/pricing')} className="px-10 py-4 bg-transparent text-white font-bold rounded-full border border-gray-500 hover:bg-white hover:text-black transition-all duration-300">
              View Pricing
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. TICKER SECTION ================= */}
      <div className="py-10 bg-white border-b border-gray-100 overflow-hidden">
        <p className="text-center text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
        <div className="relative w-full overflow-hidden group">
          <div className="flex w-[200%] animate-marquee group-hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-around w-1/2 shrink-0 gap-10 px-10">
                 {['GOOGLE', 'AMAZON', 'MICROSOFT', 'OPENAI', 'TESLA', 'NETFLIX', 'SPOTIFY'].map(company => (
                   <span key={company} className="text-3xl md:text-4xl font-black text-gray-300 select-none hover:text-black transition-colors cursor-default">
                     {company}
                   </span>
                 ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 3. FEATURES GRID ================= */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Why AICourseHubPro?</h2>
            <p className="text-lg text-gray-600">We don't just teach theory. We build competence through simulated real-world scenarios.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "10x Productivity", desc: "Automate manual work. Learn to draft emails, analyze data, and code in minutes.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { title: "Verified Certificates", desc: "Prove your skills. Earn verifiable certificates after passing rigorous exams.", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { title: "Interactive Labs", desc: "Theory is boring. Practice with real-time AI simulations designed for your job.", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-red-600 hover:-translate-y-2 transition-all duration-300 group">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 mb-6 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                </div>
                <h3 className="text-xl font-black mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 4. COURSE CATEGORIES (CAROUSEL) ================= */}
      <section className="py-24 bg-gradient-to-br from-red-900 via-red-950 to-black text-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="mb-12">
            <span className="text-red-400 font-bold uppercase tracking-wider text-sm">Explore by Niche</span>
            <h2 className="text-3xl md:text-4xl font-black mt-2 text-white">Find Your Learning Path</h2>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-6"
                style={{ transform: `translateX(-${currentCatIndex * (100 / itemsToShow)}%)` }}
              >
                {categories.map((cat, i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 w-full md:w-[calc(33.333%-16px)] p-6 bg-black/40 border border-red-900/50 rounded-xl hover:bg-black/60 hover:border-red-500 transition-all cursor-pointer group backdrop-blur-sm"
                    onClick={() => navigate('/courses')}
                  >
                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{cat.icon}</div>
                    <h3 className="text-xl font-bold mb-1 text-white">{cat.title}</h3>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
               <button 
                onClick={handlePrevClick}
                disabled={currentCatIndex === 0}
                className={`p-3 rounded-full border border-gray-600 transition-all ${currentCatIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-600 hover:border-red-600 text-white'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button 
                onClick={handleNextClick}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:bg-red-600 hover:text-white transition-all shadow-lg"
              >
                {isAtEnd ? <span>Explore More &rarr;</span> : <span>Next &rarr;</span>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 5. HOW IT WORKS ================= */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-gray-900">How You Get Certified</h2>
            <p className="text-gray-600 font-medium mt-2">From beginner to pro in 4 simple steps.</p>
          </div>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
            {[
              { step: "01", title: "Select Your Track", desc: "Choose a role-based path (HR, Dev, Marketing) so you only learn what matters." },
              { step: "02", title: "State of the art Lessons", desc: "No boring lectures. Study courses at your own pace." },
              { step: "03", title: "Pass the Assessment", desc: "Complete the course assessment with a score of 70% or higher." },
              { step: "04", title: "Earn Certificate", desc: "Download your PDF certificate to showcase your skill set." },
            ].map((item, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white bg-gray-100 group-[.is-active]:bg-red-600 text-gray-400 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-black text-lg">
                  {item.step}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-red-500 transition-colors">
                  <h3 className="text-xl font-black text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 6. TESTIMONIALS ================= */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">What Learners Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah J.", role: "HR Manager", text: "I used to spend 4 hours writing JDs. Now I do it in 5 minutes. This course paid for itself in a week." },
              { name: "Mike T.", role: "Senior Dev", text: "The 'AI for Developers' track is legit. It helped me set up Copilot properly and double my coding speed." },
              { name: "Anita R.", role: "Non-Profit Lead", text: "Finally, AI explained simply. I'm now using ChatGPT to write grant proposals and it's working!" },
            ].map((t, i) => (
              <div key={i} className="bg-gray-800 p-8 rounded-xl border border-gray-700 hover:border-red-500 transition-all">
                <div className="flex text-red-500 mb-4">★★★★★</div>
                <p className="text-gray-300 italic mb-6">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center font-bold text-white">{t.name[0]}</div>
                  <div>
                    <h4 className="font-bold">{t.name}</h4>
                    <p className="text-xs text-gray-400 uppercase">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 7. FAQ ================= */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-2xl">
          <h2 className="text-3xl font-black text-center text-gray-900 mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Do I need coding experience?", a: "Not at all. Our HR, Business, and Marketing tracks are 100% code-free. We focus on 'Prompt Engineering' using English." },
              { q: "Is the certificate recognized?", a: "Yes. Our certificates are verifiable and used by professionals to showcase skills on LinkedIn and resumes." },
              { q: "How long are the courses?", a: "Most courses are designed to be completed in 2-4 hours. They are self-paced, so you can learn whenever you have time." },
              { q: "Can I get a refund?", a: "We offer a 7-day money-back guarantee if you are not satisfied with the course content." },
            ].map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <button onClick={() => toggleFaq(i)} className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition text-left">
                  <span className="font-bold text-gray-900">{item.q}</span>
                  <span className={`transform transition-transform ${openFaq === i ? 'rotate-180' : ''} text-red-600 font-bold`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="p-5 bg-white text-gray-600 border-t border-gray-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 8. FOOTER ================= */}
      {/* 1. KEEP THIS "CALL TO ACTION" SECTION (Changed footer tag to div) */}
      <div className="bg-black text-white pt-24 pb-24 border-t border-gray-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to Future-Proof Your Career?</h2>
          <p className="text-gray-400 text-xl font-medium mb-12 max-w-2xl mx-auto">
            Join 1000+ professionals who are leading the AI revolution in their companies.
          </p>
          
          <button 
            onClick={() => navigate('/register')} 
            className="px-12 py-5 bg-red-600 text-white font-bold text-xl rounded-full shadow-2xl hover:bg-red-700 hover:scale-105 transition-all duration-300 border-2 border-red-600"
          >
            Get Started for Free
          </button>
        </div>
      </div>

      {/* 2. INSERT YOUR NEW FOOTER COMPONENT HERE */}
      <Footer />

      {/* Animation Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;