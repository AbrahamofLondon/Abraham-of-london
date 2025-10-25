(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [2197],
  {
    6141: function (e, n, t) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        "/404",
        function () {
          return t(7996);
        },
      ]);
    },
    7996: function (e, n, t) {
      "use strict";
      (t.r(n),
        t.d(n, {
          default: function () {
            return c;
          },
        }));
      var o = t(5893),
        r = t(9008),
        s = t.n(r),
        i = t(1664),
        a = t.n(i),
        l = t(4750);
      function c() {
        return (0, o.jsxs)(l.Z, {
          pageTitle: "Page Not Found",
          children: [
            (0, o.jsx)(s(), {
              children: (0, o.jsx)("meta", {
                name: "robots",
                content: "noindex",
              }),
            }),
            (0, o.jsxs)("main", {
              className: "container px-4 py-20 text-center",
              role: "main",
              "aria-labelledby": "notfound-title",
              children: [
                (0, o.jsx)("h1", {
                  id: "notfound-title",
                  className: "font-serif text-4xl text-forest mb-3",
                  children: "Page Not Found",
                }),
                (0, o.jsx)("p", {
                  className: "text-[color:var(--color-on-secondary)/0.8] mb-8",
                  children: "Sorry, the page you're looking for doesn't exist.",
                }),
                (0, o.jsxs)("div", {
                  className: "flex items-center justify-center gap-4",
                  children: [
                    (0, o.jsx)(a(), {
                      href: "/",
                      className:
                        "bg-forest text-cream px-5 py-2 rounded-md hover:bg-softGold hover:text-forest transition",
                      "aria-label": "Go back home",
                      children: "← Go back home",
                    }),
                    (0, o.jsx)("a", {
                      href: "mailto:info@abrahamoflondon.org?subject=Broken%20link%20report",
                      className:
                        "text-forest underline underline-offset-4 hover:text-softGold",
                      children: "Report a broken link",
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      }
    },
    512: function (e, n, t) {
      "use strict";
      n.Z = function () {
        for (var e, n, t = 0, o = "", r = arguments.length; t < r; t++)
          (e = arguments[t]) &&
            (n = (function e(n) {
              var t,
                o,
                r = "";
              if ("string" == typeof n || "number" == typeof n) r += n;
              else if ("object" == typeof n) {
                if (Array.isArray(n)) {
                  var s = n.length;
                  for (t = 0; t < s; t++)
                    n[t] && (o = e(n[t])) && (r && (r += " "), (r += o));
                } else for (o in n) n[o] && (r && (r += " "), (r += o));
              }
              return r;
            })(e)) &&
            (o && (o += " "), (o += n));
        return o;
      };
    },
  },
  function (e) {
    (e.O(0, [1664, 4750, 2888, 9774, 179], function () {
      return e((e.s = 6141));
    }),
      (_N_E = e.O()));
  },
]);
