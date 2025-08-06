import { useState, useEffect } from "react";

export default function PWATest() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [headerStyles, setHeaderStyles] = useState<any>({});

  useEffect(() => {
    const runDiagnostics = () => {
      // PWA Detection
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const minimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      const windowControls = window.matchMedia('(display-mode: window-controls-overlay)').matches;
      const navigatorStandalone = (window.navigator as any).standalone;
      
      // Get header element and computed styles
      const header = document.querySelector('header');
      const computedStyles = header ? window.getComputedStyle(header) : null;
      
      setDiagnostics({
        userAgent: navigator.userAgent,
        standalone,
        minimalUI,
        windowControls,
        navigatorStandalone,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        headerFound: !!header,
        headerClasses: header?.className || 'No header found',
        isPWA: standalone || minimalUI || windowControls || navigatorStandalone,
      });
      
      if (computedStyles) {
        setHeaderStyles({
          position: computedStyles.position,
          top: computedStyles.top,
          left: computedStyles.left,
          right: computedStyles.right,
          zIndex: computedStyles.zIndex,
          transform: computedStyles.transform,
          backfaceVisibility: computedStyles.backfaceVisibility,
          display: computedStyles.display,
        });
      }
    };

    runDiagnostics();
    
    // Run diagnostics on resize and media query changes
    window.addEventListener('resize', runDiagnostics);
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    standaloneQuery.addListener(runDiagnostics);
    
    return () => {
      window.removeEventListener('resize', runDiagnostics);
      standaloneQuery.removeListener(runDiagnostics);
    };
  }, []);

  // Force header positioning with direct DOM manipulation
  const forceHeaderPosition = () => {
    const header = document.querySelector('header') as HTMLElement;
    if (header) {
      header.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        z-index: 999999 !important;
        background: white !important;
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
      `;
      console.log('🔧 Forced header positioning via DOM manipulation');
      
      // Re-run diagnostics
      setTimeout(() => {
        const computedStyles = window.getComputedStyle(header);
        setHeaderStyles({
          position: computedStyles.position,
          top: computedStyles.top,
          left: computedStyles.left,
          right: computedStyles.right,
          zIndex: computedStyles.zIndex,
          transform: computedStyles.transform,
          backfaceVisibility: computedStyles.backfaceVisibility,
          display: computedStyles.display,
        });
      }, 100);
    }
  };

  return (
    <div style={{ padding: '120px 20px 20px', backgroundColor: '#f0f0f0', minHeight: '200vh' }}>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'red', 
        color: 'white', 
        padding: '10px', 
        zIndex: 999999,
        fontSize: '12px'
      }}>
        🧪 PWA TEST HEADER (Should stay pinned) - PWA: {diagnostics.isPWA ? 'YES' : 'NO'}
      </div>

      <h1 style={{ marginBottom: '20px' }}>PWA Header Diagnostics</h1>
      
      <button 
        onClick={forceHeaderPosition}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}
      >
        🔧 Force Header Position (DOM Manipulation)
      </button>

      <div style={{ marginBottom: '30px' }}>
        <h2>PWA Detection</h2>
        <pre style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Header Computed Styles</h2>
        <pre style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
          {JSON.stringify(headerStyles, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Scroll Test Content</h2>
        {Array.from({ length: 50 }, (_, i) => (
          <p key={i} style={{ margin: '10px 0', padding: '10px', backgroundColor: 'white' }}>
            Test paragraph {i + 1} - If the header is pinned correctly, it should stay at the top while this content scrolls behind it.
          </p>
        ))}
      </div>
    </div>
  );
}