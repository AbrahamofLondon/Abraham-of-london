"use strict";
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [4750],
  {
    4750: function (e, t, r) {
      r.d(t, {
        Z: function () {
          return W;
        },
      });
      var a = r(5893),
        l = r(7294),
        s = r(9008),
        o = r.n(s),
        i = r(1664),
        n = r.n(i),
        c = r(1163),
        d = r(512);
      let h = [
          {
            href: "https://tiktok.com/@abrahamoflondon",
            label: "TikTok",
            kind: "tiktok",
          },
          { href: "https://x.com/AbrahamAda48634", label: "X", kind: "x" },
          {
            href: "https://www.instagram.com/abraham_of_london_/",
            label: "Instagram",
            kind: "instagram",
          },
          {
            href: "https://www.facebook.com/share/16tvsnTgRG/",
            label: "Facebook",
            kind: "facebook",
          },
          {
            href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
            label: "LinkedIn",
            kind: "linkedin",
          },
          {
            href: "https://www.youtube.com/@abrahamoflondon",
            label: "YouTube",
            kind: "youtube",
          },
          {
            href: "mailto:info@abrahamoflondon.org",
            label: "Email",
            kind: "mail",
          },
          { href: "tel:+442086225909", label: "Call", kind: "phone" },
        ],
        m = {
          tiktok: "#010101",
          x: "#000000",
          instagram: "#E4405F",
          facebook: "#1877F2",
          linkedin: "#0A66C2",
          youtube: "#FF0000",
          mail: "#EA4335",
          phone: "#16A34A",
          whatsapp: "#25D366",
        },
        x = (e) => /^https?:\/\//i.test(e),
        u = (e) => e.startsWith("mailto:") || e.startsWith("tel:");
      function f(e) {
        let { title: t, size: r = 20, ...a } = e;
        return {
          width: r,
          height: r,
          ...(t ? { role: "img", "aria-label": t } : { "aria-hidden": !0 }),
          ...a,
        };
      }
      let p = (e) => ({ color: e }),
        b = { fill: "currentColor" },
        g = { stroke: "currentColor" };
      function v(e) {
        var t;
        let r = null !== (t = e.color) && void 0 !== t ? t : "#1F2937";
        return (0, a.jsxs)("svg", {
          ...f(e),
          viewBox: "0 0 24 24",
          style: p(r),
          fill: "none",
          children: [
            (0, a.jsx)("path", {
              d: "M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4",
              style: g,
              strokeWidth: "1.8",
            }),
            (0, a.jsx)("path", {
              d: "M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L13 20",
              style: g,
              strokeWidth: "1.8",
            }),
          ],
        });
      }
      let y = {
        tiktok: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#010101";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M12 3h1.1v5.2c1 .8 2.3 1.4 3.9 1.5V12c-1.9-.1-3.3-.7-4.5-1.6v5.8a4.5 4.5 0 1 1-1.5-3.3V3zM9.2 14.8a3.3 3.3 0 1 0 3.3 3.3 3.3 3.3 0 0 0-3.3-3.3z",
            }),
          });
        },
        x: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#000000";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            fill: "none",
            children: (0, a.jsx)("path", {
              d: "M4 4l16 16M20 4L4 20",
              style: g,
              strokeWidth: "2",
            }),
          });
        },
        instagram: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#E4405F";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm7-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
            }),
          });
        },
        facebook: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#1877F2";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M13.5 22v-8h2.7l.4-3h-3.1V8.4c0-.9.3-1.5 1.6-1.5h1.6V4.1C16.4 4 15.5 4 14.5 4c-2.5 0-4.2 1.5-4.2 4.1V11H7.5v3h2.8v8h3.2z",
            }),
          });
        },
        linkedin: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#0A66C2";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4v15h-4V8zm7 0h3.8v2.05h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V23h-4v-5.8c0-1.38-.02-3.14-1.92-3.14-1.92 0-2.22 1.5-2.22 3.04V23h-4V8z",
            }),
          });
        },
        youtube: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#FF0000";
          return (0, a.jsxs)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: [
              (0, a.jsx)("path", {
                style: b,
                d: "M22.5 12c0-2.1-.2-3.5-.5-4.4a3 3 0 0 0-1.7-1.7C19.4 5.5 12 5.5 12 5.5s-7.4 0-8.3.4a3 3 0 0 0-1.7 1.7C1.7 8.5 1.5 9.9 1.5 12s.2 3.5.5 4.4a3 3 0 0 0 1.7 1.7c.9.4 8.3.4 8.3.4s7.4 0 8.3-.4a3 3 0 0 0 1.7-1.7c.3-.9.5-2.3.5-4.4z",
              }),
              (0, a.jsx)("path", { d: "M10 15l5.2-3L10 9v6z", fill: "#fff" }),
            ],
          });
        },
        mail: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#EA4335";
          return (0, a.jsxs)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            fill: "none",
            children: [
              (0, a.jsx)("rect", {
                x: "3",
                y: "6",
                width: "18",
                height: "12",
                rx: "2",
                style: g,
                strokeWidth: "1.8",
              }),
              (0, a.jsx)("path", {
                d: "M21 8l-9 6-9-6",
                style: g,
                strokeWidth: "1.8",
              }),
            ],
          });
        },
        phone: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#16A34A";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M22 16.9v3a2 2 0 0 1-2.2 2 19.9 19.9 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.5-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z",
            }),
          });
        },
        whatsapp: function (e) {
          var t;
          let r = null !== (t = e.color) && void 0 !== t ? t : "#25D366";
          return (0, a.jsx)("svg", {
            ...f(e),
            viewBox: "0 0 24 24",
            style: p(r),
            children: (0, a.jsx)("path", {
              style: b,
              d: "M12.04 2a9.9 9.9 0 0 0-8.5 15.1L2 22l5.1-1.5A9.9 9.9 0 1 0 12.04 2zm0 2a7.9 7.9 0 0 1 0 15.8c-1.3 0-2.5-.3-3.6-.8l-.3-.1-3 .9.9-3.1-.1-.3A7.9 7.9 0 0 1 12.04 4zm-3.1 3.6c-.2 0-.5.1-.6.4-.2.3-.6 1-.6 1.8 0 .8.5 1.6.6 1.8.1.2 1.2 1.9 3 2.6 1.8.7 2.1.6 2.4.6.3 0 1.1-.5 1.2-1 .1-.5.1-.9 0-1-.1-.1-.2-.2-.5-.4-.3-.2-1.1-.6-1.3-.6-.2 0-.3 0-.5.3-.2.3-.6.9-.7 1-.1.1-.2.2-.4.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1-1.3-1.1-1.5-.1-.2 0-.3.1-.4.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5 0-.2-.5-1.3-.7-1.7-.2-.4-.4-.4-.6-.4z",
            }),
          });
        },
      };
      function j(e) {
        let { variant: t = "light", className: r = "", itemsOverride: l } = e,
          s = ((null == l ? void 0 : l.length) ? l : h).filter(Boolean),
          o = (0, d.Z)(
            "rounded-2xl ring-1 shadow-xl",
            "dark" === t
              ? "bg-deepCharcoal ring-white/10"
              : "bg-white ring-lightGrey",
          ),
          i = (0, d.Z)(
            "inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors",
            "dark" === t
              ? "border-white/15 bg-white/5 text-cream hover:bg-white/10"
              : "border-lightGrey bg-white text-deepCharcoal hover:bg-warmWhite",
          );
        return (0, a.jsx)("section", {
          className: (0, d.Z)(
            "mx-auto my-12 max-w-7xl px-4 sm:px-6 lg:px-12",
            r,
          ),
          children: (0, a.jsx)("div", {
            className: o,
            children: (0, a.jsxs)("div", {
              className:
                "flex flex-wrap items-center justify-between gap-6 px-8 py-6 sm:px-10 sm:py-8",
              children: [
                (0, a.jsxs)("p", {
                  className: (0, d.Z)(
                    "font-serif leading-relaxed",
                    "dark" === t
                      ? "text-[color:var(--color-on-primary)/0.85]"
                      : "text-[color:var(--color-on-secondary)/0.8]",
                    "text-base sm:text-lg",
                  ),
                  children: [
                    "Join the conversation — follow",
                    " ",
                    (0, a.jsx)("span", {
                      className: (0, d.Z)(
                        "font-semibold",
                        "dark" === t ? "text-cream" : "text-deepCharcoal",
                      ),
                      children: "Abraham of London",
                    }),
                  ],
                }),
                (0, a.jsx)("nav", {
                  "aria-label": "Social links",
                  className: "flex flex-wrap items-center gap-3 sm:gap-4",
                  children: s.map((e) => {
                    let { href: t, label: r, kind: l } = e,
                      s = (l && y[l]) || v,
                      o = (l && m[l]) || "#1F2937",
                      c = (0, a.jsxs)("span", {
                        className: i,
                        children: [
                          (0, a.jsx)(s, { size: 20, color: o }),
                          (0, a.jsx)("span", {
                            className: "text-sm font-serif",
                            children: r,
                          }),
                        ],
                      }),
                      d = x(t);
                    return d || u(t)
                      ? (0, a.jsx)(
                          "a",
                          {
                            href: t,
                            className: "group inline-flex items-center",
                            target: d ? "_blank" : void 0,
                            rel: d ? "noopener noreferrer" : void 0,
                            children: c,
                          },
                          "".concat(r, "-").concat(t),
                        )
                      : (0, a.jsx)(
                          n(),
                          {
                            href: t,
                            className: "group inline-flex items-center",
                            prefetch: !1,
                            children: c,
                          },
                          "".concat(r, "-").concat(t),
                        );
                  }),
                }),
              ],
            }),
          }),
        });
      }
      let w = "cta:dismissed",
        k = function () {
          let e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "";
          return e.startsWith("/") || e.startsWith("#");
        };
      function N(e) {
        let {
            showAfter: t = 480,
            phoneHref: r = "tel:+442086225909",
            phoneLabel: s = "Call Abraham",
            primaryHref: o = "/contact",
            primaryLabel: i = "Work With Me",
            secondaryHref: c = "/newsletter",
            secondaryLabel: h = "Subscribe",
            className: m,
          } = e,
          x = l.useRef(null),
          [u, f] = l.useState(!1),
          [p, b] = l.useState(!1),
          [g, v] = l.useState(!1),
          [y, j] = l.useState("dock");
        l.useEffect(() => {
          try {
            v("1" === localStorage.getItem(w));
          } catch (e) {}
        }, []);
        let N = l.useCallback(() => {
            if (!x.current) return;
            let e = Math.ceil(x.current.getBoundingClientRect().height) + 16;
            document.documentElement.style.setProperty(
              "--sticky-cta-h",
              "".concat(e, "px"),
            );
          }, []),
          S = l.useCallback(() => {
            j(
              Math.max(0, Math.max(0, (window.innerWidth - 1280) / 2) - 16) >=
                360
                ? "dock"
                : "fab",
            );
          }, []);
        (l.useEffect(() => {
          let e = 0,
            r = !1,
            a = () => {
              let a = window.scrollY || 0;
              r ||
                ((r = !0),
                requestAnimationFrame(() => {
                  (f(a > t), b(a > t && a - e > 6), (e = a), (r = !1));
                }));
            };
          return (
            S(),
            a(),
            window.addEventListener("scroll", a, { passive: !0 }),
            window.addEventListener("resize", S),
            window.addEventListener("orientationchange", S),
            () => {
              (window.removeEventListener("scroll", a),
                window.removeEventListener("resize", S),
                window.removeEventListener("orientationchange", S));
            }
          );
        }, [t, S]),
          l.useEffect(() => {
            if (!u || "dock" !== y) {
              document.documentElement.style.setProperty(
                "--sticky-cta-h",
                "0px",
              );
              return;
            }
            N();
          }, [u, p, y, N]),
          l.useEffect(
            () => () => {
              document.documentElement.style.setProperty(
                "--sticky-cta-h",
                "0px",
              );
            },
            [],
          ));
        let A = () => {
          try {
            localStorage.setItem(w, "1");
          } catch (e) {}
          (v(!0),
            document.documentElement.style.setProperty(
              "--sticky-cta-h",
              "0px",
            ));
        };
        return g || !u
          ? null
          : "dock" === y
            ? (0, a.jsx)("aside", {
                role: "complementary",
                "aria-label": "Quick contact",
                className: (0, d.Z)(
                  "fixed bottom-4 z-[70] transition-[transform,opacity] duration-200",
                  m,
                ),
                style: { right: 16, left: "auto", width: 360 },
                ref: x,
                "data-mode": "dock",
                children: (0, a.jsx)(C, {
                  collapsed: p,
                  phoneHref: r,
                  phoneLabel: s,
                  primaryHref: o,
                  primaryLabel: i,
                  secondaryHref: c,
                  secondaryLabel: h,
                  onDismiss: A,
                }),
              })
            : (0, a.jsx)("aside", {
                role: "complementary",
                "aria-label": "Quick contact",
                className: (0, d.Z)("fixed bottom-4 right-4 z-[70]", m),
                ref: x,
                "data-mode": "fab",
                style: { right: 16 },
                children: (0, a.jsxs)("div", {
                  className:
                    "relative rounded-full bg-white/95 shadow-card backdrop-blur dark:bg-[color:var(--color-on-secondary)/0.95]",
                  style: { padding: 10 },
                  children: [
                    (0, a.jsx)("button", {
                      type: "button",
                      onClick: A,
                      "aria-label": "Dismiss",
                      title: "Dismiss",
                      className:
                        "absolute -right-2 -top-2 rounded-full bg-black/70 px-1 text-[11px] leading-none text-white hover:bg-black/80 dark:bg-white/20 dark:hover:bg-white/30",
                      children: "\xd7",
                    }),
                    k(o)
                      ? (0, a.jsx)(n(), {
                          href: o,
                          prefetch: !1,
                          "aria-label": i,
                          title: i,
                          className:
                            "flex h-[56px] w-[56px] items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                          children: (0, a.jsx)(E, {}),
                        })
                      : (0, a.jsx)("a", {
                          href: o,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          "aria-label": i,
                          title: i,
                          className:
                            "flex h-[56px] w-[56px] items-center justify-center rounded-full bg-emerald-600 text-white shadow transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                          children: (0, a.jsx)(E, {}),
                        }),
                  ],
                }),
              });
      }
      let C = l.forwardRef(function (e, t) {
        let {
          collapsed: r,
          phoneHref: l,
          phoneLabel: s,
          primaryHref: o,
          primaryLabel: i,
          secondaryHref: c,
          secondaryLabel: h,
          onDismiss: m,
        } = e;
        return (0, a.jsxs)("div", {
          ref: t,
          className: (0, d.Z)(
            "relative overflow-hidden rounded-2xl border border-[color:var(--color-primary)/0.15] bg-white/95 shadow-card backdrop-blur",
            "px-4 py-3 sm:px-5 sm:py-4 dark:bg-[color:var(--color-on-secondary)/0.95] dark:border-white/10",
            r && "px-3 py-2 sm:px-3 sm:py-2",
          ),
          children: [
            (0, a.jsx)("button", {
              type: "button",
              onClick: m,
              "aria-label": "Dismiss",
              title: "Dismiss",
              className: (0, d.Z)(
                "absolute right-2 top-2 rounded-md p-1 text-[color:var(--color-on-secondary)/0.6] hover:bg-black/5",
                "dark:text-[color:var(--color-on-primary)/0.7] dark:hover:bg-white/10",
              ),
              children: (0, a.jsx)("span", {
                "aria-hidden": !0,
                children: "\xd7",
              }),
            }),
            (0, a.jsxs)("div", {
              className: (0, d.Z)(
                "flex items-center gap-3 sm:gap-4",
                r && "gap-2",
              ),
              children: [
                (0, a.jsx)("a", {
                  href: l,
                  "aria-label": s,
                  title: s,
                  className: (0, d.Z)(
                    "inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-2",
                    "hover:bg-emerald-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                    "dark:bg-emerald-900/30 dark:border-emerald-400/30 dark:hover:bg-emerald-900/50",
                  ),
                  children: (0, a.jsx)(S, {}),
                }),
                (0, a.jsxs)("div", {
                  className: "min-w-0 flex-1",
                  children: [
                    !r &&
                      (0, a.jsx)("p", {
                        className:
                          "truncate text-sm font-medium text-forest dark:text-cream",
                        children: "Let's build something enduring.",
                      }),
                    (0, a.jsxs)("div", {
                      className: (0, d.Z)(
                        "mt-2 flex flex-wrap gap-2",
                        r && "mt-0",
                      ),
                      children: [
                        k(o)
                          ? (0, a.jsx)(n(), {
                              href: o,
                              prefetch: !1,
                              className: (0, d.Z)(
                                "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                                "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                                r && "px-3 py-1 text-[13px]",
                              ),
                              "aria-label": i,
                              children: i,
                            })
                          : (0, a.jsx)("a", {
                              href: o,
                              target: "_blank",
                              rel: "noopener noreferrer",
                              className: (0, d.Z)(
                                "inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white",
                                "shadow-sm transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                                r && "px-3 py-1 text-[13px]",
                              ),
                              "aria-label": i,
                              children: i,
                            }),
                        !r &&
                          (k(c)
                            ? (0, a.jsx)(n(), {
                                href: c,
                                prefetch: !1,
                                className: (0, d.Z)(
                                  "inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-semibold text-forest",
                                  "transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]",
                                  "dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                                ),
                                "aria-label": h,
                                children: h,
                              })
                            : (0, a.jsx)("a", {
                                href: c,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: (0, d.Z)(
                                  "inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-semibold text-forest",
                                  "transition hover:bg-forest hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]",
                                  "dark:text-cream dark:border-white/20 dark:hover:bg-white/10",
                                ),
                                "aria-label": h,
                                children: h,
                              })),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      });
      function S() {
        return (0, a.jsx)("svg", {
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          "aria-hidden": "true",
          focusable: "false",
          role: "img",
          className: "block",
          fill: "currentColor",
          children: (0, a.jsx)("path", {
            d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.62 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.14a2 2 0 0 1 2.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0 1 22 16.92z",
          }),
        });
      }
      function E() {
        return (0, a.jsx)("svg", {
          width: "22",
          height: "22",
          viewBox: "0 0 24 24",
          "aria-hidden": "true",
          focusable: "false",
          role: "img",
          fill: "currentColor",
          children: (0, a.jsx)("path", {
            d: "M3 12a7 7 0 0 1 7-7h4a7 7 0 1 1 0 14H9l-4 4v-4a7 7 0 0 1-2-7z",
          }),
        });
      }
      function A() {
        let [e, t] = l.useState(""),
          [r, s] = l.useState(""),
          [o, i] = l.useState("idle");
        async function n(t) {
          (t.preventDefault(), i("busy"));
          try {
            let t = await fetch("/.netlify/functions/send-teaser", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: e, name: r }),
            });
            i(t.ok ? "ok" : "err");
          } catch (e) {
            i("err");
          }
        }
        return (0, a.jsxs)("form", {
          onSubmit: n,
          className:
            "not-prose rounded-xl border border-lightGrey bg-warmWhite/70 p-4 shadow-card",
          children: [
            (0, a.jsx)("div", {
              className: "mb-2 font-semibold",
              children: "Get the FREE teaser by email",
            }),
            (0, a.jsxs)("div", {
              className: "flex flex-col gap-2 sm:flex-row",
              children: [
                (0, a.jsx)("input", {
                  type: "text",
                  placeholder: "Name (optional)",
                  className:
                    "w-full rounded-lg border border-lightGrey px-3 py-2 text-sm",
                  value: r,
                  onChange: (e) => s(e.target.value),
                }),
                (0, a.jsx)("input", {
                  type: "email",
                  placeholder: "you@example.com",
                  required: !0,
                  className:
                    "w-full rounded-lg border border-lightGrey px-3 py-2 text-sm",
                  value: e,
                  onChange: (e) => t(e.target.value),
                }),
                (0, a.jsx)("button", {
                  type: "submit",
                  className: "aol-btn rounded-full px-4 py-2",
                  disabled: "busy" === o,
                  children: "busy" === o ? "Sending..." : "Email me the teaser",
                }),
              ],
            }),
            "ok" === o &&
              (0, a.jsx)("p", {
                className: "mt-2 text-xs text-forest",
                children: "Check your inbox—teaser sent!",
              }),
            "err" === o &&
              (0, a.jsx)("p", {
                className: "mt-2 text-xs text-red-600",
                children: "Sorry—something went wrong.",
              }),
          ],
        });
      }
      let M = "fwt_teaser_dismissed_until";
      function z() {
        let [e, t] = l.useState(!1),
          [r, s] = l.useState(!1);
        function o() {
          let e =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : 7,
            r = Date.now() + 864e5 * e;
          (localStorage.setItem(M, String(r)), t(!1), s(!1));
        }
        return (l.useEffect(() => {
          let e = Number(localStorage.getItem(M) || 0);
          if (Date.now() < e) return;
          let t = setTimeout(() => s(!0), 5e3);
          return () => clearTimeout(t);
        }, []),
        r)
          ? (0, a.jsxs)(a.Fragment, {
              children: [
                (0, a.jsx)("button", {
                  type: "button",
                  onClick: () => t(!0),
                  className:
                    "fixed bottom-5 right-5 z-40 rounded-full bg-forest px-4 py-2 text-sm font-medium text-cream shadow-card hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.6]",
                  "aria-haspopup": "dialog",
                  "aria-expanded": e,
                  "aria-controls": "teaser-cta-panel",
                  children: "Get the free teaser",
                }),
                e &&
                  (0, a.jsx)("div", {
                    role: "dialog",
                    "aria-modal": "true",
                    id: "teaser-cta-panel",
                    className:
                      "fixed inset-0 z-50 flex items-end justify-end bg-black/20 backdrop-blur-[1px]",
                    onClick: (e) => {
                      e.target === e.currentTarget && o();
                    },
                    children: (0, a.jsxs)("div", {
                      className:
                        "m-5 w-full max-w-md rounded-2xl border border-lightGrey bg-white p-4 shadow-card",
                      children: [
                        (0, a.jsxs)("div", {
                          className: "mb-2 flex items-center justify-between",
                          children: [
                            (0, a.jsx)("p", {
                              className:
                                "text-sm font-semibold text-deepCharcoal",
                              children: "Fathering Without Fear — Teaser",
                            }),
                            (0, a.jsxs)("div", {
                              className: "flex items-center gap-2",
                              children: [
                                (0, a.jsx)("button", {
                                  type: "button",
                                  onClick: () => o(),
                                  className:
                                    "text-xs text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal",
                                  title: "Hide for a week",
                                  children: "hide 7 days",
                                }),
                                (0, a.jsx)("button", {
                                  type: "button",
                                  onClick: () => o(365),
                                  className:
                                    "text-xs text-[color:var(--color-on-secondary)/0.7] underline underline-offset-2 hover:text-deepCharcoal",
                                  title: "Never show again",
                                  children: "never",
                                }),
                              ],
                            }),
                          ],
                        }),
                        (0, a.jsx)(A, {}),
                      ],
                    }),
                  }),
              ],
            })
          : null;
      }
      let L = [
        { href: "/books", label: "Books" },
        { href: "/blog", label: "Insights" },
        { href: "/ventures", label: "Ventures" },
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
      ];
      var G = r(5998);
      function W(e) {
        let {
            children: t,
            pageTitle: r,
            hideSocialStrip: s,
            footerVariant: i = "light",
            hideCTA: d = !1,
            hero: h,
          } = e,
          m = (0, c.useRouter)(),
          [x, u] = l.useState(!1),
          f = l.useRef(null),
          p = r ? "".concat(r, " | ").concat(G.JA.title) : G.JA.title,
          b = (e) => e.replace(/[?#].*$/, "").replace(/\/+$/, "") || "/",
          g = (e) => b(m.asPath) === b(e);
        (l.useEffect(() => {
          let e = document.documentElement,
            t = e.style.overflow || "";
          if (x) {
            var r;
            ((e.style.overflow = "hidden"),
              null === (r = f.current) || void 0 === r || r.focus());
          } else e.style.overflow = t || "";
          return () => {
            e.style.overflow = t || "";
          };
        }, [x]),
          l.useEffect(() => {
            let e = () => u(!1);
            return (
              m.events.on("routeChangeStart", e),
              () => m.events.off("routeChangeStart", e)
            );
          }, [m.events]));
        let v = Array.from(
            new Set(
              (G.JA.socialLinks || [])
                .filter((e) => e.external && /^https?:\/\//i.test(e.href))
                .map((e) => e.href),
            ),
          ),
          y = {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: G.JA.title,
            url: G.JA.siteUrl,
            logo: (0, G.dE)("/assets/images/logo/abraham-of-london-logo.svg"),
            ...(v.length ? { sameAs: v } : {}),
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "Customer Support",
                email: G.JA.email,
                areaServed: "GB",
                availableLanguage: ["en"],
              },
            ],
          },
          w = {
            "@context": "https://schema.org",
            "@type": "SiteNavigationElement",
            name: "Primary Navigation",
            hasPart: L.map((e) => ({
              "@type": "WebPage",
              name: e.label,
              url: (0, G.dE)(e.href),
            })),
          };
        return (0, a.jsxs)(a.Fragment, {
          children: [
            (0, a.jsxs)(o(), {
              children: [
                (0, a.jsx)("title", { children: p }),
                (0, a.jsx)("meta", {
                  name: "viewport",
                  content: "width=device-width, initial-scale=1",
                }),
                (0, a.jsx)("script", {
                  type: "application/ld+json",
                  dangerouslySetInnerHTML: { __html: JSON.stringify(y) },
                }),
                (0, a.jsx)("script", {
                  type: "application/ld+json",
                  dangerouslySetInnerHTML: { __html: JSON.stringify(w) },
                }),
              ],
            }),
            (0, a.jsx)("a", {
              href: "#main-content",
              className:
                "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow",
              children: "Skip to content",
            }),
            (0, a.jsxs)("header", {
              className:
                "sticky top-0 z-40 border-b border-[color:var(--color-on-secondary)/0.1] bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-black/50",
              children: [
                (0, a.jsxs)("div", {
                  className:
                    "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:h-20",
                  children: [
                    (0, a.jsxs)(n(), {
                      href: "/",
                      className: "group inline-flex items-baseline gap-2",
                      prefetch: !1,
                      children: [
                        (0, a.jsx)("span", {
                          className:
                            "font-serif text-xl font-semibold tracking-wide text-deepCharcoal md:text-2xl dark:text-cream",
                          children: G.JA.title,
                        }),
                        (0, a.jsx)("span", {
                          className:
                            "hidden text-[10px] uppercase tracking-[0.25em] text-gray-500 md:inline-block",
                          "aria-hidden": "true",
                          children: "EST. MMXXIV",
                        }),
                      ],
                    }),
                    (0, a.jsx)("nav", {
                      className: "hidden md:block",
                      "aria-label": "Primary",
                      children: (0, a.jsx)("ul", {
                        className: "flex items-center gap-8",
                        children: L.map((e) => {
                          let t = g(e.href);
                          return (0, a.jsx)(
                            "li",
                            {
                              children: (0, a.jsxs)(n(), {
                                href: e.href,
                                "aria-current": t ? "page" : void 0,
                                className: [
                                  "relative text-sm font-medium transition-colors",
                                  t
                                    ? "text-deepCharcoal dark:text-cream"
                                    : "text-gray-700 hover:text-deepCharcoal dark:text-gray-300 dark:hover:text-cream",
                                ].join(" "),
                                prefetch: !1,
                                children: [
                                  e.label,
                                  (0, a.jsx)("span", {
                                    className: [
                                      "pointer-events-none absolute -bottom-1 left-0 h-[2px] transition-all",
                                      t
                                        ? "w-full bg-softGold"
                                        : "w-0 bg-transparent group-hover:w-full",
                                    ].join(" "),
                                    "aria-hidden": "true",
                                  }),
                                ],
                              }),
                            },
                            e.href,
                          );
                        }),
                      }),
                    }),
                    (0, a.jsx)("div", {
                      className: "hidden md:block",
                      children: (0, a.jsx)(n(), {
                        href: "/contact",
                        className:
                          "rounded-full bg-softGold px-5 py-2 text-sm font-medium text-deepCharcoal transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/40",
                        prefetch: !1,
                        children: "Enquire",
                      }),
                    }),
                    (0, a.jsxs)("button", {
                      type: "button",
                      onClick: () => u((e) => !e),
                      "aria-expanded": x,
                      "aria-controls": "mobile-nav",
                      className:
                        "inline-flex items-center justify-center rounded-md border border-gray-300 p-2 text-gray-700 dark:text-gray-200 md:hidden",
                      children: [
                        (0, a.jsx)("span", {
                          className: "sr-only",
                          children: "Toggle navigation",
                        }),
                        x
                          ? (0, a.jsx)("svg", {
                              width: "20",
                              height: "20",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              "aria-hidden": "true",
                              children: (0, a.jsx)("path", {
                                d: "M6 6l12 12M18 6L6 18",
                                stroke: "currentColor",
                                strokeWidth: "2",
                              }),
                            })
                          : (0, a.jsx)("svg", {
                              width: "20",
                              height: "20",
                              viewBox: "0 0 24 24",
                              fill: "none",
                              "aria-hidden": "true",
                              children: (0, a.jsx)("path", {
                                d: "M4 6h16M4 12h16M4 18h16",
                                stroke: "currentColor",
                                strokeWidth: "2",
                              }),
                            }),
                      ],
                    }),
                  ],
                }),
                (0, a.jsx)("div", {
                  id: "mobile-nav",
                  className: "md:hidden ".concat(
                    x ? "block" : "hidden",
                    " border-t border-gray-200 bg-white dark:bg:black",
                  ),
                  children: (0, a.jsx)("nav", {
                    className: "mx-auto max-w-7xl px-4 py-4",
                    "aria-label": "Mobile",
                    children: (0, a.jsxs)("ul", {
                      className: "grid gap-2",
                      children: [
                        L.map((e, t) => {
                          let r = g(e.href);
                          return (0, a.jsx)(
                            "li",
                            {
                              children: (0, a.jsx)(n(), {
                                href: e.href,
                                ref: 0 === t ? f : void 0,
                                onClick: () => u(!1),
                                "aria-current": r ? "page" : void 0,
                                className: [
                                  "block rounded-md px-2 py-2 text-base font-medium",
                                  r
                                    ? "bg-gray-100 text-deepCharcoal dark:bg-gray-800 dark:text-cream"
                                    : "text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700",
                                ].join(" "),
                                prefetch: !1,
                                children: e.label,
                              }),
                            },
                            e.href,
                          );
                        }),
                        (0, a.jsx)("li", {
                          className: "pt-2",
                          children: (0, a.jsx)(n(), {
                            href: "/contact",
                            onClick: () => u(!1),
                            className:
                              "block rounded-full bg-softGold px-5 py-2 text-center text-sm font-medium text-deepCharcoal transition hover:brightness-95",
                            prefetch: !1,
                            children: "Enquire",
                          }),
                        }),
                      ],
                    }),
                  }),
                }),
              ],
            }),
            !s &&
              (0, a.jsx)("div", {
                className: "border-b border-gray-100 bg-white dark:bg-black/40",
                children: (0, a.jsx)("div", {
                  className: "mx-auto max-w-7xl px-4 py-2",
                  children: (0, a.jsx)(j, {}),
                }),
              }),
            h
              ? (0, a.jsx)("div", { "data-layout-hero": !0, children: h })
              : null,
            (0, a.jsx)("main", {
              id: "main-content",
              className: "min-h-screen bg-white dark:bg-black",
              style: { paddingBottom: "var(--sticky-cta-h, 0px)" },
              children: t,
            }),
            !d &&
              (0, a.jsx)("div", {
                className: "hidden 2xl:block",
                children: (0, a.jsx)(N, { showAfter: 420 }),
              }),
            (0, a.jsx)(z, {}),
            (0, a.jsx)("footer", {
              className: "border-t ".concat(
                "dark" === i
                  ? "bg-deepCharcoal text-cream border-white/10"
                  : "bg-white text-gray-700 border-gray-200",
              ),
              children: (0, a.jsxs)("div", {
                className: "mx-auto max-w-7xl px-4 py-12",
                children: [
                  (0, a.jsxs)("div", {
                    className: "grid gap-10 md:grid-cols-3",
                    children: [
                      (0, a.jsxs)("div", {
                        children: [
                          (0, a.jsx)("p", {
                            className: "font-serif text-lg font-semibold",
                            children: G.JA.title,
                          }),
                          (0, a.jsx)("p", {
                            className: "mt-2 text-sm leading-relaxed",
                            children:
                              "Principled strategy, writing, and ventures — grounded in legacy and fatherhood.",
                          }),
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        children: [
                          (0, a.jsx)("p", {
                            className: "text-sm font-semibold",
                            children: "Navigate",
                          }),
                          (0, a.jsx)("ul", {
                            className: "mt-3 grid gap-2 text-sm",
                            children: L.map((e) =>
                              (0, a.jsx)(
                                "li",
                                {
                                  children: (0, a.jsx)(n(), {
                                    href: e.href,
                                    className: "transition hover:text-softGold",
                                    prefetch: !1,
                                    children: e.label,
                                  }),
                                },
                                e.href,
                              ),
                            ),
                          }),
                        ],
                      }),
                      (0, a.jsxs)("div", {
                        children: [
                          (0, a.jsx)("p", {
                            className: "text-sm font-semibold",
                            children: "Contact & Legal",
                          }),
                          (0, a.jsxs)("ul", {
                            className: "mt-3 grid gap-2 text-sm",
                            children: [
                              (0, a.jsx)("li", {
                                children: (0, a.jsx)("a", {
                                  href: "mailto:".concat(G.JA.email),
                                  className: "transition hover:text-softGold",
                                  children: G.JA.email,
                                }),
                              }),
                              (0, a.jsx)("li", {
                                children: (0, a.jsx)(n(), {
                                  href: "/contact",
                                  className: "transition hover:text-softGold",
                                  prefetch: !1,
                                  children: "Work With Me",
                                }),
                              }),
                              (0, a.jsx)("li", {
                                children: (0, a.jsx)(n(), {
                                  href: "/newsletter",
                                  className: "transition hover:text-softGold",
                                  prefetch: !1,
                                  children: "Subscribe",
                                }),
                              }),
                              (0, a.jsx)("li", {
                                children: (0, a.jsx)(n(), {
                                  href: "/privacy",
                                  className: "transition hover:text-softGold",
                                  prefetch: !1,
                                  children: "Privacy Policy",
                                }),
                              }),
                              (0, a.jsx)("li", {
                                children: (0, a.jsx)(n(), {
                                  href: "/terms",
                                  className: "transition hover:text-softGold",
                                  prefetch: !1,
                                  children: "Terms of Service",
                                }),
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, a.jsxs)("div", {
                    className:
                      "mt-10 border-t border-gray-200 pt-6 text-center text-xs",
                    children: [
                      "\xa9 ",
                      new Date().getFullYear(),
                      " ",
                      G.JA.title,
                      ". All rights reserved.",
                    ],
                  }),
                ],
              }),
            }),
          ],
        });
      }
    },
  },
]);
