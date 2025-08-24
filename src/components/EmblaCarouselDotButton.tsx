import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { EmblaCarouselType } from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PropType = PropsWithChildren<{
  emblaApi: EmblaCarouselType | undefined;
  className?: string;
}>;

export const EmblaCarouselDotButton = (props: PropType) => {
  const { emblaApi, className } = props;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi && emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return (
    <div className={cn("embla__dots flex justify-center mt-4 space-x-2", className)}>
      {scrollSnaps.map((_, index) => (
        <Button
          key={index}
          onClick={() => scrollTo(index)}
          className={cn(
            "embla__dot h-2 w-2 p-0 rounded-full transition-colors",
            index === selectedIndex ? "bg-primary" : "bg-muted-foreground/50 hover:bg-muted-foreground"
          )}
          variant="ghost"
          size="icon"
        >
          <span className="sr-only">Aller à la diapositive {index + 1}</span>
        </Button>
      ))}
    </div>
  );
};