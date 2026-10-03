type AgentOrbitalProps = {
  size?: number;
  active?: boolean;
  className?: string;
};

/** famUS agent orb: glowing core with rotating orbit rings and satellite dots. */
export function AgentOrbital({ size = 28, active = false, className = "" }: AgentOrbitalProps) {
  return (
    <span
      aria-hidden="true"
      className={`famus-orbital relative inline-block shrink-0 ${active ? "is-active" : ""} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="famus-orbital-glow absolute inset-[20%] rounded-full bg-primary" />
      <span className="famus-orbital-ring famus-orbital-ring-a absolute inset-0 rounded-full border border-primary/45">
        <span className="absolute left-1/2 top-0 size-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
      </span>
      <span className="famus-orbital-ring famus-orbital-ring-b absolute inset-[16%] rounded-full border border-secondary/40">
        <span className="absolute bottom-0 left-1/2 size-[16%] -translate-x-1/2 translate-y-1/2 rounded-full bg-secondary" />
      </span>
      <span className="famus-orbital-core absolute inset-[36%] rounded-full bg-primary" />
    </span>
  );
}
