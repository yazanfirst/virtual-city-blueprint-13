export default function MirrorWorldEnvironment() {
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <div className="mirror-world-void" />
      <div className="mirror-world-particles" />
      <div className="mirror-world-vignette" />
    </div>
  );
}
