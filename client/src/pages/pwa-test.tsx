import { useState, useEffect } from "react";
import { Header } from "@/components/ui/header";

export default function PWATest() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [headerStyles, setHeaderStyles] = useState<any>({});
  const [testResults, setTestResults] = useState<any>({});

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
      
      // Test different positioning approaches
      const testDiv = document.createElement('div');
      testDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 1px; height: 1px; z-index: 999999;';
      document.body.appendChild(testDiv);
      const testStyles = window.getComputedStyle(testDiv);
      
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
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        hasTouch: 'ontouchstart' in window,
        scrollBehavior: document.documentElement.style.scrollBehavior,
      });
      
      setTestResults({
        testDivPosition: testStyles.position,
        testDivTop: testStyles.top,
        testDivZIndex: testStyles.zIndex,
        bodyPosition: window.getComputedStyle(document.body).position,
        htmlPosition: window.getComputedStyle(document.documentElement).position,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        safeAreaTop: getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)'),
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
      
      document.body.removeChild(testDiv);
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

  // Test multiple positioning strategies
  const testPositionStrategies = () => {
    const strategies = [
      { name: 'Pure Fixed', css: 'position: fixed !important; top: 0 !important; left: 0 !important; z-index: 999999 !important;' },
      { name: 'Fixed + Transform', css: 'position: fixed !important; top: 0 !important; left: 0 !important; z-index: 999999 !important; transform: translateZ(0) !important;' },
      { name: 'Fixed + Backdrop', css: 'position: fixed !important; top: 0 !important; left: 0 !important; z-index: 999999 !important; backdrop-filter: blur(1px) !important;' },
      { name: 'Sticky', css: 'position: sticky !important; top: 0 !important; left: 0 !important; z-index: 999999 !important;' },
    ];
    
    strategies.forEach((strategy, index) => {
      const testEl = document.createElement('div');
      testEl.textContent = `${strategy.name} Test`;
      testEl.style.cssText = `${strategy.css} background: hsl(${index * 60}, 70%, 50%); color: white; padding: 5px; font-size: 10px; width: 100px; margin-left: ${index * 110}px;`;
      document.body.appendChild(testEl);
      
      setTimeout(() => {
        const computedPos = window.getComputedStyle(testEl).position;
        console.log(`${strategy.name}: computed position = ${computedPos}`);
      }, 100);
    });
  };

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
    <>
      <Header title="PWA Diagnostics" />
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
          fontSize: '12px',
          transform: 'translateZ(0)'
        }}>
          🧪 RED TEST HEADER - PWA: {diagnostics.isPWA ? 'YES' : 'NO'} | iOS: {diagnostics.isIOS ? 'YES' : 'NO'}
        </div>

        <h1 style={{ marginBottom: '20px' }}>PWA Header Diagnostics</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={forceHeaderPosition}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              marginRight: '10px'
            }}
          >
            🔧 Force Header Position
          </button>
          
          <button 
            onClick={testPositionStrategies}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px'
            }}
          >
            🧪 Test Position Strategies
          </button>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>PWA Detection</h2>
          <pre style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
            {JSON.stringify(diagnostics, null, 2)}
          </pre>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2>Position Test Results</h2>
          <pre style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '5px', fontSize: '12px' }}>
            {JSON.stringify(testResults, null, 2)}
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
              Test paragraph {i + 1} - If ANY fixed element is working, it should stay at the top while this content scrolls behind it.
            </p>
          ))}
        </div>
      </div>
    </>
  );
}