import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        mermaid: any;
    }
}

const Mermaid: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.mermaid && containerRef.current) {
        window.mermaid.initialize({
            startOnLoad: false,
            theme: 'neutral',
            securityLevel: 'loose', 
        });
        
        const container = containerRef.current;
        // Mermaid v10+ requires the chart definition to be inside the element it processes.
        container.innerHTML = chart;

        try {
            window.mermaid.run({
                nodes: [container],
                suppressErrors: false,
            }).catch((err: any) => {
                 console.error("Mermaid render error:", err);
                 setError(err.message || 'Error rendering diagram.');
            });
            setError(null);
        } catch (e) {
            console.error('Mermaid rendering error:', e);
            if(e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unknown error occurred during rendering.');
            }
        }
    }
  }, [chart]);

  if (error) {
      return (
          <div className="p-4 my-2 bg-red-100 border border-red-300 text-red-800 rounded-md">
              <p className="font-bold">Mermaid Diagram Error:</p>
              <pre className="text-sm whitespace-pre-wrap">{error}</pre>
              <p className="mt-2 text-xs">Your diagram code:</p>
              <pre className="text-sm whitespace-pre-wrap bg-red-50 p-2 rounded">{chart}</pre>
          </div>
      );
  }
  
  return <div ref={containerRef} className="mermaid flex justify-center" key={chart} />;
};

export default Mermaid;
