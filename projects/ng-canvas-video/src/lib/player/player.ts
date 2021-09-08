import {
  VideoOptions,
  VideoSource,
  VideoSourceObject,
  VideoStatus,
} from '../model';
import { isString } from '../util/function';

declare const MediaRecorder: any;

export class Player {
  protected video$: HTMLVideoElement & {
    requestPictureInPicture(): Promise<any>;
  };
  protected canvas$!: HTMLCanvasElement;
  protected ctx$: CanvasRenderingContext2D | null = null;
  protected srcUrl$ = '';
  protected srcObj$: VideoSourceObject = null;
  protected options$: VideoOptions = {};
  protected status$: VideoStatus = VideoStatus.UnInit;
  protected animationId$?: number;
  protected recorder$: any = null;
  protected recoderTimeslice$ = 40;
  protected chunk$: any[] = [];
  get status(): VideoStatus {
    return this.status$;
  }
  get currentTime(): number {
    return this.video$.currentTime;
  }
  set currentTime(val: number) {
    this.video$.currentTime = val;
  }

  get playbackRate(): number {
    return this.video$.playbackRate;
  }

  set playbackRate(val: number) {
    this.video$.playbackRate = val;
  }

  get muted(): boolean {
    return this.video$.muted;
  }

  set muted(val: boolean) {
    this.video$.muted = val;
  }

  get volume(): number {
    return this.video$.volume * 100;
  }

  set volume(val: number) {
    this.video$.volume = val / 100;
  }

  get duration(): number {
    return this.video$.duration;
  }

  get options(): VideoOptions {
    return this.options$;
  }

  onloadedmetadata: (event: Event) => any = () => void 0;
  oncanplay: (event: Event) => any = () => void 0;
  onplay: (event: Event) => any = () => void 0;
  onplaying: (event: Event) => any = () => void 0;
  onpause: (event: Event) => any = () => void 0;
  oncanplaythrough: (event: Event) => any = () => void 0;
  ontimeupdate: (event: Event) => any = () => void 0;
  onended: (event: Event) => any = () => void 0;

  constructor(src: VideoSource, options: VideoOptions = {}) {
    this.video$ = this.createVideoElement() as HTMLVideoElement & {
      requestPictureInPicture(): Promise<any>;
    };
    if (options) {
      this.options$ = options;
    }
    if (options.target) {
      this.canvas$ = isString(options.target)
        ? (document.querySelector(
            options.target as string
          ) as HTMLCanvasElement)
        : (options.target as HTMLCanvasElement);
    } else {
      this.canvas$ = this.createCanvasElement();
    }
    this.setOptions(options);
    this.ctx$ = this.canvas$.getContext('2d');
    if (this.ctx$) {
      this.ctx$.fillStyle = '#000000BF';
      this.ctx$.fillRect(0, 0, this.canvas$.width, this.canvas$.height);
    }
    this.setSource(src);
    if (!options.target) {
      document.body.appendChild(this.canvas$);
    }
  }

  /**
   * 设置video视频源
   * @param  src 视频源
   */
  setSource(src: VideoSource): void {
    if (this.video$) {
      this.registerVideoEvent(this.video$);
      if (this.video$.src) {
        URL.revokeObjectURL(this.video$.src);
      }
      if (isString(src)) {
        this.srcUrl$ = src as string;
        this.video$.src = this.srcUrl$;
      } else {
        this.srcObj$ = src as VideoSourceObject;
        try {
          this.video$.srcObject = this.srcObj$;
        } catch {
          const url = URL.createObjectURL(this.srcObj$);
          this.video$.src = url;
        }
      }
      this.status$ = VideoStatus.OnInit;
    }
  }

  /**
   * 根据配置初始化video
   * @param options 配置
   */
  setOptions(options: VideoOptions): void {
    if (options.autoplay) {
      this.video$.muted = true;
    }
    if (options.width) {
      this.canvas$.style.width = isNaN(Number(options.width))
        ? `${options.width}`
        : `${options.width}px`;
    }
    if (options.height) {
      this.canvas$.style.height = isNaN(Number(options.height))
        ? `${options.height}`
        : `${options.height}px`;
    }
  }

  initMediaRecorder(stream: any): void {
    if (!this.recorder$ || stream !== this.recorder$.stream) {
      this.chunk$ = [];
      this.recorder$ = new MediaRecorder(stream);
      this.registerMediaRecorderEvent(this.recorder$);
    }
  }

  registerMediaRecorderEvent(recorder: any): void {
    recorder.ondataavailable = (event: any) => {
      if (event.data && event.data.size > 0) {
        this.chunk$.push(event.data);
      }
      const size = this.chunk$.reduce((acc, cur) => cur.size + acc, 0);
      if (size >= (this.options$.singleRecordSize || 1024 * 1024 * 100)) {
        this.saveRecord();
      }
    };
    recorder.onstop = (event: any) => {
      this.saveRecord();
      this.unRegisterMediaRecorderEvent(recorder);
    };
  }

  unRegisterMediaRecorderEvent(recorder: any): void {
    recorder.ondataavailable = null;
    recorder.onstop = null;
  }

  /** 保存录像 */
  protected saveRecord(): void {
    const blob = new Blob(this.chunk$, { type: this.recorder$.mimeType });
    console.log(this.recorder$.mimeType);
    const a = document.createElement('a');
    const url: string = URL.createObjectURL(blob);
    a.href = url;
    a.download = `${this.options$.identity || ''}${
      this.options$.identity ? '' : new Date().getTime()
    }.webm`;
    a.click();
    this.chunk$ = [];
    URL.revokeObjectURL(url);
  }

  /** 播放 */
  play(): void {
    if (!this.isReady()) {
      return;
    }
    this.video$.play();
    if (this.recorder$.state === 'paused') {
      this.recorder$.resume();
      this.status$ = VideoStatus.Recording;
    } else {
      this.status$ = VideoStatus.Playing;
    }
    this.draw();
  }

  /** 暂停播放 */
  pause(): void {
    if (!this.isReady() || this.status$ === VideoStatus.Pause) {
      return;
    }
    this.video$.pause();
    if (this.animationId$) {
      cancelAnimationFrame(this.animationId$);
      this.animationId$ = undefined;
    }
    if (this.recorder$.state === 'recording') {
      this.recorder$.pause();
      this.status$ = VideoStatus.RecordPause;
    } else {
      this.status$ = VideoStatus.Pause;
    }
  }

  record(): void {
    this.recorder$.start(5000);
    this.status$ = VideoStatus.Recording;
  }

  stopRecord(): void {
    this.recorder$.stop();
    if (!this.video$.ended) {
      this.status$ = VideoStatus.Playing;
    } else {
      this.status$ = VideoStatus.Ended;
    }
  }

  /** canvas上绘制视频 */
  draw(force = false): void {
    if (
      this.status$ === VideoStatus.Playing ||
      this.status$ === VideoStatus.Recording ||
      force
    ) {
      this.ctx$?.clearRect(0, 0, this.canvas$.width, this.canvas$.height);
      this.ctx$?.drawImage(
        this.video$,
        0,
        0,
        this.video$.videoWidth,
        this.video$.videoHeight,
        0,
        0,
        this.canvas$.width,
        this.canvas$.height
      );

      this.animationId$ = requestAnimationFrame(() => this.draw());
    }
  }

  /** 关闭播放器 */
  close(): void {
    this.pause();
    if (this.video$) {
      if (this.video$.src) {
        URL.revokeObjectURL(this.video$.src);
      }
      if (this.recorder$.status === 'recording') {
        this.stopRecord();
      }
      this.removeVideoElement(this.video$);
    }
    this.ctx$?.clearRect(0, 0, this.canvas$.width, this.canvas$.height);
    this.status$ = VideoStatus.UnInit;
  }

  createVideoElement(): HTMLVideoElement {
    const video = document.createElement('video');
    video.style.display = 'none';
    // document.body.appendChild(video);
    return video;
  }

  removeVideoElement(video: HTMLVideoElement): void {
    // if (document.body.contains(video)) {
    //   document.body.removeChild(video);
    // }
    this.unRegisterVideoEvent(video);
  }

  createCanvasElement(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    canvas.style.width = '480px';
    canvas.style.height = '270px';
    return canvas;
  }

  /**
   * 注册video事件
   */
  registerVideoEvent(video: HTMLVideoElement): void {
    if (!video) {
      return;
    }
    video.onloadedmetadata = (ev) => {
      if (
        this.canvas$.width !== video.videoWidth ||
        this.canvas$.height !== video.videoHeight
      ) {
        this.canvas$.width = video.videoWidth;
        this.canvas$.height = video.videoHeight;
      }
      this.currentTime = 0;
      this.onloadedmetadata.call(null, ev);
    };

    video.onpause = (ev) => {
      this.status$ = VideoStatus.Pause;
      this.onpause.call(null, ev);
    };
    video.onplaying = (ev) => {
      this.status$ = VideoStatus.Playing;
      this.onplaying.call(null, ev);
    };
    video.onplay = (ev) => {
      this.onplay.call(null, ev);
    };
    video.oncanplay = (ev) => {
      this.status$ = VideoStatus.CanPlay;
      if (this.video$.muted || !this.video$.volume) {
        this.initMediaRecorder((this.canvas$ as any).captureStream());
      } else {
        this.initMediaRecorder((this.video$ as any).captureStream());
      }
      if (this.options$.autoplay) {
        this.play();
      }
      this.oncanplay.call(null, ev);
    };
    video.oncanplaythrough = (ev) => {
      if (this.status$ < VideoStatus.CanPlayThrougth) {
        this.status$ = VideoStatus.CanPlayThrougth;
      }
      this.oncanplaythrough.call(null, ev);
    };

    video.ontimeupdate = (ev) => {
      this.ontimeupdate.call(null, ev);
    };
    video.onended = (ev) => {
      if (this.recorder$.state === 'recording') {
        this.stopRecord();
      } else {
        this.status$ = VideoStatus.Ended;
      }
      this.onended.call(null, ev);
    };
    video.onseeked = (ev) => {
      this.draw(true);
    };
  }

  /**
   * 销毁video注册事件
   */
  unRegisterVideoEvent(video: HTMLVideoElement): void {
    video.onpause = null;
    video.onplaying = null;
    video.onplay = null;
    video.oncanplay = null;
    video.oncanplaythrough = null;
    video.ontimeupdate = null;
    video.onended = null;
  }

  /**
   * 是否可以播放
   */
  isReady(): boolean {
    return this.video$.readyState === 4 && this.status$ > 1;
  }

  /**
   * 画中画
   */
  requestPictureInPicture(): void {
    if (this.video$?.requestPictureInPicture) {
      // if (!document.contains(this.video$)) {
      //   document.body.appendChild(this.video$);
      // }
      this.video$.requestPictureInPicture();
    }
  }

  /**
   * 捕获截屏
   */
  capture(): void {
    const a = document.createElement('a');
    a.href = this.canvas$.toDataURL('image/png');
    a.download = `${this.options$.identity || ''}${
      this.options$.identity ? '' : new Date().getTime()
    }.png`;
    a.click();
  }
}
