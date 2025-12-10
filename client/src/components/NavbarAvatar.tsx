// src/components/NavbarAvatar.tsx
import type { MouseEventHandler } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

export default function NavbarAvatar({ src, alt = "Profile", onClick }: Props) {
  const isSvg = src?.endsWith('.svg') || src?.includes('.svg');
  
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex h-9 w-9 items-center justify-center
        rounded-full overflow-hidden
        border border-white/30
        bg-black
        transition-colors duration-150
        hover:bg-red-600 hover:border-red-600
        focus:outline-none
      "
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`block ${
            isSvg 
              ? 'h-5 w-5' // SVG için daha küçük, centered
              : 'h-full w-full object-cover' // Normal resim için full
          }`}
          style={isSvg ? {
            imageRendering: 'crisp-edges', // Sharp rendering for SVG
            transform: 'translateZ(0)', // GPU acceleration
            backfaceVisibility: 'hidden', // Anti-aliasing fix
            WebkitBackfaceVisibility: 'hidden', // Safari specific
            shapeRendering: 'crispEdges', // SVG için
          } : undefined}
        />
      ) : (
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-zinc-200">
          Me
        </span>
      )}
    </button>
  );
}