(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [2888],
  {
    6840: function (e, t, a) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        "/_app",
        function () {
          return a(7516);
        },
      ]);
    },
    839: function (e, t, a) {
      "use strict";
      a.d(t, {
        F: function () {
          return c;
        },
        f: function () {
          return d;
        },
      });
      var n = a(5893),
        r = a(7294);
      let o = r.createContext(null),
        l = "theme",
        i = "(prefers-color-scheme: dark)";
      function s(e, t) {
        if ("undefined" == typeof document) return;
        let a = document.documentElement;
        (a.classList.toggle("dark", "dark" === e),
          a.setAttribute("data-theme", e),
          t
            ? a.setAttribute("data-user-theme", t)
            : a.removeAttribute("data-user-theme"));
      }
      function u() {
        if ("undefined" == typeof document) return "system";
        try {
          var e;
          let t =
            null !== (e = localStorage.getItem(l)) && void 0 !== e ? e : null;
          if ("light" === t || "dark" === t || "system" === t) return t;
          let a = document.documentElement.getAttribute("data-user-theme");
          if ("light" === a || "dark" === a || "system" === a) return a;
        } catch (e) {}
        return "system";
      }
      function d(e) {
        let { children: t } = e,
          [a, d] = r.useState(!1),
          [c, h] = r.useState(u),
          [f, m] = r.useState("light");
        (r.useEffect(() => {
          d(!0);
          try {
            let a = "matchMedia" in window ? window.matchMedia(i) : null,
              n = !!(null == a ? void 0 : a.matches),
              r =
                "dark" === c
                  ? "dark"
                  : "light" === c
                    ? "light"
                    : n
                      ? "dark"
                      : "light";
            if ((m(r), s(r, c), "system" === c && a)) {
              var e, t;
              let n = (e) => {
                let t = e.matches ? "dark" : "light";
                (m(t), s(t, "system"));
              };
              return (
                null === (e = a.addEventListener) ||
                  void 0 === e ||
                  e.call(a, "change", n),
                null === (t = a.addListener) || void 0 === t || t.call(a, n),
                () => {
                  var e, t;
                  (null === (e = a.removeEventListener) ||
                    void 0 === e ||
                    e.call(a, "change", n),
                    null === (t = a.removeListener) ||
                      void 0 === t ||
                      t.call(a, n));
                }
              );
            }
          } catch (e) {}
        }, []),
          r.useEffect(() => {
            if (!a) return;
            try {
              localStorage.setItem(l, c);
            } catch (e) {}
            let e = "matchMedia" in window && window.matchMedia(i).matches,
              t =
                "dark" === c
                  ? "dark"
                  : "light" === c
                    ? "light"
                    : e
                      ? "dark"
                      : "light";
            (m(t), s(t, c));
          }, [c, a]));
        let g = r.useCallback((e) => h(e), []),
          p = r.useCallback(() => {
            h((e) =>
              "dark" === e
                ? "light"
                : "light" === e
                  ? "dark"
                  : "dark" === f
                    ? "light"
                    : "dark",
            );
          }, [f]);
        return (0, n.jsx)(o.Provider, {
          value: {
            theme: c,
            resolvedTheme: f,
            setThemePref: g,
            toggle: p,
            mounted: a,
          },
          children: t,
        });
      }
      function c() {
        let e = r.useContext(o);
        if (!e) throw Error("useTheme must be used within <ThemeProvider>");
        return e;
      }
    },
    5998: function (e, t, a) {
      "use strict";
      a.d(t, {
        JA: function () {
          return n;
        },
        dE: function () {
          return r;
        },
      });
      let n = {
          title: "Abraham of London",
          author: "Abraham of London",
          description:
            "Official site of Abraham of London — author, strategist, and fatherhood advocate.",
          siteUrl: (function (e) {
            let t = e.trim();
            return t.endsWith("/") ? t.slice(0, -1) : t;
          })("https://www.abrahamoflondon.org"),
          socialLinks: [
            {
              href: "mailto:info@abrahamoflondon.org",
              label: "Email",
              kind: "mail",
              icon: "/assets/images/social/email.svg",
            },
            {
              href: "tel:+442086225909",
              label: "Phone",
              kind: "phone",
              icon: "/assets/images/social/phone.svg",
            },
            {
              href: "https://x.com/AbrahamAda48634",
              label: "X",
              kind: "x",
              icon: "/assets/images/social/twitter.svg",
              external: !0,
            },
            {
              href: "https://www.instagram.com/abraham_of_london_/",
              label: "Instagram",
              kind: "instagram",
              icon: "/assets/images/social/instagram.svg",
              external: !0,
            },
            {
              href: "https://www.facebook.com/share/16tvsnTgRG/",
              label: "Facebook",
              kind: "facebook",
              icon: "/assets/images/social/facebook.svg",
              external: !0,
            },
            {
              href: "https://www.linkedin.com/in/abraham-adaramola-06630321/",
              label: "LinkedIn",
              kind: "linkedin",
              icon: "/assets/images/social/linkedin.svg",
              external: !0,
            },
            {
              href: "https://www.youtube.com/@abrahamoflondon",
              label: "YouTube",
              kind: "youtube",
              icon: "/assets/images/social/youtube.svg",
              external: !0,
            },
            {
              href: "https://wa.me/447496334022",
              label: "WhatsApp",
              kind: "whatsapp",
              icon: "/assets/images/social/whatsapp.svg",
              external: !0,
            },
            {
              href: "https://www.tiktok.com/@abrahamoflondon",
              label: "TikTok",
              kind: "tiktok",
              icon: "/assets/images/social/tiktok.svg",
              external: !0,
            },
          ],
          gaMeasurementId: "G-R2Y3YMY8F8",
          email: "info@abrahamoflondon.org",
          ogImage: "/assets/images/social/og-image.jpg",
          twitterImage: "/assets/images/social/twitter-image.jpg",
          authorImage: "/assets/images/profile-portrait.webp",
        },
        r = (e) =>
          /^https?:\/\//i.test(e)
            ? e
            : ""
                .concat(n.siteUrl)
                .concat(e.startsWith("/") ? "" : "/")
                .concat(e);
    },
    2168: function (e, t, a) {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        (function (e, t) {
          for (var a in t)
            Object.defineProperty(e, a, { enumerable: !0, get: t[a] });
        })(t, {
          default: function () {
            return i;
          },
          noSSR: function () {
            return l;
          },
        }));
      let n = a(8754);
      (a(5893), a(7294));
      let r = n._(a(8440));
      function o(e) {
        return { default: (null == e ? void 0 : e.default) || e };
      }
      function l(e, t) {
        return (delete t.webpack, delete t.modules, e(t));
      }
      function i(e, t) {
        let a = r.default,
          n = {
            loading: (e) => {
              let { error: t, isLoading: a, pastDelay: n } = e;
              return null;
            },
          };
        e instanceof Promise
          ? (n.loader = () => e)
          : "function" == typeof e
            ? (n.loader = e)
            : "object" == typeof e && (n = { ...n, ...e });
        let i = (n = { ...n, ...t }).loader;
        return (n.loadableGenerated &&
          ((n = { ...n, ...n.loadableGenerated }), delete n.loadableGenerated),
        "boolean" != typeof n.ssr || n.ssr)
          ? a({
              ...n,
              loader: () =>
                null != i ? i().then(o) : Promise.resolve(o(() => null)),
            })
          : (delete n.webpack, delete n.modules, l(a, n));
      }
      ("function" == typeof t.default ||
        ("object" == typeof t.default && null !== t.default)) &&
        void 0 === t.default.__esModule &&
        (Object.defineProperty(t.default, "__esModule", { value: !0 }),
        Object.assign(t.default, t),
        (e.exports = t.default));
    },
    4130: function (e, t, a) {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "LoadableContext", {
          enumerable: !0,
          get: function () {
            return n;
          },
        }));
      let n = a(8754)._(a(7294)).default.createContext(null);
    },
    8440: function (e, t, a) {
      "use strict";
      (Object.defineProperty(t, "__esModule", { value: !0 }),
        Object.defineProperty(t, "default", {
          enumerable: !0,
          get: function () {
            return h;
          },
        }));
      let n = a(8754)._(a(7294)),
        r = a(4130),
        o = [],
        l = [],
        i = !1;
      function s(e) {
        let t = e(),
          a = { loading: !0, loaded: null, error: null };
        return (
          (a.promise = t
            .then((e) => ((a.loading = !1), (a.loaded = e), e))
            .catch((e) => {
              throw ((a.loading = !1), (a.error = e), e);
            })),
          a
        );
      }
      class u {
        promise() {
          return this._res.promise;
        }
        retry() {
          (this._clearTimeouts(),
            (this._res = this._loadFn(this._opts.loader)),
            (this._state = { pastDelay: !1, timedOut: !1 }));
          let { _res: e, _opts: t } = this;
          (e.loading &&
            ("number" == typeof t.delay &&
              (0 === t.delay
                ? (this._state.pastDelay = !0)
                : (this._delay = setTimeout(() => {
                    this._update({ pastDelay: !0 });
                  }, t.delay))),
            "number" == typeof t.timeout &&
              (this._timeout = setTimeout(() => {
                this._update({ timedOut: !0 });
              }, t.timeout))),
            this._res.promise
              .then(() => {
                (this._update({}), this._clearTimeouts());
              })
              .catch((e) => {
                (this._update({}), this._clearTimeouts());
              }),
            this._update({}));
        }
        _update(e) {
          ((this._state = {
            ...this._state,
            error: this._res.error,
            loaded: this._res.loaded,
            loading: this._res.loading,
            ...e,
          }),
            this._callbacks.forEach((e) => e()));
        }
        _clearTimeouts() {
          (clearTimeout(this._delay), clearTimeout(this._timeout));
        }
        getCurrentValue() {
          return this._state;
        }
        subscribe(e) {
          return (
            this._callbacks.add(e),
            () => {
              this._callbacks.delete(e);
            }
          );
        }
        constructor(e, t) {
          ((this._loadFn = e),
            (this._opts = t),
            (this._callbacks = new Set()),
            (this._delay = null),
            (this._timeout = null),
            this.retry());
        }
      }
      function d(e) {
        return (function (e, t) {
          let a = Object.assign(
              {
                loader: null,
                loading: null,
                delay: 200,
                timeout: null,
                webpack: null,
                modules: null,
              },
              t,
            ),
            o = null;
          function s() {
            if (!o) {
              let t = new u(e, a);
              o = {
                getCurrentValue: t.getCurrentValue.bind(t),
                subscribe: t.subscribe.bind(t),
                retry: t.retry.bind(t),
                promise: t.promise.bind(t),
              };
            }
            return o.promise();
          }
          if (!i) {
            let e = a.webpack ? a.webpack() : a.modules;
            e &&
              l.push((t) => {
                for (let a of e) if (t.includes(a)) return s();
              });
          }
          function d(e, t) {
            !(function () {
              s();
              let e = n.default.useContext(r.LoadableContext);
              e &&
                Array.isArray(a.modules) &&
                a.modules.forEach((t) => {
                  e(t);
                });
            })();
            let l = n.default.useSyncExternalStore(
              o.subscribe,
              o.getCurrentValue,
              o.getCurrentValue,
            );
            return (
              n.default.useImperativeHandle(t, () => ({ retry: o.retry }), []),
              n.default.useMemo(() => {
                var t;
                return l.loading || l.error
                  ? n.default.createElement(a.loading, {
                      isLoading: l.loading,
                      pastDelay: l.pastDelay,
                      timedOut: l.timedOut,
                      error: l.error,
                      retry: o.retry,
                    })
                  : l.loaded
                    ? n.default.createElement(
                        (t = l.loaded) && t.default ? t.default : t,
                        e,
                      )
                    : null;
              }, [e, l])
            );
          }
          return (
            (d.preload = () => s()),
            (d.displayName = "LoadableComponent"),
            n.default.forwardRef(d)
          );
        })(s, e);
      }
      function c(e, t) {
        let a = [];
        for (; e.length; ) {
          let n = e.pop();
          a.push(n(t));
        }
        return Promise.all(a).then(() => {
          if (e.length) return c(e, t);
        });
      }
      ((d.preloadAll = () =>
        new Promise((e, t) => {
          c(o).then(e, t);
        })),
        (d.preloadReady = (e) => (
          void 0 === e && (e = []),
          new Promise((t) => {
            let a = () => ((i = !0), t());
            c(l, e).then(a, a);
          })
        )),
        (window.__NEXT_PRELOADREADY = d.preloadReady));
      let h = d;
    },
    7516: function (e, t, a) {
      "use strict";
      (a.r(t),
        a.d(t, {
          default: function () {
            return k;
          },
          reportWebVitals: function () {
            return v;
          },
        }));
      var n = a(5893),
        r = a(7294),
        o = a(1163),
        l = a(5152),
        i = a.n(l),
        s = a(4298),
        u = a.n(s),
        d = a(9008),
        c = a.n(d),
        h = a(839);
      a(5998);
      let f = "G-R2Y3YMY8F8",
        m = !!f;
      function g() {
        for (var e = arguments.length, t = Array(e), a = 0; a < e; a++)
          t[a] = arguments[a];
        m && "function" == typeof window.gtag && window.gtag(...t);
      }
      let p = (e) => {
          g("config", f, { page_path: e });
        },
        b = function (e) {
          let t =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
          g("event", e, t);
        };
      a(6896);
      let w = i()(() => a.e(6533).then(a.bind(a, 6533)), {
          loadableGenerated: { webpack: () => [6533] },
          ssr: !1,
        }),
        _ = i()(() => a.e(6202).then(a.bind(a, 6202)), {
          loadableGenerated: { webpack: () => [6202] },
          ssr: !1,
        });
      function y() {
        let e = (0, o.useRouter)();
        return (
          (0, r.useEffect)(() => {
            if (!m) return;
            let t = (e) => p(e);
            return (
              p(e.asPath),
              e.events.on("routeChangeComplete", t),
              e.events.on("hashChangeComplete", t),
              () => {
                (e.events.off("routeChangeComplete", t),
                  e.events.off("hashChangeComplete", t));
              }
            );
          }, [e]),
          null
        );
      }
      function k(e) {
        let { Component: t, pageProps: a } = e;
        return (0, n.jsxs)(n.Fragment, {
          children: [
            (0, n.jsxs)(c(), {
              children: [
                (0, n.jsx)("meta", {
                  name: "viewport",
                  content:
                    "width=device-width, initial-scale=1, viewport-fit=cover",
                }),
                m &&
                  (0, n.jsxs)(n.Fragment, {
                    children: [
                      (0, n.jsx)("link", {
                        rel: "preconnect",
                        href: "https://www.googletagmanager.com",
                      }),
                      (0, n.jsx)("link", {
                        rel: "preconnect",
                        href: "https://www.google-analytics.com",
                        crossOrigin: "",
                      }),
                    ],
                  }),
              ],
            }),
            m &&
              (0, n.jsxs)(n.Fragment, {
                children: [
                  (0, n.jsx)(u(), {
                    src: "https://www.googletagmanager.com/gtag/js?id=".concat(
                      f,
                    ),
                    strategy: "afterInteractive",
                  }),
                  (0, n.jsx)(u(), {
                    id: "ga-init",
                    strategy: "afterInteractive",
                    children:
                      "\n              window.dataLayer = window.dataLayer || [];\n              function gtag(){dataLayer.push(arguments);}\n              gtag('js', new Date());\n              gtag('config', '".concat(
                        f,
                        "', { anonymize_ip: true, transport_type: 'beacon', page_path: window.location.pathname });\n            ",
                      ),
                  }),
                ],
              }),
            (0, n.jsxs)(h.f, {
              children: [
                (0, n.jsx)(y, {}),
                (0, n.jsx)(w, {
                  zIndexClass: "z-50",
                  colorClass: "bg-emerald-600",
                  heightClass: "h-1",
                }),
                (0, n.jsx)("div", {
                  className: "fixed right-4 top-4 z-50 md:hidden",
                  children: (0, n.jsx)(_, {}),
                }),
                (0, n.jsx)(t, { ...a }),
              ],
            }),
          ],
        });
      }
      function v(e) {
        if (!m) return;
        let t =
          "CLS" === e.name ? Math.round(1e3 * e.value) : Math.round(e.value);
        try {
          b("web-vital", { id: e.id, name: e.name, label: e.label, value: t });
        } catch (e) {}
      }
    },
    6896: function () {},
    5152: function (e, t, a) {
      e.exports = a(2168);
    },
    9008: function (e, t, a) {
      e.exports = a(494);
    },
    1163: function (e, t, a) {
      e.exports = a(7253);
    },
    4298: function (e, t, a) {
      e.exports = a(5026);
    },
  },
  function (e) {
    var t = function (t) {
      return e((e.s = t));
    };
    (e.O(0, [9774, 179], function () {
      return (t(6840), t(7253));
    }),
      (_N_E = e.O()));
  },
]);
