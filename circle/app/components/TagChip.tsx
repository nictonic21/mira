// Colourful tag chips — each tag keeps a consistent colour everywhere.
const PALETTES = [
  { bg: "#fce6e6", text: "#b93d5e", border: "#de5480" }, // rose
  { bg: "#e5f2ea", text: "#3d7d63", border: "#4f8d72" }, // mint
  { bg: "#f3e9f8", text: "#8a4fa8", border: "#9d5bb5" }, // lilac
  { bg: "#faeadd", text: "#b06a3a", border: "#c4764a" }, // apricot
  { bg: "#faf0d8", text: "#a5822a", border: "#cf9243" }, // gold
];

export function tagPalette(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default function TagChip({
  tag,
  size = "sm",
}: {
  tag: string;
  size?: "xs" | "sm";
}) {
  const p = tagPalette(tag);
  return (
    <span
      className={`rounded-full font-medium ${
        size === "xs" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
      }`}
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      {tag}
    </span>
  );
}
