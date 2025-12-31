interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-6 w-10" }: LogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="12" r="4" fill="currentColor">
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="1.4s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="20" cy="12" r="4" fill="currentColor">
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="1.4s"
          repeatCount="indefinite"
          begin="0.2s"
        />
      </circle>
      <circle cx="32" cy="12" r="4" fill="currentColor">
        <animate
          attributeName="opacity"
          values="0.4;1;0.4"
          dur="1.4s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>
    </svg>
  );
}
