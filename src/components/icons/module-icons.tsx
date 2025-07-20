
import { SVGProps } from 'react';
import { cn } from "@/lib/utils";

// To add animations, we can add CSS classes to SVG elements and define the animations in a style tag
// or in globals.css. Here, we'll add some inline styles and classes for hover effects.

const iconStyles = `
  .draw-stroke {
    stroke-dashoffset: 0;
  }
  .pulse-dot {
    animation: pulse 1s infinite;
  }
  .slide-line {
    animation: slide 1.5s ease-out infinite;
  }
  .bounce-element {
      animation: bounce 0.8s ease-in-out;
  }
  .spin-element {
      transform-origin: center;
      animation: spin 1s linear infinite;
  }
  .pulse-element {
      transform-origin: center;
      animation: pulse 1.5s infinite;
  }
  .float-element {
      animation: float 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.1);
      opacity: 1;
    }
  }

  @keyframes slide {
    0% {
      transform: translateX(-3px);
    }
    50% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(-3px);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }

  @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
`;

export const RecordingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{`
      .pulse-dot {
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.1);
          opacity: 1;
        }
      }
     `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 18.535V6.035c0-1 .75-1.5 1.5-1.5h12c.75 0 1.5.5 1.5 1.5v12.5c0 1-.75 1.5-1.5-1.5h-12c-.75 0-1.5-.5-1.5-1.5m6.5-6.535a2 2 0 1 0 4 0a2 2 0 1 0-4 0m-4.5-2.5h13m-13 8.5h13m-10.5-5.5v3m8-3v3" />
    <path className="pulse-dot" fill="#25D366" d="M11 11.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-2-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0" opacity={0.3} style={{ transformOrigin: 'center' }} />
  </svg>
);

export const AssignmentsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
    <style>{`
      .draw-stroke {
        stroke-dasharray: 10;
        stroke-dashoffset: 10;
        animation: draw 1.5s ease-in-out infinite;
      }
      @keyframes draw {
        0% { stroke-dashoffset: 10; }
        50% { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: 10; }
      }
    `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8c2 0 3 1 3 3v11c0 2-1 3-3 3H8c-2 0-3-1-3-3V7c0-2 1-3 3-3" />
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 8h8m-8 4h5" />
    <path fill="#25D366" d="M17 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" />
    <path className="draw-stroke" fill="none" d="m16.5 10l.667.667L18 10" stroke="#FF8A65" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}/>
  </svg>
);

export const QuizIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
    <style>{`
      .pulse-dot {
        animation: pulse 1.5s infinite;
      }
       @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.3;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.7;
        }
      }
    `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8c2 0 3 1 3 3v11c0 2-1 3-3 3H8c-2 0-3-1-3-3V7c0-2 1-3 3-3Z"/>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h8m-8 4h5m-1.5 4.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z" />
    <path className="pulse-dot" fill="#25D366" d="M13.5 10a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Z" opacity={0.3} style={{ transformOrigin: 'center' }}/>
  </svg>
);

export const ExamIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{`
       .pulse-dot {
        animation: pulse 1.2s infinite;
      }
       @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.8; }
      }
     `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8c2 0 3 1 3 3v11c0 2-1 3-3 3H8c-2 0-3-1-3-3V7c0-2 1-3 3-3" />
    <path className="pulse-dot" fill="#25D366" d="M11 9.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm4 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm-4 5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm4 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Z" opacity={0.3} style={{ transformOrigin: 'center' }}/>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m11.5 6.5l-3 4m3-4l3 4" />
  </svg>
);

export const PaymentsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
    <style>{`
       .pulse-dot {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
      }
    `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 13.333h19.5" />
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.5 8h19c.828 0 1.5.672 1.5 1.5v7c0 .828-.672 1.5-1.5 1.5h-19A1.5 1.5 0 0 1 1 16.5v-7A1.5 1.5 0 0 1 2.5 8Z" />
    <path className="pulse-dot" fill="#FFC107" d="M12 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" opacity={0.7} style={{ transformOrigin: 'center' }} />
     <path className="pulse-dot" fill="#25D366" d="M18 5a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" style={{ transformOrigin: 'center', animationDelay: '0.2s' }} />
  </svg>
);

export const TicketsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{`
      .slide-line {
        animation: slide 1.5s ease-out infinite;
      }
      @keyframes slide {
        0% { transform: translateX(-3px); }
        50% { transform: translateX(3px); }
        100% { transform: translateX(-3px); }
      }
     `}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5ZM4.5 18.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z" />
    <path className="slide-line" fill="#25D366" d="M17.5 11.5c.333.667.5 1.417.5 2.25h-5c0-.833.167-1.583.5-2.25a3.5 3.5 0 0 1 4 0ZM7 11.5a3.5 3.5 0 0 1 4 0c.333.667.5 1.417.5 2.25H6.5c0-.833.167-1.583.5-2.25Z" opacity={0.3} />
  </svg>
);


// Game Icons
export const WinPharmaIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .bounce-element {
            animation: bounce 2s ease-in-out infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}</style>
        <g className="bounce-element">
            <rect x="13" y="4" width="26" height="8" rx="2" fill="#FDBA74"/>
            <rect x="10" y="12" width="32" height="36" rx="4" fill="#60A5FA"/>
            <rect x="16" y="24" width="20" height="4" rx="1" fill="#EFF6FF"/>
            <path d="M22 34C22 31.7909 23.7909 30 26 30C28.2091 30 30 31.7909 30 34V48H22V34Z" fill="#3B82F6"/>
            <rect x="16" y="18" width="20" height="4" rx="2" fill="#93C5FD"/>
        </g>
    </svg>
);

export const DPadIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .slide-line {
            animation: slide 2.5s ease-in-out infinite;
          }
          .pulse-dot {
            animation: pulse 1.5s infinite;
          }
          @keyframes slide {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(2px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
        <path className="slide-line" style={{animationDuration: '2s'}} d="M17.8571 18.2857C17.8571 11.913 22.8427 6.85714 29.1429 6.85714H37.8571C44.1573 6.85714 49.1429 11.913 49.1429 18.2857C49.1429 24.6584 44.1573 29.7143 37.8571 29.7143H22.2857L17.8571 18.2857Z" fill="#818CF8"/>
        <path className="slide-line" style={{animationDuration: '2s', animationDirection: 'reverse'}} d="M34.1429 18.2857C34.1429 24.6584 29.1573 29.7143 22.8571 29.7143H14.1429C7.84267 29.7143 2.85714 24.6584 2.85714 18.2857C2.85714 11.913 7.84267 6.85714 14.1429 6.85714H29.7143L34.1429 18.2857Z" fill="#F472B6"/>
        <path d="M26 45.1429C29.8279 45.1429 32.9624 43.1408 34.7143 40.2857H17.2857C19.0376 43.1408 22.1721 45.1429 26 45.1429Z" fill="#FDBA74"/>
        <circle className="pulse-dot" cx="20.5714" cy="34.2857" r="2.14286" fill="#FDBA74"/>
        <circle className="pulse-dot" style={{animationDelay: '0.2s'}} cx="26" cy="35.7143" r="2.14286" fill="#FDBA74"/>
        <circle className="pulse-dot" style={{animationDelay: '0.4s'}} cx="31.4286" cy="34.2857" r="2.14286" fill="#FDBA74"/>
    </svg>
);

export const CeylonPharmacyIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .float-element {
            animation: float 2.5s ease-in-out infinite;
          }
          .spin-element {
            transform-origin: center;
            animation: spin 4s linear infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
        `}</style>
        <g className="float-element">
            <rect x="4" y="24" width="44" height="24" rx="2" fill="#93C5FD"/>
            <path d="M4 28H48V24C48 22.8954 47.1046 22 46 22H6C4.89543 22 4 22.8954 4 24V28Z" fill="#3B82F6"/>
            <rect x="12" y="32" width="8" height="16" rx="1" fill="#EFF6FF"/>
            <rect x="32" y="32" width="8" height="16" rx="1" fill="#EFF6FF"/>
            <rect x="4" y="10" width="44" height="12" rx="2" fill="#3B82F6"/>
            <path d="M22 4H30V10H22V4Z" fill="#93C5FD"/>
        </g>
        <g className="spin-element" style={{animationDuration: '4s'}}>
            <path d="M26 2V8" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
            <path d="M23 5H29" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"/>
        </g>
    </svg>
);

export const PharmaHunterIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .pulse-element {
            transform-origin: center;
            animation: pulse 2.5s infinite;
          }
           @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
        <path className="pulse-element" style={{animationDuration: '2s'}} d="M26 48V20M26 20C21.5817 20 18 16.4183 18 12C18 7.58172 21.5817 4 26 4C30.4183 4 34 7.58172 34 12C34 16.4183 30.4183 20 26 20Z" stroke="#34D399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M34 40C34 44.4183 30.4183 48 26 48C21.5817 48 18 44.4183 18 40C18 35.5817 21.5817 32 26 32" stroke="#34D399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 24C18 19.5817 21.5817 16 26 16C30.4183 16 34 19.5817 34 24C34 28.4183 30.4183 32 26 32" stroke="#34D399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const HunterProIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .bounce-element {
            animation: bounce 2s ease-in-out infinite;
          }
          .pulse-element {
            transform-origin: center;
            animation: pulse 2s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
          @keyframes pulse {
            0%, 100% { stroke-opacity: 1; }
            50% { stroke-opacity: 0.7; }
          }
        `}</style>
        <path d="M26 48V32" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="bounce-element" d="M38 16L34.2792 19.7208C32.0317 21.9683 28.4231 21.9683 26.1756 19.7208L25.8244 19.3696C23.5769 17.1221 19.9683 17.1221 17.7208 19.3696L14 23" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 23H34.4142C33.6332 23 33.0586 22.3668 33.0586 21.5858V21.5858C33.0586 20.3824 32.1216 19.4454 30.9181 19.4454H21.0819C19.8784 19.4454 18.9414 20.3824 18.9414 21.5858V21.5858C18.9414 22.3668 18.3668 23 17.5858 23H8" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M34 10V4H18V10" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="pulse-element" d="M26 32C33.732 32 40 25.732 40 18C40 10.268 33.732 4 26 4C18.268 4 12 10.268 12 18C12 25.732 18.268 32 26 32Z" stroke="#2DD4BF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export const PharmaReaderIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .pulse-element {
            transform-origin: center;
            animation: pulse-eye 2s ease-in-out infinite;
          }
          .bounce-element {
            animation: bounce 2.5s ease-in-out infinite;
          }
          @keyframes pulse-eye {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-2px); }
          }
        `}</style>
        <path d="M8 26C8 26 13.5 16 26 16C38.5 16 44 26 44 26C44 26 38.5 36 26 36C13.5 36 8 26 8 26Z" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="pulse-element" d="M26 30C28.2091 30 30 28.2091 30 26C30 23.7909 28.2091 22 26 22C23.7909 22 22 23.7909 22 26C22 28.2091 23.7909 30 26 30Z" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path className="bounce-element" style={{animationDelay: '0s'}} d="M19 8L15 4" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round"/>
        <path className="bounce-element" style={{animationDelay: '0.2s'}} d="M33 8L37 4" stroke="#A78BFA" strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

export const WordPalletIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={`module-icon-group ${props.className || ''}`}>
        <style>{`
          .float-element {
            animation: float 3s ease-in-out infinite;
          }
          .pulse-element {
            transform-origin: center;
            animation: pulse 1.8s infinite;
          }
           @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
           @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
        <g className="float-element">
            <path d="M42 28C42 32.4183 34.8366 36 26 36C17.1634 36 10 32.4183 10 28C10 23.5817 17.1634 20 26 20C34.8366 20 42 23.5817 42 28Z" fill="#F472B6"/>
            <path d="M26 38C20.4772 38 16 40.2386 16 43C16 43.5523 16.4477 44 17 44H35C35.5523 44 36 43.5523 36 43C36 40.2386 31.5228 38 26 38Z" fill="#EC4899"/>
            <path d="M26 20C26 19.4477 25.5523 19 25 19H14C11.7909 19 10 17.2091 10 15V13C10 9.13401 13.134 6 17 6H19C22.866 6 26 9.13401 26 13V20Z" fill="#60A5FA"/>
            <path d="M26 13L26 20C26 20.5523 26.4477 21 27 21H38C40.2091 21 42 19.2091 42 17V15C42 11.134 38.866 8 35 8H33C29.134 8 26 11.134 26 15V13Z" fill="#FBBF24"/>
        </g>
        <path className="pulse-element" d="M34 11.5L32 15.5L36 15.5L34 19.5" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);


// Achievement Icons
export const GoldMedalIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={cn("module-icon-group", props.className)}>
        <style>{`
            .shine-gold { animation: shine 3s ease-in-out infinite; }
            @keyframes shine {
                0%, 100% { transform: translateX(-100%); }
                50% { transform: translateX(100%); }
            }
        `}</style>
        <path d="M20 4L12 20H52L44 4H20Z" fill="#4338CA"/>
        <path d="M44 4L52 20H60L52 4H44Z" fill="#312E81"/>
        <circle cx="32" cy="40" r="20" fill="#FBBF24"/>
        <circle cx="32" cy="40" r="16" fill="#F59E0B"/>
        <path d="M32 30L34.6942 35.5279L40.806 36.3167L36.4029 40.5833L37.3884 46.6833L32 43.7279L26.6116 46.6833L27.5971 40.5833L23.194 36.3167L29.3058 35.5279L32 30Z" fill="#FFFFFF"/>
        <rect x="10" y="38" width="44" height="4" fill="white" fillOpacity="0.3" className="shine-gold" style={{transform: "translateX(-100%)"}}/>
    </svg>
);

export const SilverMedalIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={cn("module-icon-group", props.className)}>
        <style>{`
            .shine-silver { animation: shine 3s ease-in-out infinite; animation-delay: 0.5s; }
            @keyframes shine {
                0%, 100% { transform: translateX(-100%); }
                50% { transform: translateX(100%); }
            }
        `}</style>
        <path d="M20 4L12 20H52L44 4H20Z" fill="#4B5563"/>
        <path d="M44 4L52 20H60L52 4H44Z" fill="#374151"/>
        <circle cx="32" cy="40" r="20" fill="#D1D5DB"/>
        <circle cx="32" cy="40" r="16" fill="#9CA3AF"/>
        <path d="M32 30L34.6942 35.5279L40.806 36.3167L36.4029 40.5833L37.3884 46.6833L32 43.7279L26.6116 46.6833L27.5971 40.5833L23.194 36.3167L29.3058 35.5279L32 30Z" fill="#FFFFFF"/>
        <rect x="10" y="38" width="44" height="4" fill="white" fillOpacity="0.3" className="shine-silver" style={{transform: "translateX(-100%)"}}/>
    </svg>
);

export const TopMedalIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg width="1em" height="1em" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...props} className={cn("module-icon-group", props.className)}>
        <style>{`
            .pulse-top { animation: pulse-top-glow 2s ease-in-out infinite; }
            @keyframes pulse-top-glow {
                0%, 100% { fill: #A78BFA; }
                50% { fill: #C4B5FD; }
            }
        `}</style>
        <path d="M20 4L12 20H52L44 4H20Z" fill="#7C3AED"/>
        <path d="M44 4L52 20H60L52 4H44Z" fill="#6D28D9"/>
        <circle cx="32" cy="40" r="20" fill="#C4B5FD"/>
        <circle cx="32" cy="40" r="16" fill="#A78BFA"/>
        <path d="M32 28L28 36H36L32 28Z" fill="white"/>
        <path d="M32 38L26.1244 48H37.8756L32 38Z" fill="white"/>
        <path d="M24 38L32 42L40 38L38 34H26L24 38Z" fill="white"/>
        <circle cx="32" cy="18" r="4" className="pulse-top" fill="#A78BFA"/>
    </svg>
);
