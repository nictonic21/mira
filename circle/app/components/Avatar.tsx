// Warm gradient avatar with the friend's initial. The gradient is
// deterministic per name so each friend keeps their colour.
const GRADIENTS = [
  "linear-gradient(135deg, #f2a0b4, #d6536d)",
  "linear-gradient(135deg, #f6bb97, #dd7a52)",
  "linear-gradient(135deg, #d3a6e0, #9d6ab8)",
  "linear-gradient(135deg, #92c9ae, #55917c)",
  "linear-gradient(135deg, #f3b3d0, #cf6296)",
  "linear-gradient(135deg, #f0c184, #cf9243)",
];

export default function Avatar({
  name,
  size = 44,
}: {
  name: string;
  size?: number;
}) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const gradient = GRADIENTS[Math.abs(hash) % GRADIENTS.length];

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-serif text-white shadow-softer"
      style={{
        width: size,
        height: size,
        backgroundImage: gradient,
        fontSize: size * 0.42,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
