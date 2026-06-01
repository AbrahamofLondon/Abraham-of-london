"use client";

/**
 * Offers human review / challenge / appeal when the reading
 * has high consequence or the user's situation doesn't fit.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Props = {
  context: string;
  showChallenge?: boolean;
  showHumanReview?: boolean;
  showDoesNotFit?: boolean;
  supportEmail?: string;
  className?: string;
  variant?: LivingThemeVariant;
};

export default function HumanReviewPrompt({
  context,
  showChallenge = true,
  showHumanReview = true,
  showDoesNotFit = true,
  supportEmail = "support@abrahamoflondon.org",
  className = "",
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.muted }}>
        Review options
      </div>

      <div className="space-y-2">
        {showChallenge && (
          <a
            href={`mailto:${supportEmail}?subject=Challenge reading: ${encodeURIComponent(context)}&body=I would like to challenge the reading for: ${encodeURIComponent(context)}%0A%0AThe reason is:%0A`}
            className="block text-sm leading-6 transition-colors"
            style={{ color: theme.body }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.link}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.body}
          >
            Challenge this reading
          </a>
        )}
        {showHumanReview && (
          <a
            href={`mailto:${supportEmail}?subject=Request human review: ${encodeURIComponent(context)}&body=I would like a human review of my ${encodeURIComponent(context)} results.%0A%0AMy reference:%0A`}
            className="block text-sm leading-6 transition-colors"
            style={{ color: theme.body }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.link}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.body}
          >
            Request human review
          </a>
        )}
        {showDoesNotFit && (
          <a
            href={`mailto:${supportEmail}?subject=Reading does not fit: ${encodeURIComponent(context)}&body=The reading for ${encodeURIComponent(context)} does not fit my situation because:%0A`}
            className="block text-sm leading-6 transition-colors"
            style={{ color: theme.body }}
            onMouseEnter={(e) => e.currentTarget.style.color = theme.link}
            onMouseLeave={(e) => e.currentTarget.style.color = theme.body}
          >
            This does not fit my situation
          </a>
        )}
      </div>

      <p className="mt-3 text-xs leading-5" style={{ color: theme.dim }}>
        All readings can be challenged or reviewed. Contact{" "}
        <a href={`mailto:${supportEmail}`} style={{ color: theme.accent }}>
          {supportEmail}
        </a>{" "}
        with your reference.
      </p>
    </div>
  );
}