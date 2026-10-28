import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import GuestCheckoutModal from '../components/GuestCheckoutModal';

// One place for "buy this course", used by CourseView, Courses and the dashboard.
//
//   const { startCheckout, buyingId, checkoutModal } = useCheckout();
//   ...  onClick={() => startCheckout(course)}   and render {checkoutModal} once.
//
// Logged-in users go straight to Stripe (the server refuses if they already own it
// and we send them to the course). Guests are asked for their email first so the
// server can check ownership BEFORE any money moves.
export default function useCheckout() {
  const navigate = useNavigate();
  const [buyingId, setBuyingId] = useState(null);
  const [guestCourse, setGuestCourse] = useState(null); // {id, title} while the email modal is open
  const [busy, setBusy] = useState(false);

  const createSession = useCallback(async (courseId, email) => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/create-checkout-session`,
        email ? { course_id: courseId, email } : { course_id: courseId },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      if (res.data?.url) {
        window.location.href = res.data.url;
        return { ok: true };
      }
      return { ok: false, message: 'Payment gateway error. Please try again.' };
    } catch (err) {
      const data = err.response?.data || {};
      if (err.response?.status === 409 && data.code === 'already_owned') {
        return { ok: false, alreadyOwned: true, message: data.message };
      }
      return { ok: false, message: data.message || data.error || 'Could not start payment. Please try again.' };
    }
  }, []);

  const startCheckout = useCallback(async (course) => {
    if (!course) return;
    const token = localStorage.getItem('token');

    if (!token) {
      setGuestCourse({ id: course.id, title: course.title });
      return;
    }

    setBuyingId(course.id);
    const result = await createSession(course.id);
    if (!result.ok) {
      setBuyingId(null);
      if (result.alreadyOwned) {
        navigate(`/courses/${course.id}`); // they own it - just open it
      } else {
        alert(result.message);
      }
    }
    // on success the browser is already navigating to Stripe
  }, [createSession, navigate]);

  const submitGuestEmail = useCallback(async (email) => {
    if (!guestCourse) return { ok: false, message: 'Something went wrong.' };
    setBusy(true);
    setBuyingId(guestCourse.id);
    const result = await createSession(guestCourse.id, email);
    if (!result.ok) {
      setBusy(false);
      setBuyingId(null);
    }
    return result;
  }, [guestCourse, createSession]);

  const checkoutModal = (
    <GuestCheckoutModal
      open={!!guestCourse}
      courseTitle={guestCourse?.title}
      busy={busy}
      onClose={() => { setGuestCourse(null); setBusy(false); setBuyingId(null); }}
      onSubmit={submitGuestEmail}
    />
  );

  return { startCheckout, buyingId, checkoutModal };
}
