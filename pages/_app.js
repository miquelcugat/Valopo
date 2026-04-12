import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import CookieBanner from '../components/CookieBanner';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Track page views (opcional)
    const handleRouteChange = (url) => {
      console.log(`Navegó a: ${url}`);
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <>
      <Component {...pageProps} />
      <CookieBanner />
    </>
  );
}

export default MyApp;
