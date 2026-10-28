import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, MailX } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import NewsletterSignup from '../components/NewsletterSignup';
import API_BASE_URL from '../config';

// Landing page for the links in newsletter emails:
//   /newsletter?confirm=TOKEN      -> confirms the subscription
//   /newsletter?unsubscribe=TOKEN  -> asks for one click, then unsubscribes
//   /newsletter                    -> plain signup page
const Newsletter = () => {
  document.title = 'Weekly Digest | AICourseHubPro';
  const [params] = useSearchParams();
  const confirmToken = params.get('confirm');
  const unsubToken = params.get('unsubscribe');
  const [state, setState] = useState(confirmToken ? 'working' : 'idle'); // idle | working | ok | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!confirmToken) return;
    axios.post(`${API_BASE_URL}/api/newsletter/confirm`, { token: confirmToken })
      .then(r => { setMessage(r.data.msg); setState('ok'); })
      .catch(e => { setMessage(e.response?.data?.msg || 'Something went wrong.'); setState('error'); });
  }, [confirmToken]);

  const unsubscribe = async () => {
    setState('working');
    try {
      const r = await axios.post(`${API_BASE_URL}/api/newsletter/unsubscribe`, { token: unsubToken });
      setMessage(r.data.msg); setState('ok');
    } catch (e) {
      setMessage(e.response?.data?.msg || 'Something went wrong.'); setState('error');
    }
  };

  const Card = ({ icon, title, children }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
      <div className="flex justify-center mb-5">{icon}</div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <div className="text-gray-400">{children}</div>
    </div>
  );

  if (!confirmToken && !unsubToken) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Navbar />
        <div className="pt-20 flex-1"><NewsletterSignup source="newsletter_page" /></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-sans text-gray-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        {state === 'working' && <Loader2 className="animate-spin text-red-600" size={48} />}

        {state === 'ok' && (
          <Card icon={<CheckCircle className="text-green-500" size={56} />} title={confirmToken ? 'You\'re subscribed' : 'You\'re unsubscribed'}>
            <p className="mb-6">{message}</p>
            <Link to="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition">Back to AICourseHubPro</Link>
          </Card>)}

        {state === 'error' && (
          <Card icon={<XCircle className="text-red-500" size={56} />} title="That link didn't work">
            <p className="mb-6">{message}</p>
            <Link to="/newsletter" className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition">Subscribe again</Link>
          </Card>)}

        {state === 'idle' && unsubToken && (
          <Card icon={<MailX className="text-red-500" size={56} />} title="Unsubscribe from the weekly digest?">
            <p className="mb-6">You'll stop receiving the digest straight away. You can re-subscribe any time.</p>
            <button onClick={unsubscribe} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">Yes, unsubscribe me</button>
          </Card>)}
      </div>
    </div>
  );
};

export default Newsletter;
