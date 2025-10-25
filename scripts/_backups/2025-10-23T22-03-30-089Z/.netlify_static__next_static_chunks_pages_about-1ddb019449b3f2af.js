(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [2521],
  {
    9212: function (e, t, r) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        "/about",
        function () {
          return r(9879);
        },
      ]);
    },
    7468: function (e, t, r) {
      "use strict";
      r.d(t, {
        Z: function () {
          return s;
        },
      });
      var n = r(5893),
        i = r(9008),
        a = r.n(i);
      r(7294);
      var o = r(5998);
      function s(e) {
        let {
            title: t,
            description: r = "",
            slug: i = "/",
            coverImage: s,
            publishedTime: l,
            modifiedTime: c,
            authorName: d = "Abraham of London",
            tags: h = [],
            type: u = "article",
            appendSiteName: m,
            children: p,
          } = e,
          f = (0, o.dE)(i),
          x = s || (0, o.dE)("/assets/images/social/og-image.jpg"),
          b = /abraham of london/i.test(t),
          g = (null != m ? m : !b) ? "".concat(t, " | Abraham of London") : t,
          y =
            "article" === u
              ? {
                  "@context": "https://schema.org",
                  "@type": "Article",
                  headline: t,
                  description: r,
                  image: [x],
                  author: [{ "@type": "Person", name: d }],
                  datePublished: l || void 0,
                  dateModified: c || l || void 0,
                  mainEntityOfPage: { "@type": "WebPage", "@id": f },
                }
              : {
                  "@context": "https://schema.org",
                  "@type": "WebPage",
                  name: t,
                  description: r,
                  url: f,
                  image: x,
                };
        return (0, n.jsxs)(a(), {
          children: [
            (0, n.jsx)("title", { children: g }),
            r && (0, n.jsx)("meta", { name: "description", content: r }),
            (0, n.jsx)("link", { rel: "canonical", href: f }),
            (0, n.jsx)("meta", {
              property: "og:type",
              content: "article" === u ? "article" : "website",
            }),
            (0, n.jsx)("meta", { property: "og:title", content: t }),
            (0, n.jsx)("meta", { property: "og:description", content: r }),
            (0, n.jsx)("meta", { property: "og:url", content: f }),
            (0, n.jsx)("meta", { property: "og:image", content: x }),
            "article" === u &&
              l &&
              (0, n.jsx)("meta", {
                property: "article:published_time",
                content: l,
              }),
            "article" === u &&
              (c || l) &&
              (0, n.jsx)("meta", {
                property: "article:modified_time",
                content: c || l,
              }),
            "article" === u &&
              h.map((e) =>
                (0, n.jsx)("meta", { property: "article:tag", content: e }, e),
              ),
            (0, n.jsx)("meta", {
              name: "twitter:card",
              content: "summary_large_image",
            }),
            (0, n.jsx)("meta", { name: "twitter:title", content: t }),
            (0, n.jsx)("meta", { name: "twitter:description", content: r }),
            (0, n.jsx)("meta", { name: "twitter:image", content: x }),
            (0, n.jsx)("script", {
              type: "application/ld+json",
              dangerouslySetInnerHTML: { __html: JSON.stringify(y) },
            }),
            p,
          ],
        });
      }
    },
    1041: function (e, t, r) {
      "use strict";
      r.d(t, {
        Z: function () {
          return c;
        },
      });
      var n = r(5893),
        i = r(1664),
        a = r.n(i);
      let o = {
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
        s = [
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
        l = [
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
      function c(e) {
        var t, r, i, c;
        let d = "preset" in e ? e.preset : void 0,
          h = (d &&
          (i = String(d)) &&
          null !== (c = o[String(i).trim().toLowerCase()]) &&
          void 0 !== c
            ? c
            : null) || {
            title: ("title" in e && e.title) || "Further Reading & Tools",
            reads: ("reads" in e && e.reads) || s,
            downloads: ("downloads" in e && e.downloads) || l,
          };
        if (!h) return null;
        let u = (null !== (t = h.reads) && void 0 !== t ? t : []).filter(
            Boolean,
          ),
          m = (null !== (r = h.downloads) && void 0 !== r ? r : []).filter(
            Boolean,
          );
        return (0, n.jsxs)("section", {
          className:
            "mt-12 rounded-xl border border-lightGrey bg-warmWhite/60 p-5 md:p-6 shadow-card ".concat(
              ("className" in e && e.className) || "",
            ),
          "aria-labelledby": "resources-cta-title",
          children: [
            (0, n.jsx)("h3", {
              id: "resources-cta-title",
              className: "mb-4 font-serif text-2xl text-forest",
              children: h.title,
            }),
            (0, n.jsxs)("div", {
              className: "grid gap-6 md:grid-cols-2",
              children: [
                !!u.length &&
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("h4", {
                        className:
                          "mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase",
                        children: "Further Reading",
                      }),
                      (0, n.jsx)("ul", {
                        className: "space-y-2",
                        children: u.map((e) =>
                          (0, n.jsxs)(
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
                                  ? (0, n.jsx)("a", {
                                      href: e.href,
                                      className: "luxury-link text-forest",
                                      target: "_blank",
                                      rel: "noopener noreferrer",
                                      children: e.label,
                                    })
                                  : (0, n.jsx)(a(), {
                                      href: e.href,
                                      className: "luxury-link text-forest",
                                      prefetch: !1,
                                      children: e.label,
                                    }),
                                e.sub &&
                                  (0, n.jsxs)("span", {
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
                !!m.length &&
                  (0, n.jsxs)("div", {
                    children: [
                      (0, n.jsx)("h4", {
                        className:
                          "mb-2 text-sm font-semibold tracking-wide text-[color:var(--color-on-secondary)/0.7] uppercase",
                        children: "Downloads",
                      }),
                      (0, n.jsx)("ul", {
                        className: "space-y-2",
                        children: m.map((e) =>
                          (0, n.jsx)(
                            "li",
                            {
                              children: (0, n.jsx)("a", {
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
    2927: function (e, t, r) {
      "use strict";
      r.d(t, {
        p1: function () {
          return i;
        },
      });
      let n = r(4155).env.NEXT_PUBLIC_X_HANDLE || "AbrahamAda48634";
      function i(e) {
        return e.map((e) => {
          var t;
          let r = e.href || "";
          r =
            (t = r) &&
            t.match(/^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([^/?#]+)/i)
              ? "https://x.com/".concat(n)
              : t;
          try {
            let e = new URL(r);
            ([
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_content",
              "utm_term",
              "s",
            ].forEach((t) => e.searchParams.delete(t)),
              (r = e.toString()));
          } catch (e) {}
          return { ...e, href: r };
        });
      }
    },
    9879: function (e, t, r) {
      "use strict";
      (r.r(t),
        r.d(t, {
          default: function () {
            return g;
          },
        }));
      var n = r(5893),
        i = r(1664),
        a = r.n(i),
        o = r(4750),
        s = r(7468),
        l = r(5675),
        c = r.n(l),
        d = r(2053);
      let h = {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { when: "beforeChildren", staggerChildren: 0.08 },
          },
        },
        u = { hidden: { y: 14, opacity: 0 }, visible: { y: 0, opacity: 1 } };
      function m(e) {
        let {
          id: t = "about",
          bio: r,
          achievements: i,
          portraitSrc: o = "/assets/images/portrait.jpg",
          portraitAlt: s = "Portrait",
          priority: l = !1,
          className: m = "",
        } = e;
        return (0, n.jsx)("section", {
          id: t,
          className: "container mx-auto max-w-6xl px-4 py-10 md:py-14 ".concat(
            m,
          ),
          children: (0, n.jsxs)(d.E.div, {
            variants: h,
            initial: "hidden",
            whileInView: "visible",
            viewport: { once: !0, amount: 0.2 },
            className:
              "grid grid-cols-1 gap-8 md:grid-cols-[280px,1fr] items-start",
            children: [
              (0, n.jsxs)(d.E.aside, {
                variants: u,
                className: "mx-auto md:mx-0 w-[220px] md:w-[260px]",
                children: [
                  (0, n.jsx)("div", {
                    className:
                      "relative aspect-[4/5] overflow-hidden rounded-2xl border border-black/10 bg-warmWhite shadow-card",
                    children: (0, n.jsx)(c(), {
                      src: o,
                      alt: s,
                      fill: !0,
                      sizes: "(max-width: 768px) 220px, 260px",
                      priority: l,
                      className: "object-cover",
                    }),
                  }),
                  (0, n.jsx)("div", {
                    className: "mt-4 flex gap-3",
                    children: (0, n.jsx)(a(), {
                      href: "/contact",
                      prefetch: !1,
                      className: "aol-btn w-full justify-center",
                      "aria-label": "Contact",
                      children: "Contact",
                    }),
                  }),
                ],
              }),
              (0, n.jsxs)(d.E.div, {
                variants: u,
                className:
                  "prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert",
                children: [
                  (0, n.jsx)("h1", {
                    className:
                      "font-serif text-3xl md:text-5xl font-bold !mb-3 !mt-0 text-forest",
                    children: "About",
                  }),
                  (0, n.jsx)("p", { className: "!mt-0", children: r }),
                  (null == i ? void 0 : i.length) > 0 &&
                    (0, n.jsxs)("div", {
                      className: "not-prose mt-8",
                      children: [
                        (0, n.jsx)("h2", {
                          className:
                            "font-serif text-2xl md:text-3xl font-semibold text-forest",
                          children: "Highlights",
                        }),
                        (0, n.jsx)("ul", {
                          className: "mt-4 space-y-3",
                          children: i
                            .slice()
                            .sort((e, t) => t.year - e.year)
                            .map((e) => {
                              let t = (0, n.jsxs)("div", {
                                className:
                                  "flex items-start gap-3 rounded-xl border border-lightGrey bg-warmWhite p-4 shadow-card hover:shadow-cardHover transition",
                                children: [
                                  (0, n.jsx)("div", {
                                    className:
                                      "mt-0.5 shrink-0 rounded-full bg-[color:var(--color-primary)/0.1] px-2 py-1 text-xs font-semibold text-forest",
                                    children: e.year,
                                  }),
                                  (0, n.jsxs)("div", {
                                    className: "min-w-0",
                                    children: [
                                      (0, n.jsx)("div", {
                                        className:
                                          "font-semibold text-deepCharcoal",
                                        children: e.title,
                                      }),
                                      (0, n.jsx)("p", {
                                        className:
                                          "text-sm text-[color:var(--color-on-secondary)/0.8]",
                                        children: e.description,
                                      }),
                                    ],
                                  }),
                                ],
                              });
                              return (0, n.jsx)(
                                "li",
                                {
                                  children: e.href
                                    ? (0, n.jsx)(a(), {
                                        href: e.href,
                                        prefetch: !1,
                                        className:
                                          "block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40 rounded-xl",
                                        "aria-label": ""
                                          .concat(e.title, " — ")
                                          .concat(e.description),
                                        children: t,
                                      })
                                    : t,
                                },
                                "".concat(e.title, "-").concat(e.year),
                              );
                            }),
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
        });
      }
      var p = r(1041),
        f = r(5998),
        x = r(2927);
      function b(e) {
        let { href: t, title: r, sub: i } = e;
        return (0, n.jsx)("li", {
          className:
            "group rounded-xl border border-lightGrey bg-warmWhite p-4 shadow-card transition hover:shadow-cardHover",
          children: (0, n.jsxs)(a(), {
            href: t,
            className:
              "block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest",
            prefetch: !1,
            "aria-label": i ? "".concat(r, " — ").concat(i) : r,
            children: [
              (0, n.jsx)("h3", {
                className:
                  "font-serif text-xl text-forest group-hover:underline underline-offset-4",
                children: r,
              }),
              i &&
                (0, n.jsx)("p", {
                  className:
                    "mt-1 text-sm text-[color:var(--color-on-secondary)/0.8]",
                  children: i,
                }),
              (0, n.jsx)("span", {
                className:
                  "mt-3 inline-block text-sm text-[color:var(--color-primary)/0.8] group-hover:text-forest",
                children: "Read →",
              }),
            ],
          }),
        });
      }
      function g() {
        var e, t;
        let r = (0, f.dE)("/about"),
          i = f.JA.authorImage,
          l = (0, f.dE)(
            (null == i ? void 0 : i.startsWith("/")) ? i : f.JA.authorImage,
          ),
          c = Array.from(
            new Set(
              ((0, x.p1)(f.JA.socialLinks || []) || [])
                .map((e) => e.href)
                .filter((e) => /^https?:\/\//i.test(e)),
            ),
          ),
          d = (
            null === (e = f.JA.ogImage) || void 0 === e
              ? void 0
              : e.startsWith("/")
          )
            ? (0, f.dE)(f.JA.ogImage)
            : f.JA.ogImage,
          h = (
            null === (t = f.JA.twitterImage) || void 0 === t
              ? void 0
              : t.startsWith("/")
          )
            ? (0, f.dE)(f.JA.twitterImage)
            : f.JA.twitterImage,
          u = "About",
          g =
            "About Abraham of London — quiet counsel and durable execution for fathers, young founders, and enterprise teams.",
          y = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "About",
            url: r,
            inLanguage: "en-GB",
            description: g,
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: f.JA.siteUrl,
                },
                { "@type": "ListItem", position: 2, name: "About", item: r },
              ],
            },
          },
          v = {
            "@context": "https://schema.org",
            "@type": "Person",
            name: f.JA.author,
            url: f.JA.siteUrl,
            image: l,
            ...(c.length ? { sameAs: c } : {}),
          };
        return (0, n.jsxs)(o.Z, {
          pageTitle: u,
          children: [
            (0, n.jsxs)(s.Z, {
              title: u,
              type: "website",
              description: g,
              slug: "/about",
              coverImage: d || void 0,
              children: [
                h
                  ? (0, n.jsx)("meta", { name: "twitter:image", content: h })
                  : null,
                (null == i ? void 0 : i.startsWith("/"))
                  ? (0, n.jsx)("link", { rel: "preload", as: "image", href: i })
                  : null,
                (0, n.jsx)("script", {
                  type: "application/ld+json",
                  dangerouslySetInnerHTML: { __html: JSON.stringify(y) },
                }),
                (0, n.jsx)("script", {
                  type: "application/ld+json",
                  dangerouslySetInnerHTML: { __html: JSON.stringify(v) },
                }),
              ],
            }),
            (0, n.jsx)(m, {
              id: "about",
              bio: "Strategy, fatherhood, and craftsmanship—brought together for enduring impact. I help fathers, young founders, and enterprise leaders build durable brands and products with clear thinking, principled execution, and a long view.",
              achievements: [
                {
                  title: "Launched InnovateHub",
                  description:
                    "Innovation studio for prototypes, research, and venture experiments.",
                  year: 2025,
                  href: "https://innovatehub.abrahamoflondon.org",
                },
                {
                  title: "Launched Endureluxe",
                  description:
                    "Premium fitness equipment and curated community—engineered to last, designed to build.",
                  year: 2024,
                  href: "/ventures?brand=endureluxe",
                },
                {
                  title: "Founded Abraham of London",
                  description:
                    "A practice for principled strategy, writing, and stewardship.",
                  year: 2020,
                },
                {
                  title: "Launched Alomarada",
                  description:
                    "Advisory for investors & entrepreneurs developing African markets.",
                  year: 2018,
                  href: "/ventures?brand=alomarada",
                },
              ],
              portraitSrc: i,
              portraitAlt: "Abraham of London portrait",
              priority: !0,
            }),
            (0, n.jsxs)("section", {
              "aria-labelledby": "featured-writing",
              className: "container mx-auto max-w-6xl px-4 py-10 md:py-12",
              children: [
                (0, n.jsx)("h2", {
                  id: "featured-writing",
                  className:
                    "mb-4 font-serif text-2xl sm:text-3xl font-semibold text-deepCharcoal",
                  children: "Featured Writing",
                }),
                (0, n.jsxs)("ul", {
                  className:
                    "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3",
                  children: [
                    (0, n.jsx)(b, {
                      href: "/blog/leadership-begins-at-home",
                      title: "Leadership Begins at Home",
                      sub: "Govern self, then household.",
                    }),
                    (0, n.jsx)(b, {
                      href: "/blog/reclaiming-the-narrative",
                      title: "Reclaiming the Narrative",
                      sub: "Court-season clarity under pressure.",
                    }),
                    (0, n.jsx)(b, {
                      href: "/blog/the-brotherhood-code",
                      title: "The Brotherhood Code",
                      sub: "Covenant of presence, not performance.",
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)("section", {
              "aria-labelledby": "quick-downloads",
              className: "container mx-auto max-w-6xl px-4 py-8",
              children: [
                (0, n.jsx)("h2", {
                  id: "quick-downloads",
                  className:
                    "mb-3 font-serif text-2xl font-semibold text-deepCharcoal",
                  children: "Quick Downloads",
                }),
                (0, n.jsxs)("ul", {
                  className: "flex flex-wrap gap-3 text-sm",
                  children: [
                    (0, n.jsx)("li", {
                      children: (0, n.jsx)(a(), {
                        href: "/downloads/Leadership_Playbook.pdf",
                        className: "aol-btn rounded-full px-4 py-2",
                        prefetch: !1,
                        children: "Leadership Playbook (30•60•90)",
                      }),
                    }),
                    (0, n.jsx)("li", {
                      children: (0, n.jsx)(a(), {
                        href: "/downloads/Mentorship_Starter_Kit.pdf",
                        className: "aol-btn rounded-full px-4 py-2",
                        prefetch: !1,
                        children: "Mentorship Starter Kit",
                      }),
                    }),
                    (0, n.jsx)("li", {
                      children: (0, n.jsx)(a(), {
                        href: "/downloads/Entrepreneur_Operating_Pack.pdf",
                        className: "aol-btn rounded-full px-4 py-2",
                        prefetch: !1,
                        children: "Entrepreneur Operating Pack",
                      }),
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsxs)("section", {
              "aria-labelledby": "letter-heading",
              className: "container mx-auto max-w-6xl px-4 py-10",
              children: [
                (0, n.jsx)("h2", {
                  id: "letter-heading",
                  className:
                    "mb-4 font-serif text-2xl sm:text-3xl font-semibold text-deepCharcoal",
                  children: "Our Letter of Practice",
                }),
                (0, n.jsxs)("div", {
                  className:
                    "prose md:prose-lg max-w-none text-[color:var(--color-on-secondary)/0.9] dark:prose-invert",
                  children: [
                    (0, n.jsx)("p", {
                      children:
                        "I work quietly; deliver visibly. My concern is usefulness over noise—the kind of work that stands without explanation. Counsel is discreet, cadence disciplined, outcomes durable.",
                    }),
                    (0, n.jsx)("p", {
                      className: "font-medium",
                      children: "For fathers:",
                    }),
                    (0, n.jsxs)("ul", {
                      children: [
                        (0, n.jsx)("li", {
                          children:
                            "Build the house first—schedule, Scripture, and standards.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Choose presence over performance; private order before public output.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Lead with truth and kindness; own errors without ceremony.",
                        }),
                      ],
                    }),
                    (0, n.jsx)("p", {
                      className: "font-medium",
                      children: "For young founders:",
                    }),
                    (0, n.jsxs)("ul", {
                      children: [
                        (0, n.jsx)("li", {
                          children:
                            "Ship less, better. Protect constraints; they preserve quality.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Measure twice. Cut once. Record progress; do not perform it.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Cash discipline over clout; stewardship over spectacle.",
                        }),
                      ],
                    }),
                    (0, n.jsx)("p", {
                      className: "font-medium",
                      children: "For enterprise leaders:",
                    }),
                    (0, n.jsxs)("ul", {
                      children: [
                        (0, n.jsx)("li", {
                          children:
                            "Clarify mandate, remove friction, guard the standard.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Keep counsel private; let public work speak.",
                        }),
                        (0, n.jsx)("li", {
                          children:
                            "Scale only what proves worthy; heritage over headlines.",
                        }),
                      ],
                    }),
                    (0, n.jsx)("p", {
                      children: "If our standards align, we can begin.",
                    }),
                  ],
                }),
              ],
            }),
            (0, n.jsx)("section", {
              className: "container mx-auto max-w-3xl px-4",
              children: (0, n.jsx)(p.Z, {
                preset: "leadership",
                className: "mb-10",
              }),
            }),
            (0, n.jsx)("section", {
              className: "container mx-auto max-w-6xl px-4",
              children: (0, n.jsxs)("aside", {
                className:
                  "mt-4 rounded-2xl border border-lightGrey bg-warmWhite p-5 text-sm text-[color:var(--color-on-secondary)/0.8] shadow-card",
                "aria-label": "House standards",
                children: [
                  (0, n.jsx)("h2", {
                    className:
                      "mb-2 font-serif text-lg font-semibold text-deepCharcoal",
                    children: "House Standards",
                  }),
                  (0, n.jsxs)("ul", {
                    className: "list-disc space-y-1 pl-5",
                    children: [
                      (0, n.jsx)("li", {
                        children:
                          "Use insights freely; attribution by permission.",
                      }),
                      (0, n.jsx)("li", {
                        children: "Devices silent. No photos. No recordings.",
                      }),
                      (0, n.jsx)("li", {
                        children: "Names and affiliations kept private.",
                      }),
                    ],
                  }),
                  (0, n.jsx)("p", {
                    className:
                      "mt-3 text-xs text-[color:var(--color-on-secondary)/0.6]",
                    children: "Private rooms available for sensitive work.",
                  }),
                ],
              }),
            }),
            (0, n.jsx)("div", {
              className: "container mx-auto max-w-6xl px-4 pb-20",
              children: (0, n.jsx)(a(), {
                href: "/contact",
                className:
                  "mt-8 inline-flex items-center rounded-full bg-forest px-5 py-2 text-cream hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-opacity-40",
                prefetch: !1,
                children: "Work with me",
              }),
            }),
          ],
        });
      }
    },
    4155: function (e) {
      var t,
        r,
        n,
        i = (e.exports = {});
      function a() {
        throw Error("setTimeout has not been defined");
      }
      function o() {
        throw Error("clearTimeout has not been defined");
      }
      function s(e) {
        if (t === setTimeout) return setTimeout(e, 0);
        if ((t === a || !t) && setTimeout)
          return ((t = setTimeout), setTimeout(e, 0));
        try {
          return t(e, 0);
        } catch (r) {
          try {
            return t.call(null, e, 0);
          } catch (r) {
            return t.call(this, e, 0);
          }
        }
      }
      !(function () {
        try {
          t = "function" == typeof setTimeout ? setTimeout : a;
        } catch (e) {
          t = a;
        }
        try {
          r = "function" == typeof clearTimeout ? clearTimeout : o;
        } catch (e) {
          r = o;
        }
      })();
      var l = [],
        c = !1,
        d = -1;
      function h() {
        c &&
          n &&
          ((c = !1), n.length ? (l = n.concat(l)) : (d = -1), l.length && u());
      }
      function u() {
        if (!c) {
          var e = s(h);
          c = !0;
          for (var t = l.length; t; ) {
            for (n = l, l = []; ++d < t; ) n && n[d].run();
            ((d = -1), (t = l.length));
          }
          ((n = null),
            (c = !1),
            (function (e) {
              if (r === clearTimeout) return clearTimeout(e);
              if ((r === o || !r) && clearTimeout)
                return ((r = clearTimeout), clearTimeout(e));
              try {
                r(e);
              } catch (t) {
                try {
                  return r.call(null, e);
                } catch (t) {
                  return r.call(this, e);
                }
              }
            })(e));
        }
      }
      function m(e, t) {
        ((this.fun = e), (this.array = t));
      }
      function p() {}
      ((i.nextTick = function (e) {
        var t = Array(arguments.length - 1);
        if (arguments.length > 1)
          for (var r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
        (l.push(new m(e, t)), 1 !== l.length || c || s(u));
      }),
        (m.prototype.run = function () {
          this.fun.apply(null, this.array);
        }),
        (i.title = "browser"),
        (i.browser = !0),
        (i.env = {}),
        (i.argv = []),
        (i.version = ""),
        (i.versions = {}),
        (i.on = p),
        (i.addListener = p),
        (i.once = p),
        (i.off = p),
        (i.removeListener = p),
        (i.removeAllListeners = p),
        (i.emit = p),
        (i.prependListener = p),
        (i.prependOnceListener = p),
        (i.listeners = function (e) {
          return [];
        }),
        (i.binding = function (e) {
          throw Error("process.binding is not supported");
        }),
        (i.cwd = function () {
          return "/";
        }),
        (i.chdir = function (e) {
          throw Error("process.chdir is not supported");
        }),
        (i.umask = function () {
          return 0;
        }));
    },
  },
  function (e) {
    (e.O(0, [1664, 5675, 4648, 4750, 2888, 9774, 179], function () {
      return e((e.s = 9212));
    }),
      (_N_E = e.O()));
  },
]);
