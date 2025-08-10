import Link from 'next/link';

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-lightGrey bg-warmWhite hover:bg-forest hover:text-cream transition">
    {children}
  </span>
);

export default function SocialLinks() {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Email */}
      <Link href="mailto:info@abrahamoflondon.org" aria-label="Email">
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 5h18v14H3V5zm0 0l9 7 9-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconWrap>
      </Link>

      {/* Phone */}
      <Link href="tel:+442086225909" aria-label="Phone">
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 5.2 2 2 0 0 1 4.11 3h2a2 2 0 0 1 2 1.72c.13.98.35 1.94.66 2.85a2 2 0 0 1-.45 2.11L7.09 10.91a16 16 0 0 0 6 6l1.23-1.23a2 2 0 0 1 2.11-.45c.91.31 1.87.53 2.85.66A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconWrap>
      </Link>

      {/* LinkedIn */}
      <Link
        href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
      >
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M4.98 3.5C4.98 4.6 4.1 5.5 3 5.5S1.02 4.6 1.02 3.5 1.9 1.5 3 1.5s1.98.9 1.98 2zM.5 8.5h5v14h-5v-14zm7.5 0h4.8v1.9h.1c.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.2 3.4 6.2 7.8v9h-5v-8c0-1.9 0-4.4-2.7-4.4-2.7 0-3.1 2.1-3.1 4.3v8.1h-5v-16z"/>
          </svg>
        </IconWrap>
      </Link>

      {/* X / Twitter */}
      <Link
        href="https://x.com/AbrahamAda48634?t=vXINB5EdYjhjr-eeb6tnjw&s=09"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
      >
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M3 3h4.6l4.2 6 4.8-6H23l-7.6 9.6L21 21h-4.6l-4.4-6.4L6.6 21H1l8.2-10.3L3 3z"/>
          </svg>
        </IconWrap>
      </Link>

      {/* Facebook */}
      <Link
        href="https://www.facebook.com/share/1MRrKpUzMG/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.2V12h2.2V9.8c0-2.2 1.3-3.5 3.4-3.5.98 0 2 .18 2 .18v2.2h-1.1c-1.1 0-1.5.68-1.5 1.4V12h2.5l-.4 2.9h-2.1v7A10 10 0 0 0 22 12"/>
          </svg>
        </IconWrap>
      </Link>

      {/* WhatsApp */}
      <Link href="https://wa.me/+447496334022" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        <IconWrap>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M20 3.9A10 10 0 0 0 3.4 17.7L2 22l4.4-1.3A10 10 0 1 0 20 3.9zM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.4.7.7-2.3-.2-.3A8 8 0 1 1 12 20zm4.6-5.3c-.3-.2-1.7-.9-1.9-1-.2-.1-.3-.2-.5 0-.1.2-.6.7-.7.8-.1.1-.3.1-.6 0a6.5 6.5 0 0 1-2-1.3 7.3 7.3 0 0 1-1.3-1.9c-.1-.3 0-.4.1-.6l.6-.8c.1-.2.1-.3 0-.5 0-.2-.5-1.3-.7-1.7-.2-.4-.4-.3-.5-.3h-.4c-.1 0-.4.1-.7.3-.3.2-1 1-1 2.3s1.1 2.6 1.2 2.8c.1.2 2.1 3.2 5 4.3.7.3 1.2.4 1.6.6.7.2 1.2.2 1.6.1.5-.1 1.7-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/>
          </svg>
        </IconWrap>
      </Link>
    </div>
  );
}
