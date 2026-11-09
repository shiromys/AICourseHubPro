import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaForStaticPath, metaForCourse } from '../seo/meta.js';
import { metaForPost } from '../seo/blog.js';
import { applyHead, applyPrivateHead } from '../seo/applyHead.js';

// Keeps the page's <head> (title, description, canonical, social cards, no-index, structured data)
// in step with the address, using the same details that were saved into the page at build time.
// Course pages are handled by <CourseSeo/> once their data has loaded.
export default function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
    if (/^\/courses\/[^/]+$/.test(p)) return; // the course page sets its own
    if (/^\/blog\/[^/]+$/.test(p)) return; // so does each blog article
    const meta = metaForStaticPath(p);
    if (meta) applyHead(meta);
    else applyPrivateHead(); // dashboard, certificates, admin, ...: out of search
  }, [pathname]);
  return null;
}

// A course's sales page: unique title, description, canonical address and structured data.
export function CourseSeo({ course }) {
  useEffect(() => {
    if (course) applyHead(metaForCourse(course));
  }, [course && course.id, course && course.slug, course && course.title, course && course.description, course && course.price]);
  return null;
}

// A blog article: its own title, description, canonical address and Article structured data.
// While the text is loading the saved page's head stays; an article that does not exist is kept out of search.
export function BlogSeo({ entry, post, missing }) {
  useEffect(() => {
    if (entry && post) applyHead(metaForPost(entry, post));
  }, [entry && entry.slug, post && post.title, post && post.updatedAt]);
  useEffect(() => {
    if (missing) applyPrivateHead();
  }, [missing]);
  return null;
}
