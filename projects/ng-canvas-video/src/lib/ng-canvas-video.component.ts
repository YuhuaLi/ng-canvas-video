import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { VideoOptions, VideoSource, VideoStatus } from './model';
import { Player } from './player/player';
import { WebRtcPlayer } from './player/webrtc-player';
import { isBlob, isString } from './util/function';

@Component({
  selector: 'lib-ng-canvas-video',
  templateUrl: './ng-canvas-video.component.html',
  styleUrls: ['./ng-canvas-video.component.scss'],
})
export class NgCanvasVideoComponent
  implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @Input() src!: VideoSource;
  @Input() options!: VideoOptions;
  @ViewChild('video') video!: HTMLVideoElement;
  @ViewChild('canvas') canvas!: ElementRef;

  @Output() onclose = new EventEmitter<any>();

  defaultOptions: VideoOptions = {
    autoplay: true,
    width: 320,
    height: 160,
    closeable: false,
    singleRecordSize: 1024 * 1024 * 100, // 100M
    controls: {
      type: 'inside',
      actions: {
        progress: true,
        fullscreen: true,
        pictureinpicture: true,
        volume: true,
        rate: true,
        download: true,
        play: true,
        record: true,
        capture: true,
      },
    },
  };
  player?: Player;
  canplay = false;
  isFullscreen = false;
  isDragProgressAnchor = false;
  showRateDropdown = false;
  rateDropdownPos: any = {};
  duration = 0;
  currentTime = 0;
  playbackRate = 1.0;
  percent = 0;
  achorPercent = 0;
  achorMouseDownPointX = 0;
  get status(): VideoStatus {
    return this.player?.status || VideoStatus.UnInit;
  }
  get canDownload(): boolean {
    return isString(this.src) || isBlob(this.src);
  }

  @HostBinding('class.fullscreen') get fullscreen(): boolean {
    return this.isFullscreen;
  }

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  ngOnInit(): void {
    const options = this.options || {};
    this.options = { ...this.defaultOptions, ...options };
    this.options.controls = {
      ...this.defaultOptions.controls,
      ...options.controls,
    };
    this.options.controls.actions = {
      ...this.defaultOptions.controls?.actions,
      ...options.controls?.actions,
    };

    this.initFullscreenEvent();
    document.addEventListener('scroll', this.calcDropdownPos);
  }

  calcDropdownPos = (event: any) => {
    if (this.showRateDropdown) {
      const rateDropdown = this.elementRef.nativeElement.querySelector(
        '.action.dropdown[data-type="rate"]'
      );
      const clientRect = rateDropdown.getBoundingClientRect();
      this.rateDropdownPos.left = `${clientRect.left}px`;
      this.rateDropdownPos.bottom = `${window.innerHeight - clientRect.top}px`;
    }
  }

  formatTimeStr(num: number): string {
    const minutes = Math.floor(num / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.round(num % 60)
      .toString()
      .padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  ngAfterViewInit(): void {
    this.player = this.createPlayer(this.src);
    this.player.onloadedmetadata = (ev) => {
      this.duration = Number(this.player?.duration);
    };
    this.player.oncanplay = (ev) => {
      this.canplay = true;
    };
    this.player.ontimeupdate = (ev) => {
      this.currentTime = Number(this.player?.currentTime);
      this.percent = (this.currentTime / this.duration) * 100;
      if (!this.isDragProgressAnchor) {
        this.achorPercent = this.percent;
      }
    };
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.src.firstChange) {
      this.player?.setSource(this.src);
    }
  }

  initFullscreenEvent(): void {
    if (this.elementRef.nativeElement.requestFullscreen) {
      this.elementRef.nativeElement.onfullscreenchange = () => {
        this.isFullscreen = !this.isFullscreen;
        this.player?.setOptions(
          this.isFullscreen
            ? { width: '100%', height: '100%' }
            : this.player?.options
        );
      };
    } else if (this.elementRef.nativeElement.webkitRequestFullscreen) {
      this.elementRef.nativeElement.onwebkitfullscreenchange = () => {
        this.isFullscreen = !this.isFullscreen;
        this.player?.setOptions(
          this.isFullscreen
            ? { width: '100%', height: '100%' }
            : this.player?.options
        );
      };
    }
  }

  play(): void {
    this.player?.play();
  }

  pause(): void {
    this.player?.pause();
  }

  record(): void {
    this.player?.record();
  }

  stopRecord(): void {
    this.player?.stopRecord();
  }

  togglePlay(): void {
    if (
      this.status !== VideoStatus.Playing &&
      this.status !== VideoStatus.Recording
    ) {
      this.play();
    } else {
      this.pause();
    }
  }

  download(): void {
    if (isString(this.src)) {
      fetch(this.src as string).then((response) =>
        response.blob().then((blob) => {
          const a = document.createElement('a');
          const url = URL.createObjectURL(blob);
          a.href = url;
          a.download = '';
          a.click();
          URL.revokeObjectURL(url);
        })
      );
    } else if (isBlob(this.src)) {
      const a = document.createElement('a');
      const url = URL.createObjectURL(this.src);
      a.href = url;
      a.download = '';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  capture(): void {
    this.player?.capture();
  }

  toggleRecord(): void {
    if (this.status === VideoStatus.Playing) {
      this.record();
    } else {
      this.stopRecord();
    }
  }

  toggleFullscreen(): void {
    if (this.isFullscreen) {
      const docWithBrowsersExitFunctions = document as Document & {
        webkitExitFullscreen(): Promise<void>;
      };
      if (docWithBrowsersExitFunctions.exitFullscreen) {
        docWithBrowsersExitFunctions.exitFullscreen();
      } else if (docWithBrowsersExitFunctions.webkitExitFullscreen) {
        docWithBrowsersExitFunctions.webkitExitFullscreen();
      }
    } else {
      if (this.elementRef.nativeElement.requestFullscreen) {
        this.elementRef.nativeElement.requestFullscreen();
      } else if (this.elementRef.nativeElement.webkitRequestFullscreen) {
        this.elementRef.nativeElement.webkitRequestFullscreen();
      }
    }
  }

  togglePictureInPicture(): void {
    const docWithBrowsersExitFunctions = document as Document & {
      pictureInPictureEnabled: any;
      pictureInPictureElement: any;
      requestPictureInPicture(): Promise<void>;
      exitPictureInPicture(): Promise<void>;
    };
    if (docWithBrowsersExitFunctions.pictureInPictureElement) {
      docWithBrowsersExitFunctions.exitPictureInPicture();
    }
    if (docWithBrowsersExitFunctions.pictureInPictureEnabled) {
      this.player?.requestPictureInPicture();
    }
  }

  toggleDropDown(event: any): void {
    if (event.target?.dataset?.type === 'rate') {
      this.showRateDropdown = !this.showRateDropdown;
      const target = event.target;
      const clientRect = target.getBoundingClientRect();
      this.rateDropdownPos.left = `${clientRect.left}px`;
      this.rateDropdownPos.bottom = `${window.innerHeight - clientRect.top}px`;
    } else {
      this.showRateDropdown = false;
    }
  }

  togglemuted(): void {
    if (this.player) {
      this.player.muted = !this.player.muted;
    }
  }

  onProgressAchorDragStart(event: any): void {
    event.preventDefault();
    this.achorMouseDownPointX = event.x;
    this.isDragProgressAnchor = true;
  }

  onProgressAchorDragEnd(event: any): void {
    if (this.isDragProgressAnchor) {
      this.isDragProgressAnchor = false;
      this.percent = this.achorPercent;
      if (this.player) {
        this.player.currentTime = (this.percent / 100) * this.duration;
      }
    }
  }

  onProcessAreaMouseMove(event: any): void {
    if (this.isDragProgressAnchor) {
      const rect = event.target.parentElement.getBoundingClientRect();
      const percent = ((event.x - rect.x) / rect.width) * 100;
      this.achorPercent = percent > 100 ? 100 : percent < 0 ? 0 : percent;
    }
  }

  onClickProgress(event: any): void {
    const rect = event.target.parentElement.getBoundingClientRect();
    this.percent = ((event.x - rect.left) / rect.width) * 100;
    this.currentTime = (this.duration * this.percent) / 100;
    if (!this.isDragProgressAnchor) {
      this.achorPercent = this.percent;
    }
    if (this.player) {
      this.player.currentTime = this.currentTime;
    }
  }

  onVolumeChange(event: any): void {
    if (this.player) {
      this.player.volume = +event.target.value;
    }
  }

  changePlaybackRate(rate: number): void {
    if (this.playbackRate !== rate) {
      this.playbackRate = rate;
      if (this.player) {
        this.player.playbackRate = this.playbackRate;
      }
    }
  }

  createPlayer(src: VideoSource): Player {
    if (isString(src)) {
      if (/webrtc:\/\//i.test(src as string)) {
        return new WebRtcPlayer(src, {
          ...this.options,
          target: this.options.target || this.canvas.nativeElement,
        });
      }
    }
    return new Player(this.src, {
      ...this.options,
      target: this.options.target || this.canvas.nativeElement,
    });
  }

  close(): void {
    this.player?.close();
    this.onclose.emit();
  }

  ngOnDestroy(): void {
    this.close();
    document.removeEventListener('scroll', this.calcDropdownPos);
  }
}
