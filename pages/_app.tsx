// pages/_app.tsx
import { sans, serif, cursive } from "@/lib/fonts"; // 👈 add cursive

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (!gaEnabled) return;
    const handleRouteChange = (url: string) => pageview(url);
    pageview(router.asPath);
    router.events.on("routeChangeComplete", handleRouteChange);
    router.events.on("hashChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      router.events.off("hashChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <div className={`${sans.variable} ${serif.variable} ${cursive.variable}`}>
      <ThemeProvider>
        <ScrollProgress
          zIndexClass="z-50"
          colorClass="bg-emerald-600"
          heightClass="h-1"
        />
        <Component {...pageProps} />
      </ThemeProvider>
    </div>
  );
}
