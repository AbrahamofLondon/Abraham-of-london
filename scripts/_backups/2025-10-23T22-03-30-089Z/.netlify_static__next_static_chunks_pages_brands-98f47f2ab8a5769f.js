(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [6803, 6533],
  {
    9185: function (e, t, a) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        "/brands",
        function () {
          return a(393);
        },
      ]);
    },
    6533: function (e, t, a) {
      "use strict";
      (a.r(t),
        a.d(t, {
          default: function () {
            return r;
          },
        }));
      var n = a(5893),
        i = a(7294);
      function r(e) {
        let {
            heightClass: t = "h-1",
            colorClass: a = "bg-emerald-600",
            zIndexClass: r = "z-50",
          } = e,
          [o, s] = i.useState(0);
        return (
          i.useEffect(() => {
            let e = () => {
              let e = document.documentElement,
                t = e.scrollTop || document.body.scrollTop,
                a =
                  (e.scrollHeight || document.body.scrollHeight) -
                  e.clientHeight;
              s(Math.max(0, Math.min(100, a > 0 ? (t / a) * 100 : 0)));
            };
            return (
              e(),
              window.addEventListener("scroll", e, { passive: !0 }),
              window.addEventListener("resize", e),
              () => {
                (window.removeEventListener("scroll", e),
                  window.removeEventListener("resize", e));
              }
            );
          }, []),
          (0, n.jsx)("div", {
            className: "fixed left-0 top-0 w-full ".concat(r),
            children: (0, n.jsx)("div", {
              className: "".concat(t, " ").concat(a),
              style: {
                width: "".concat(o, "%"),
                transition: "width 120ms linear",
              },
              "aria-hidden": "true",
            }),
          })
        );
      }
    },
    2927: function (e, t, a) {
      "use strict";
      a.d(t, {
        p1: function () {
          return i;
        },
      });
      let n = a(4155).env.NEXT_PUBLIC_X_HANDLE || "AbrahamAda48634";
      function i(e) {
        return e.map((e) => {
          var t;
          let a = e.href || "";
          a =
            (t = a) &&
            t.match(/^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([^/?#]+)/i)
              ? "https://x.com/".concat(n)
              : t;
          try {
            let e = new URL(a);
            ([
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_content",
              "utm_term",
              "s",
            ].forEach((t) => e.searchParams.delete(t)),
              (a = e.toString()));
          } catch (e) {}
          return { ...e, href: a };
        });
      }
    },
    393: function (e, t, a) {
      "use strict";
      (a.r(t),
        a.d(t, {
          __N_SSG: function () {
            return j;
          },
          default: function () {
            return N;
          },
        }));
      var n = a(5893),
        i = a(7294),
        r = a(9008),
        o = a.n(r),
        s = a(1664),
        l = a.n(s),
        c = a(5675),
        d = a.n(c),
        m = a(4394),
        x = a(6914),
        h = a(9691),
        p = a(2053),
        u = a(4750),
        g = a(5998),
        y = a(2927),
        f = a(6533);
      let v = [
          {
            name: "Alomarada",
            description:
              "Redefining development through ethical market exploration and human capital growth.",
            logo: "/assets/images/logo/alomarada.svg",
            url: "https://alomarada.com",
            tags: ["Consulting", "Development", "Strategy"],
          },
          {
            name: "Endureluxe",
            description:
              "High-performance luxury fitness equipment and interactive community.",
            logo: "/assets/images/logo/endureluxe.svg",
            url: "https://endureluxe.com",
            tags: ["Fitness", "Luxury", "Community"],
          },
        ],
        b = {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.2 },
          },
        },
        w = {
          hidden: { y: 30, opacity: 0, scale: 0.95 },
          visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 },
          },
        };
      var j = !0;
      function N() {
        var e, t;
        let { yBg: a } = (function () {
            let { scrollYProgress: e } = (0, m.v)(),
              t = (0, x.q)(e, { stiffness: 100, damping: 30 });
            return { yBg: (0, h.H)(t, [0, 1], ["0%", "20%"]) };
          })(),
          r = (0, i.useMemo)(
            () =>
              Array.from(
                new Set(
                  (0, y.p1)(g.JA.socialLinks || [])
                    .map((e) => e.href)
                    .filter((e) => /^https?:\/\//i.test(e)),
                ),
              ),
            [],
          ),
          s = (0, i.useMemo)(
            () => [
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "".concat(g.JA.siteUrl, "/#organization"),
                name: g.JA.title,
                url: g.JA.siteUrl,
                logo: (0, g.dE)(
                  "/assets/images/logo/abraham-of-london-logo.svg",
                ),
                description:
                  "The core brand representing personal work, vision, and philosophy—foundation for thought leadership, strategic advisory, and creative ventures.",
                ...(r.length ? { sameAs: r } : {}),
                brand: v.map((e) => ({
                  "@type": "Brand",
                  name: e.name,
                  url: e.url,
                  logo: (0, g.dE)(e.logo),
                })),
                owns: v.map((e) => ({
                  "@type": "Organization",
                  name: e.name,
                  url: e.url,
                  logo: (0, g.dE)(e.logo),
                })),
              },
              {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: g.JA.siteUrl,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Brands",
                    item: (0, g.dE)("/brands"),
                  },
                ],
              },
            ],
            [r],
          ),
          c = "Ventures & Brands | ".concat(g.JA.author),
          j =
            "Explore the ventures shaped by Abraham of London — Alomarada and Endureluxe — built for legacy, innovation, and impact.",
          N = (0, g.dE)("/brands"),
          E = (
            null === (e = g.JA.ogImage) || void 0 === e
              ? void 0
              : e.startsWith("/")
          )
            ? (0, g.dE)(g.JA.ogImage)
            : g.JA.ogImage,
          _ = (
            null === (t = g.JA.twitterImage) || void 0 === t
              ? void 0
              : t.startsWith("/")
          )
            ? (0, g.dE)(g.JA.twitterImage)
            : g.JA.twitterImage;
        return (0, n.jsxs)(u.Z, {
          children: [
            (0, n.jsxs)(o(), {
              children: [
                (0, n.jsx)("title", { children: c }),
                (0, n.jsx)("meta", { name: "author", content: g.JA.author }),
                (0, n.jsx)("meta", { name: "description", content: j }),
                (0, n.jsx)("meta", {
                  name: "robots",
                  content: "index, follow",
                }),
                (0, n.jsx)("link", { rel: "canonical", href: N }),
                (0, n.jsx)("meta", {
                  property: "og:site_name",
                  content: g.JA.title,
                }),
                (0, n.jsx)("meta", { property: "og:title", content: c }),
                (0, n.jsx)("meta", { property: "og:description", content: j }),
                (0, n.jsx)("meta", { property: "og:type", content: "website" }),
                (0, n.jsx)("meta", { property: "og:url", content: N }),
                E
                  ? (0, n.jsxs)(n.Fragment, {
                      children: [
                        (0, n.jsx)("meta", {
                          property: "og:image",
                          content: E,
                        }),
                        (0, n.jsx)("meta", {
                          property: "og:image:alt",
                          content: "Abraham of London — ventures and brands",
                        }),
                      ],
                    })
                  : null,
                (0, n.jsx)("meta", {
                  name: "twitter:card",
                  content: "summary_large_image",
                }),
                (0, n.jsx)("meta", { name: "twitter:title", content: c }),
                (0, n.jsx)("meta", { name: "twitter:description", content: j }),
                _
                  ? (0, n.jsx)("meta", { name: "twitter:image", content: _ })
                  : null,
                s.map((e, t) =>
                  (0, n.jsx)(
                    "script",
                    {
                      type: "application/ld+json",
                      dangerouslySetInnerHTML: { __html: JSON.stringify(e) },
                    },
                    t,
                  ),
                ),
              ],
            }),
            (0, n.jsxs)("main", {
              className: "relative min-h-screen pt-20 pb-12 overflow-x-hidden",
              children: [
                (0, n.jsx)(f.default, {}),
                (0, n.jsx)(p.E.div, {
                  className: "pointer-events-none fixed inset-0 z-0 bg-cream",
                  style: { y: a },
                  "aria-hidden": "true",
                }),
                (0, n.jsxs)("div", {
                  className: "container relative z-10 mx-auto max-w-6xl px-4",
                  children: [
                    (0, n.jsx)(p.E.section, {
                      id: "abraham-of-london",
                      className:
                        "relative mb-16 overflow-hidden rounded-3xl bg-white p-8 shadow-2xl md:p-12",
                      initial: { opacity: 0, y: -20 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.8 },
                      whileHover: {
                        scale: 1.01,
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                      },
                      children: (0, n.jsxs)("div", {
                        className:
                          "relative z-10 flex flex-col items-center gap-8 md:flex-row md:gap-12",
                        children: [
                          (0, n.jsx)(p.E.div, {
                            className:
                              "relative h-[125px] w-[250px] flex-shrink-0",
                            initial: { rotateY: -180, opacity: 0 },
                            animate: { rotateY: 0, opacity: 1 },
                            transition: {
                              duration: 1,
                              type: "spring",
                              stiffness: 80,
                              damping: 10,
                            },
                            children: (0, n.jsx)(d(), {
                              src: "/assets/images/logo/abraham-of-london-logo.svg",
                              alt: "Abraham of London brand logo",
                              fill: !0,
                              sizes: "(max-width: 768px) 250px, 250px",
                              className: "object-contain",
                              priority: !0,
                            }),
                          }),
                          (0, n.jsxs)(p.E.div, {
                            className: "text-center md:text-left",
                            initial: { x: -30, opacity: 0 },
                            animate: { x: 0, opacity: 1 },
                            transition: { duration: 0.8, delay: 0.4 },
                            children: [
                              (0, n.jsx)("h1", {
                                className:
                                  "mb-3 text-4xl font-bold text-gray-800 md:text-5xl",
                                children: "Abraham of London",
                              }),
                              (0, n.jsx)("p", {
                                className:
                                  "max-w-prose text-lg leading-relaxed text-gray-700",
                                children:
                                  "The core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures.",
                              }),
                            ],
                          }),
                        ],
                      }),
                    }),
                    (0, n.jsxs)(p.E.section, {
                      className: "mb-16 text-center",
                      initial: { opacity: 0, y: 30 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: !0, amount: 0.4 },
                      transition: { duration: 0.8, delay: 0.3 },
                      children: [
                        (0, n.jsx)("h2", {
                          className: "mb-4 text-3xl font-bold text-gray-800",
                          children: "Our Guiding Philosophy",
                        }),
                        (0, n.jsxs)("p", {
                          className: "mx-auto max-w-3xl text-lg text-gray-600",
                          children: [
                            "At the heart of every venture is a commitment to ",
                            (0, n.jsx)("strong", {
                              children: "legacy, innovation, and impact",
                            }),
                            ". We build brands that don't just exist, but that resonate and drive meaningful change.",
                          ],
                        }),
                      ],
                    }),
                    (0, n.jsxs)("section", {
                      className: "mb-16",
                      children: [
                        (0, n.jsx)("h2", {
                          className:
                            "mb-12 text-center text-4xl font-bold text-gray-800 md:text-5xl",
                          children: "Our Ventures",
                        }),
                        (0, n.jsx)(p.E.div, {
                          className: "grid gap-8 md:grid-cols-2 lg:grid-cols-3",
                          variants: b,
                          initial: "hidden",
                          whileInView: "visible",
                          viewport: { once: !0, amount: 0.2 },
                          children: v.map((e) =>
                            (0, n.jsx)(
                              p.E.div,
                              {
                                variants: w,
                                whileHover: { scale: 1.05 },
                                className:
                                  "relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300",
                                children: (0, n.jsxs)("a", {
                                  href: e.url,
                                  target: "_blank",
                                  rel: "noopener noreferrer",
                                  className: "block",
                                  "aria-label": "Visit ".concat(e.name),
                                  children: [
                                    (0, n.jsx)("div", {
                                      className:
                                        "mb-6 flex h-24 items-center justify-center",
                                      children: (0, n.jsx)(d(), {
                                        src: e.logo,
                                        alt: "".concat(e.name, " logo"),
                                        width: 200,
                                        height: 100,
                                        className: "max-h-full object-contain",
                                      }),
                                    }),
                                    (0, n.jsxs)("div", {
                                      className: "text-center",
                                      children: [
                                        (0, n.jsx)("h3", {
                                          className:
                                            "mb-2 text-2xl font-bold text-gray-800",
                                          children: e.name,
                                        }),
                                        (0, n.jsx)("p", {
                                          className: "mb-4 text-gray-600",
                                          children: e.description,
                                        }),
                                        (0, n.jsx)("div", {
                                          className:
                                            "flex flex-wrap justify-center gap-2",
                                          children: e.tags.map((e) =>
                                            (0, n.jsx)(
                                              "span",
                                              {
                                                className:
                                                  "rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700",
                                                children: e,
                                              },
                                              e,
                                            ),
                                          ),
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              },
                              e.name,
                            ),
                          ),
                        }),
                      ],
                    }),
                    (0, n.jsxs)(p.E.section, {
                      className:
                        "rounded-3xl bg-gray-800 p-8 text-center text-white shadow-xl md:p-12",
                      initial: { opacity: 0, y: 30 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: !0, amount: 0.4 },
                      transition: { duration: 0.8 },
                      children: [
                        (0, n.jsx)("h2", {
                          className: "mb-4 text-3xl font-bold",
                          children: "Ready to build a legacy?",
                        }),
                        (0, n.jsx)("p", {
                          className:
                            "mx-auto mb-6 max-w-2xl text-lg text-gray-300",
                          children:
                            "If you're an entrepreneur or leader looking to create a brand with lasting impact, let's connect.",
                        }),
                        (0, n.jsx)(l(), {
                          href: "/contact",
                          className:
                            "inline-block rounded-full bg-forest px-8 py-3 font-bold text-cream shadow-lg transition-colors duration-300 hover:bg-[color:var(--color-primary)/0.9]",
                          prefetch: !1,
                          children: "Get in Touch",
                        }),
                      ],
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
  function (e) {
    (e.O(0, [1664, 5675, 4648, 6988, 4750, 2888, 9774, 179], function () {
      return e((e.s = 9185));
    }),
      (_N_E = e.O()));
  },
]);
