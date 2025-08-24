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

  return (
    <div className={cn("embla", className)}>
      <div className="embla__viewport overflow-hidden px-4" ref={emblaRef}>
        <div className="embla__container flex gap-4">
          {React.Children.map(children, (child, index) => (
            <div className="embla__slide flex-[0_0_100%] min-w-0" key={index}>
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};