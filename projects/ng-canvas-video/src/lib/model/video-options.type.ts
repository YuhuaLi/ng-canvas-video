export type VideoOptions = {
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  target?: HTMLCanvasElement | string;
  errorText?: string;
  singleRecordSize?: number;
  identity?: string;
  oncanplay?: ((ev: Event) => any) | null;
  closeable?: boolean;
  controls?: {
    type?: 'inside' | 'outside' | string | null;
    actions?: {
      fullscreen?: boolean;
      pictureinpicture?: boolean;
      volume?: boolean;
      download?: boolean;
      progress?: boolean;
      rate?: boolean;
      play?: boolean;
      record?: boolean;
    };
  } | null;
};
