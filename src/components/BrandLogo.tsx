import Image from 'next/image';

interface BrandLogoProps {
  compact?: boolean;
}

export default function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-2 shadow-lg">
        <Image
          src="/slm-favicon.png"
          alt="SLM"
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </div>

      {!compact && (
        <div className="leading-tight">
          <Image
            src="/slm-logo-white.svg"
            alt="Sinarmas LDA Maritime"
            width={120}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>
      )}
    </div>
  );
}
