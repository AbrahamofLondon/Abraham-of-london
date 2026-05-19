"use client";

/**
 * Offers human review / challenge / appeal when the reading
 * has high consequence or the user's situation doesn't fit.
 */

type Props = {
  context: string;
  showChallenge?: boolean;
  showHumanReview?: boolean;
  showDoesNotFit?: boolean;
  supportEmail?: string;
  className?: string;
};

export default function HumanReviewPrompt({
  context,
  showChallenge = true,
  showHumanReview = true,
  showDoesNotFit = true,
  supportEmail = "support@abrahamoflondon.org",
  className = "",
}: Props) {
  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
        Review options
      </div>

      <div className="space-y-2">
        {showChallenge && (
          <a
            href={`mailto:${supportEmail}?subject=Challenge reading: ${encodeURIComponent(context)}&body=I would like to challenge the reading for: ${encodeURIComponent(context)}%0A%0AThe reason is:%0A`}
            className="block text-sm text-zinc-400 hover:text-amber-400/80 transition-colors leading-6"
          >
            Challenge this reading
          </a>
        )}
        {showHumanReview && (
          <a
            href={`mailto:${supportEmail}?subject=Request human review: ${encodeURIComponent(context)}&body=I would like a human review of my ${encodeURIComponent(context)} results.%0A%0AMy reference:%0A`}
            className="block text-sm text-zinc-400 hover:text-amber-400/80 transition-colors leading-6"
          >
            Request human review
          </a>
        )}
        {showDoesNotFit && (
          <a
            href={`mailto:${supportEmail}?subject=Reading does not fit: ${encodeURIComponent(context)}&body=The reading for ${encodeURIComponent(context)} does not fit my situation because:%0A`}
            className="block text-sm text-zinc-400 hover:text-amber-400/80 transition-colors leading-6"
          >
            This does not fit my situation
          </a>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-600 leading-5">
        All readings can be challenged or reviewed. Contact{" "}
        <a href={`mailto:${supportEmail}`} className="text-amber-500/50 hover:text-amber-400/70">
          {supportEmail}
        </a>{" "}
        with your reference.
      </p>
    </div>
  );
}
