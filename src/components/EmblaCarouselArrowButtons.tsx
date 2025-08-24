import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { EmblaCarouselType } from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PropType = PropsWithChildren<{
  emblaApi: EmblaCarouselType | undefined;
  className?: string;
}>;

export const EmblaCarouselArrowButton = (props: PropType) => {
  const { children, emblaApi, className } = props;
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className={cn("embla__buttons flex justify-between absolute inset-y-0 w-full items-center", className)}>
      <Button
        className="embla__button embla__button--prev absolute left-2"
        onClick={onPrevButtonClick}
        disabled={prevBtnDisabled}
        variant="outline"
        size="icon"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Précédent</span>
      </Button>
      <Button
        className="embla__button embla__button--next absolute right-2"
        onClick={onNextButtonClick}
        disabled={nextBtnDisabled}
        variant="outline"
        size="icon"
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Suivant</span>
      </Button>
    </div>
  );
};