
import { SVGProps } from 'react';

// To add animations, we can add CSS classes to SVG elements and define the animations in a style tag
// or in globals.css. Here, we'll add some inline styles and classes for hover effects.

const iconStyles = `
  .module-icon-group:hover .draw-stroke {
    stroke-dashoffset: 0;
  }
  .module-icon-group:hover .pulse-dot {
    animation: pulse 1s infinite;
  }
  .module-icon-group:hover .slide-line {
    animation: slide 1.5s ease-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.3);
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
`;

export const RecordingsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{iconStyles}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 18.535V6.035c0-1 .75-1.5 1.5-1.5h12c.75 0 1.5.5 1.5 1.5v12.5c0 1-.75 1.5-1.5 1.5h-12c-.75 0-1.5-.5-1.5-1.5m6.5-6.535a2 2 0 1 0 4 0a2 2 0 1 0-4 0m-4.5-2.5h13m-13 8.5h13m-10.5-5.5v3m8-3v3" />
    <path className="pulse-dot" fill="#25D366" d="M11 11.5a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0m-2-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0m2 2a1 1 0 1 1-2 0a1 1 0 0 1 2 0" opacity={0.3} style={{ transformOrigin: 'center' }} />
  </svg>
);

export const AssignmentsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
    <style>{`
      .draw-stroke {
        stroke-dasharray: 10;
        stroke-dashoffset: 10;
        transition: stroke-dashoffset 0.5s ease-in-out;
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
    <style>{iconStyles}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8c2 0 3 1 3 3v11c0 2-1 3-3 3H8c-2 0-3-1-3-3V7c0-2 1-3 3-3Z"/>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h8m-8 4h5m-1.5 4.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z" />
    <path className="pulse-dot" fill="#25D366" d="M13.5 10a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Z" opacity={0.3} style={{ transformOrigin: 'center' }}/>
  </svg>
);

export const ExamIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{iconStyles}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4h8c2 0 3 1 3 3v11c0 2-1 3-3 3H8c-2 0-3-1-3-3V7c0-2 1-3 3-3" />
    <path className="pulse-dot" fill="#25D366" d="M11 9.5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm4 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm-4 5a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Zm4 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 1 0 3 0Z" opacity={0.3} style={{ transformOrigin: 'center' }}/>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m11.5 6.5l-3 4m3-4l3 4" />
  </svg>
);

export const PaymentsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
    <style>{iconStyles}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 13.333h19.5" />
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.5 8h19c.828 0 1.5.672 1.5 1.5v7c0 .828-.672 1.5-1.5 1.5h-19A1.5 1.5 0 0 1 1 16.5v-7A1.5 1.5 0 0 1 2.5 8Z" />
    <path className="pulse-dot" fill="#FFC107" d="M12 7a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" opacity={0.7} style={{ transformOrigin: 'center' }} />
     <path className="pulse-dot" fill="#25D366" d="M18 5a2 2 0 1 0 0-4a2 2 0 0 0 0 4Z" style={{ transformOrigin: 'center', animationDelay: '0.2s' }} />
  </svg>
);

export const TicketsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props} className={`module-icon-group ${props.className || ''}`}>
     <style>{iconStyles}</style>
    <path fill="none" stroke="#25D366" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Zm7.5 0a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5ZM4.5 18.5a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5Z" />
    <path className="slide-line" fill="#25D366" d="M17.5 11.5c.333.667.5 1.417.5 2.25h-5c0-.833.167-1.583.5-2.25a3.5 3.5 0 0 1 4 0ZM7 11.5a3.5 3.5 0 0 1 4 0c.333.667.5 1.417.5 2.25H6.5c0-.833.167-1.583.5-2.25Z" opacity={0.3} />
  </svg>
);
