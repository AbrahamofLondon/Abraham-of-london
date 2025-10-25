"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [4359],
  {
    4359: function (e, r, t) {
      t.d(r, {
        tl: function () {
          return j;
        },
        ZP: function () {
          return N;
        },
      });
      var l = t(5893),
        o = t(726),
        a = t.n(o),
        s = t(5675),
        n = t.n(s),
        i = t(1664),
        d = t.n(i),
        c = t(7294),
        u = t(512);
      let m = {
        info: "bg-zinc-50 border-zinc-200",
        key: "bg-amber-50 border-amber-200",
        caution: "bg-rose-50 border-rose-200",
      };
      var h = t(1041);
      let b = function () {
        let e =
          arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
        return e.startsWith("/") || e.startsWith("#");
      };
      function f(e) {
        if (null == e) return;
        if ("number" == typeof e) return e;
        let r = parseInt(String(e).replace(/[^\d]/g, ""), 10);
        return Number.isFinite(r) ? r : void 0;
      }
      let x = function () {
          for (var e = arguments.length, r = Array(e), t = 0; t < e; t++)
            r[t] = arguments[t];
          return r.filter(Boolean).join(" ");
        },
        p = {
          info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100",
          key: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100",
          caution:
            "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-100",
          success:
            "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-100",
        };
      function g(e) {
        let { children: r, className: t } = e;
        return (0, l.jsxs)("span", {
          className: x(
            "inline-flex items-center rounded-full border border-lightGrey bg-warmWhite/70 px-2.5 py-1 text-xs font-medium",
            t,
          ),
          children: ["\xa0 \xa0 \xa0 ", r, "\xa0 \xa0 "],
        });
      }
      function y(e) {
        if (!e) return null;
        if (/^[a-zA-Z0-9_-]{11}$/.test(e)) return e;
        try {
          let r = new URL(e);
          if (r.hostname.includes("youtu.be"))
            return r.pathname.replace("/", "") || null;
          if (r.hostname.includes("youtube.com")) {
            if (r.searchParams.get("v")) return r.searchParams.get("v");
            let e = r.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
            if (e) return e[2];
          }
        } catch (e) {}
        return null;
      }
      let w = (e) => {
          let { id: r, url: t, title: o, className: a, start: s } = e,
            n = r || y(t || "");
          if (!n) return null;
          let i = new URL("https://www.youtube-nocookie.com/embed/".concat(n));
          return (
            "number" == typeof s &&
              s > 0 &&
              i.searchParams.set("start", String(s)),
            (0, l.jsxs)("div", {
              className:
                "relative w-full overflow-hidden rounded-lg shadow-card ".concat(
                  a || "",
                ),
              style: { aspectRatio: "16 / 9" },
              children: [
                "\xa0 \xa0 \xa0 ",
                (0, l.jsx)("iframe", {
                  src: i.toString(),
                  title: o || "YouTube video",
                  className: "absolute inset-0 h-full w-full",
                  allow:
                    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                  allowFullScreen: !0,
                  loading: "lazy",
                  referrerPolicy: "strict-origin-when-cross-origin",
                  sandbox:
                    "allow-scripts allow-same-origin allow-presentation allow-popups",
                }),
                "\xa0 \xa0 ",
              ],
            })
          );
        },
        v = [
          "www.youtube-nocookie.com",
          "www.youtube.com",
          "youtube.com",
          "youtu.be",
          "player.vimeo.com",
          "open.spotify.com",
        ],
        j = {
          a: (e) => {
            let { href: r = "", children: t, className: o, title: a } = e,
              s =
                "text-forest underline underline-offset-2 hover:text-softGold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest dark:text-softGold dark:hover:text-cream dark:focus-visible:ring-softGold",
              n = o ? "".concat(s, " ").concat(o) : s;
            if (b(r))
              return (0, l.jsxs)(d(), {
                href: r,
                prefetch: !1,
                className: n,
                title: a,
                children: ["\xa0 \xa0 \xa0 \xa0 ", t, "\xa0 \xa0 \xa0 "],
              });
            let i = /^https?:\/\//i.test(r);
            return (0, l.jsxs)("a", {
              href: r,
              className: n,
              title: a,
              ...(i
                ? {
                    target: "_blank",
                    rel: "noopener noreferrer",
                    "aria-label": "Opens in new tab",
                  }
                : {}),
              children: ["\xa0 \xa0 \xa0 ", t, "\xa0 \xa0 "],
            });
          },
          img: (e) => {
            let {
                src: r,
                alt: t = "",
                className: o,
                title: s,
                width: i,
                height: d,
              } = e,
              u =
                ("string" == typeof r ? r : void 0) ||
                "/assets/images/default-blog.jpg",
              m = f(i),
              h = f(d),
              [b, x] = c.useState(!1),
              p = t || (s ? String(s) : "Embedded image");
            return (0, l.jsxs)("figure", {
              className: "my-6",
              children: [
                "\xa0 \xa0 \xa0 ",
                m && h
                  ? (0, l.jsx)(n(), {
                      src: u,
                      alt: p,
                      width: m,
                      height: h,
                      sizes: "(max-width: 768px) 100vw, 800px",
                      className: o || "rounded-lg shadow-card object-cover",
                      loading: "lazy",
                      decoding: "async",
                      onLoadingComplete: () => x(!0),
                    })
                  : (0, l.jsxs)("span", {
                      className:
                        "relative block h-96 w-full overflow-hidden rounded-lg shadow-card ".concat(
                          o || "",
                        ),
                      children: [
                        "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                        (0, l.jsx)(n(), {
                          src: u,
                          alt: p,
                          fill: !0,
                          sizes: "100vw",
                          className: "object-cover",
                          loading: "lazy",
                          decoding: "async",
                          onLoadingComplete: () => x(!0),
                        }),
                        "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                        !b &&
                          (0, l.jsxs)(l.Fragment, {
                            children: [
                              "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                              (0, l.jsx)(a(), {
                                id: "78b1f826df014d95",
                                children:
                                  "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 @keyframes shimmer {\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 0% { background-position: -200% 0; }\n\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 100% { background-position: 200% 0; }\n\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 }\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                              }),
                              "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                              (0, l.jsx)("span", {
                                "aria-hidden": "true",
                                className:
                                  "jsx-78b1f826df014d95 " +
                                  "absolute inset-0 ".concat(
                                    "bg-gradient-to-r from-lightGrey/20 via-lightGrey/40 to-lightGrey/20 animate-[shimmer_1.8s_linear_infinite]",
                                  ),
                              }),
                              "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                            ],
                          }),
                        "\xa0 \xa0 \xa0 \xa0 ",
                      ],
                    }),
                "\xa0 \xa0 \xa0 ",
                s &&
                  (0, l.jsxs)("figcaption", {
                    className:
                      "mt-2 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
                    children: [
                      "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                      s,
                      "\xa0 \xa0 \xa0 \xa0 ",
                    ],
                  }),
                "\xa0 \xa0 ",
              ],
            });
          },
          YouTube: w,
          iframe: (e) => {
            let {
                src: r = "",
                title: t = "Embedded content",
                className: o,
                ...a
              } = e,
              s = null;
            try {
              s = new URL(r);
            } catch (e) {}
            if (!(s && v.some((e) => s.hostname.endsWith(e))))
              return (0, l.jsx)("div", {
                className:
                  "my-6 rounded-md border p-4 text-sm text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
                children:
                  "\xa0 \xa0 \xa0 \xa0 Embedded content blocked for security. Allowed: YouTube, Vimeo, Spotify. \xa0 \xa0 \xa0 ",
              });
            if (
              s.hostname.includes("youtube.com") ||
              s.hostname.includes("youtu.be")
            ) {
              let e = y(r);
              if (e) return (0, l.jsx)(w, { id: e, title: t, className: o });
            }
            return (0, l.jsxs)("div", {
              className:
                "relative w-full overflow-hidden rounded-lg shadow-card ".concat(
                  o || "",
                ),
              style: { aspectRatio: "16 / 9" },
              children: [
                "\xa0 \xa0 \xa0 ",
                (0, l.jsx)("iframe", {
                  src: r,
                  title: t,
                  className: "absolute inset-0 h-full w-full",
                  allow:
                    "autoplay; fullscreen; picture-in-picture; encrypted-media",
                  allowFullScreen: !0,
                  loading: "lazy",
                  referrerPolicy: "strict-origin-when-cross-origin",
                  sandbox:
                    "allow-scripts allow-same-origin allow-presentation allow-popups",
                  ...a,
                }),
                "\xa0 \xa0 ",
              ],
            });
          },
          EventJsonLd: function (e) {
            let r = {
              "@context": "https://schema.org",
              "@type": "Event",
              ...e,
            };
            return (0, l.jsx)("script", {
              type: "application/ld+json",
              dangerouslySetInnerHTML: { __html: JSON.stringify(r) },
            });
          },
          PullLine: function (e) {
            let { className: r, subtle: t, ...o } = e;
            return (0, l.jsx)("p", {
              ...o,
              className: (0, u.Z)(
                "my-6 text-lg md:text-xl leading-snug",
                t ? "font-medium text-zinc-600" : "font-semibold text-zinc-800",
                "border-l-2 pl-4 border-zinc-200",
                r,
              ),
            });
          },
          Verse: function (e) {
            let { children: r, cite: t, className: o } = e;
            return (0, l.jsxs)("blockquote", {
              className: (0, u.Z)(
                "my-6 border-l-2 pl-4 italic text-zinc-700",
                o,
              ),
              "aria-label": t ? "Scripture: ".concat(t) : "Scripture",
              children: [
                (0, l.jsx)("p", {
                  className: "not-italic font-medium",
                  children: r,
                }),
                t &&
                  (0, l.jsxs)("footer", {
                    className: "mt-1 text-sm text-zinc-500",
                    children: ["— ", t],
                  }),
              ],
            });
          },
          Rule: function () {
            return (0, l.jsx)("hr", {
              className: "my-10 border-t border-zinc-200",
            });
          },
          Note: function (e) {
            let { tone: r = "info", title: t, children: o, className: a } = e;
            return (0, l.jsxs)("aside", {
              className: (0, u.Z)(
                "my-6 rounded-xl border p-4 md:p-5 text-zinc-800 leading-relaxed",
                m[r],
                a,
              ),
              role: "note",
              "aria-label": null != t ? t : "Note",
              children: [
                t &&
                  (0, l.jsx)("div", {
                    className: "mb-1 font-semibold tracking-tight",
                    children: t,
                  }),
                (0, l.jsx)("div", { className: "[&>p]:my-2", children: o }),
              ],
            });
          },
          ResourcesCTA: h.Z,
          CTA: h.Z,
          JsonLd: function (e) {
            let { data: r, type: t = "application/ld+json", ...o } = e;
            return (0, l.jsx)("script", {
              type: t,
              dangerouslySetInnerHTML: { __html: JSON.stringify(r) },
              ...o,
            });
          },
          HeroEyebrow: function (e) {
            let { children: r, className: t } = e;
            return (0, l.jsxs)("div", {
              className: x(
                "mb-3 inline-flex items-center gap-2 rounded-full border border-lightGrey/70 bg-warmWhite/70 px-3 py-1 text-xs tracking-wide uppercase text-[color:var(--color-on-secondary)/0.7] dark:text-[color:var(--color-on-primary)/0.8]",
                t,
              ),
              children: ["\xa0 \xa0 \xa0 ", r, "\xa0 \xa0 "],
            });
          },
          Callout: function (e) {
            let { title: r, tone: t = "info", children: o, className: a } = e;
            return (0, l.jsxs)("div", {
              className: x("my-4 rounded-xl border p-4 shadow-card", p[t], a),
              children: [
                "\xa0 \xa0 \xa0 ",
                r &&
                  (0, l.jsx)("div", {
                    className: "mb-2 font-semibold tracking-wide",
                    children: r,
                  }),
                "\xa0 \xa0 \xa0 ",
                (0, l.jsx)("div", {
                  className: "space-y-2 text-[0.95rem] leading-relaxed",
                  children: o,
                }),
                "\xa0 \xa0 ",
              ],
            });
          },
          Badge: g,
          BadgeRow: function (e) {
            let { items: r = [], className: t } = e;
            return (0, l.jsxs)("div", {
              className: x("my-4 flex flex-wrap items-center gap-2", t),
              children: [
                "\xa0 \xa0 \xa0 ",
                r.map((e, r) => (0, l.jsx)(g, { children: e }, r)),
                "\xa0 \xa0 ",
              ],
            });
          },
          ShareRow: function (e) {
            let { text: r, hashtags: t } = e,
              o = window.location.href,
              a = "https://twitter.com/intent/tweet?text="
                .concat(encodeURIComponent(r), "&url=")
                .concat(encodeURIComponent(o), "&hashtags=")
                .concat(encodeURIComponent(t));
            return (0, l.jsxs)("div", {
              className: "my-8",
              children: [
                "\xa0 \xa0 \xa0 ",
                (0, l.jsx)("a", {
                  href: a,
                  className: "aol-btn text-sm",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children:
                    "\xa0 \xa0 \xa0 \xa0 Share on Twitter \xa0 \xa0 \xa0 ",
                }),
                "\xa0 \xa0 ",
              ],
            });
          },
          BrandFrame: function (e) {
            let { children: r, title: t, subtitle: o } = e;
            return (0, l.jsxs)("div", {
              className: "border-2 border-midGreen p-4 rounded-lg",
              children: [
                "\xa0 \xa0 \xa0 ",
                t &&
                  (0, l.jsx)("h1", {
                    className: "text-2xl font-bold",
                    children: t,
                  }),
                "\xa0 \xa0 \xa0 ",
                o &&
                  (0, l.jsx)("p", {
                    className: "text-lg text-gray-600",
                    children: o,
                  }),
                "\xa0 \xa0 \xa0 ",
                r,
                "\xa0 \xa0 ",
              ],
            });
          },
          Caption: function (e) {
            return (0, l.jsx)("div", {
              className: x(
                "mt-2 text-sm text-[color:var(--color-on-secondary)/0.7] italic",
                e.className,
              ),
              ...e,
            });
          },
          Grid: function (e) {
            return (0, l.jsx)("div", {
              className: x("grid gap-4 sm:grid-cols-2", e.className),
              ...e,
            });
          },
          Quote: function (e) {
            return (0, l.jsx)("blockquote", {
              className: x(
                "border-l-4 border-lightGrey pl-4 italic",
                e.className,
              ),
              ...e,
            });
          },
          DownloadCard: function (e) {
            let { title: r, href: t, description: o, image: a } = e;
            return (0, l.jsxs)("a", {
              href: t,
              className:
                "group block rounded-2xl border border-lightGrey bg-white p-4 shadow-card transition hover:shadow-cardHover",
              children: [
                "\xa0 \xa0 \xa0 ",
                (0, l.jsxs)("div", {
                  className: "flex items-center gap-4",
                  children: [
                    "\xa0 \xa0 \xa0 \xa0 ",
                    a
                      ? (0, l.jsxs)("span", {
                          className:
                            "relative h-16 w-16 overflow-hidden rounded-lg",
                          children: [
                            "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                            "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                            (0, l.jsx)(n(), {
                              src: a,
                              alt: r || "Download cover image",
                              fill: !0,
                              className: "object-cover",
                              loading: "lazy",
                              sizes: "64px",
                            }),
                            "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                          ],
                        })
                      : null,
                    "\xa0 \xa0 \xa0 \xa0 ",
                    (0, l.jsxs)("div", {
                      className: "min-w-0",
                      children: [
                        "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                        (0, l.jsxs)("div", {
                          className:
                            "truncate text-lg font-semibold text-deepCharcoal",
                          children: [" ", r, " "],
                        }),
                        "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                        o
                          ? (0, l.jsxs)("div", {
                              className:
                                "mt-1 line-clamp-2 text-sm text-[color:var(--color-on-secondary)/0.8]",
                              children: [
                                "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                                o,
                                "\xa0 \xa0 \xa0 \xa0 \xa0 \xa0 ",
                              ],
                            })
                          : null,
                        "\xa0 \xa0 \xa0 \xa0 \xa0 ",
                        (0, l.jsx)("div", {
                          className: "mt-2 text-sm text-softGold",
                          children: "Download →",
                        }),
                        "\xa0 \xa0 \xa0 \xa0 ",
                      ],
                    }),
                    "\xa0 \xa0 \xa0 ",
                  ],
                }),
                "\xa0 \xa0 ",
              ],
            });
          },
          h1: (e) => (0, l.jsx)("h2", { ...e }),
          ul: (e) =>
            (0, l.jsx)("ul", { className: "list-disc pl-6 space-y-2", ...e }),
          ol: (e) =>
            (0, l.jsx)("ol", {
              className: "list-decimal pl-6 space-y-2",
              ...e,
            }),
          p: (e) => (0, l.jsx)("p", { className: "leading-7", ...e }),
          hr: (e) =>
            (0, l.jsx)("hr", { className: "my-10 border-lightGrey", ...e }),
          blockquote: (e) =>
            (0, l.jsx)("blockquote", {
              className: "border-l-4 border-lightGrey pl-4 italic",
              ...e,
            }),
        };
      var N = j;
    },
    1041: function (e, r, t) {
      t.d(r, {
        Z: function () {
          return d;
        },
      });
      var l = t(5893),
        o = t(1664),
        a = t.n(o);
      let s = {
          fatherhood: {
            title: "Explore Fatherhood Resources",
            reads: [
              {
                href: "/blog/leadership-begins-at-home",
                label: "Leadership Begins at Home",
                sub: "Lead from the inside out",
              },
              {
                href: "/blog/the-brotherhood-code",
                label: "The Brotherhood Code",
                sub: "Build your band of brothers",
              },
              {
                href: "/blog/reclaiming-the-narrative",
                label: "Reclaiming the Narrative",
                sub: "Court-season clarity",
              },
            ],
            downloads: [
              {
                href: "/downloads/Fatherhood_Guide.pdf",
                label: "Fatherhood Guide",
              },
              {
                href: "/downloads/Mentorship_Starter_Kit.pdf",
                label: "Mentorship Starter Kit",
              },
            ],
          },
        },
        n = [
          {
            href: "/blog/reclaiming-the-narrative",
            label: "Reclaiming the Narrative",
            sub: "Court-season clarity",
          },
          {
            href: "/blog/the-brotherhood-code",
            label: "The Brotherhood Code",
            sub: "Build your band of brothers",
          },
          {
            href: "/blog/leadership-begins-at-home",
            label: "Leadership Begins at Home",
            sub: "Lead from the inside out",
          },
        ],
        i = [
          {
            href: "/downloads/Mentorship_Starter_Kit.pdf",
            label: "Mentorship Starter Kit",
          },
          {
            href: "/downloads/Leadership_Playbook.pdf",
            label: "Leadership Playbook (30•60•90)",
          },
          {
            href: "/downloads/Entrepreneur_Operating_Pack.pdf",
            label: "Entrepreneur Operating Pack",
          },
        ];
      function d(e) {
        var r, t, o, d;
        let c = "preset" in e ? e.preset : void 0,
          u = (c &&
          (o = String(c)) &&
          null !== (d = s[String(o).trim().toLowerCase()]) &&
          void 0 !== d
            ? d
            : null) || {
            title: ("title" in e && e.title) || "Further Reading & Tools",
            reads: ("reads" in e && e.reads) || n,
            downloads: ("downloads" in e && e.downloads) || i,
          };
        if (!u) return null;
        let m = (null !== (r = u.reads) && void 0 !== r ? r : []).filter(
            Boolean,
          ),
          h = (null !== (t = u.downloads) && void 0 !== t ? t : []).filter(
            Boolean,
          );
        return (0, l.jsxs)("section", {
          className:
            "mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ".concat(
              ("className" in e && e.className) || "",
            ),
          "aria-labelledby": "resources-cta-title",
          children: [
            (0, l.jsx)("h3", {
              id: "resources-cta-title",
              className: "mb-4 font-serif text-2xl text-forest",
              children: u.title,
            }),
            (0, l.jsxs)("div", {
              className: "grid gap-6 md:grid-cols-2",
              children: [
                !!m.length &&
                  (0, l.jsxs)("div", {
                    children: [
                      (0, l.jsx)("h4", {
                        className:
                          "mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase",
                        children: "Further Reading",
                      }),
                      (0, l.jsx)("ul", {
                        className: "space-y-2",
                        children: m.map((e) =>
                          (0, l.jsxs)(
                            "li",
                            {
                              children: [
                                !(function () {
                                  let e =
                                    arguments.length > 0 &&
                                    void 0 !== arguments[0]
                                      ? arguments[0]
                                      : "";
                                  return (
                                    e.startsWith("/") && !e.endsWith(".pdf")
                                  );
                                })(e.href)
                                  ? (0, l.jsx)("a", {
                                      href: e.href,
                                      className: "luxury-link text-forest",
                                      target: "_blank",
                                      rel: "noopener noreferrer",
                                      children: e.label,
                                    })
                                  : (0, l.jsx)(a(), {
                                      href: e.href,
                                      className: "luxury-link text-forest",
                                      prefetch: !1,
                                      children: e.label,
                                    }),
                                e.sub &&
                                  (0, l.jsxs)("span", {
                                    className:
                                      "ml-2 text-sm text-[color:var(--color-on-secondary)/0.7]",
                                    children: ["— ", e.sub],
                                  }),
                              ],
                            },
                            e.href,
                          ),
                        ),
                      }),
                    ],
                  }),
                !!h.length &&
                  (0, l.jsxs)("div", {
                    children: [
                      (0, l.jsx)("h4", {
                        className:
                          "mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase",
                        children: "Downloads",
                      }),
                      (0, l.jsx)("ul", {
                        className: "space-y-2",
                        children: h.map((e) =>
                          (0, l.jsx)(
                            "li",
                            {
                              children: (0, l.jsx)("a", {
                                href: e.href,
                                className: "luxury-link text-forest",
                                rel: "noopener",
                                download: !0,
                                children: e.label,
                              }),
                            },
                            e.href,
                          ),
                        ),
                      }),
                    ],
                  }),
              ],
            }),
          ],
        });
      }
    },
  },
]);
