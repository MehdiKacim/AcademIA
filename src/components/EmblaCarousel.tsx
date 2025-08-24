import React, { PropsWithChildren } from 'react';
import useEmblaCarousel, { EmblaOptionsType } from 'embla-carousel-react';
import { cn } from '@/lib/utils';

type PropType = PropsWithChildren<{
  options?: EmblaOptionsType;
  className?: string;
}>;

export const EmblaCarousel = (props: PropType) => {
  const { children, options, className } = props;
  const [emblaRef] = useEmblaCarousel(options);

  // Define slide spacing as a CSS variable
  const slideSpacing = '1rem'; // Equivalent to gap-4

  return (
    <div className={cn("embla", className)} style={{ '--slide-spacing': slideSpacing } as React.CSSProperties}>
      <div className="embla__viewport overflow-hidden touch-action-pan-y" ref={emblaRef}> {/* Removed px-4 here, added touch-action-pan-y */}
        <div className="embla__container flex pl-4"> {/* Added pl-4 here */}
          {React.Children.map(children, (child, index) => (
            <div className="embla__slide flex-[0_0_calc(100%-var(--slide-spacing))] ml-4 min-w-0" key={index}> {/* Adjusted flex-basis and added ml-4 */}
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};