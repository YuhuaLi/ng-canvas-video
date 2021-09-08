import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TimeRange } from './model';

@Component({
  selector: 'lib-ng-time-slider',
  template: `<div class="time-slider-wrapper">
    <canvas
      class="time-slider"
      (mousemove)="onMouseHover($event)"
      (mouseover)="onMouseHover($event)"
      (mouseout)="onMouseOut($event)"
      (mousedown)="onMouseDown($event)"
      (mouseup)="onMouseUp($event)"
      (wheel)="onMouseWheel($event)"
      #canvas
    ></canvas>
    <canvas class="time-selector" #selector></canvas>
    <div class="zoom">
      <a class="button" (click)="zoomOut()">-</a>
      <a class="button" (click)="zoomIn()">+</a>
    </div>
    <a class="button slide-left" (click)="slideLeft()"><</a>
    <a class="button slide-right" (click)="slideRight()">></a>
  </div>`,
  styles: [
    `
      .time-slider-wrapper {
        position: relative;
        width: 100%;
        height: 90px;
      }
      .time-slider-wrapper .time-slider {
        cursor: pointer;
        width: 100%;
        height: 100%;
      }
      .time-slider-wrapper .time-selector {
        pointer-events: none;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
      }
      .time-slider-wrapper .zoom {
        position: absolute;
        top: 5px;
        right: 5px;
      }
      .time-slider-wrapper a.button {
        margin: 0 5px;
        background: #ffffff1a;
        color: #ffffff4d;
        width: 18px;
        height: 18px;
        display: inline-block;
        line-height: 16px;
        font-size: 16px;
        text-align: center;
        cursor: pointer;
        user-select: none;
      }
      .time-slider-wrapper a.button:hover {
        background: #007fff80;
        color: #ffffff;
      }

      .time-slider-wrapper a.slide-left {
        display: none;
        position: absolute;
        top: 58px;
        left: 0;
      }
      .time-slider-wrapper a.slide-right {
        display: none;
        position: absolute;
        top: 58px;
        right: 0;
      }
      .time-slider-wrapper:hover a.slide-left {
        display: block;
      }
      .time-slider-wrapper:hover a.slide-right {
        display: block;
      }
    `,
  ],
})
export class NgTimeSliderComponent
  implements OnInit, OnChanges, AfterViewInit, OnDestroy
{
  @ViewChild('canvas') canvasElem!: ElementRef;
  @ViewChild('selector') selectorElem!: ElementRef;
  ctx!: CanvasRenderingContext2D;
  selectorCtx!: CanvasRenderingContext2D;
  @Input() validDateArr: TimeRange[] = [];
  @Input() date: Date = new Date();
  @Input() currentTime: Date | null = null;
  @Output() currentTimeChange = new EventEmitter<any>();
  timeRangeArr: { start: number; end: number; dateArr: Date[] }[] = [];
  gap = 60;
  rowHeight = 20;
  translateX = 0;
  get canvas(): HTMLCanvasElement {
    return this.canvasElem.nativeElement as HTMLCanvasElement;
  }
  get selectorCanvas(): HTMLCanvasElement {
    return this.selectorElem.nativeElement as HTMLCanvasElement;
  }
  mouseDownPoint: any = null;
  isTicking = false;
  isDrag = false;
  alive = true;

  constructor() {}
  ngOnInit(): void {
    this.parseTimeRange(this.validDateArr);
    if (!this.currentTime && this.validDateArr?.length) {
      this.currentTime = this.validDateArr[0].start;
      this.currentTimeChange.emit(this.currentTime);
    }
    window.addEventListener('resize', this.onResize);
  }

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.date && !changes.date.isFirstChange) {
      this.init();
      return;
    }
    if (changes.currentTime && !changes.currentTime.isFirstChange) {
      this.drawCurrent();
    }
    if (changes.validDateArr && !changes.validDateArr.isFirstChange) {
      this.drawValidRange();
    }
  }

  onResize = () => {
    window.requestAnimationFrame(() => this.init());
  }

  init(): void {
    this.initCanvas();
    this.setTranslateXByCurrentTime();
    this.draw();
  }

  setTranslateXByCurrentTime(): void {
    const minutes = this.parseDate2Minute(this.currentTime as Date);
    const x = (this.gap / 30) * minutes;
    if (
      x > this.canvas.width / 2 &&
      x < this.gap * 48 - this.canvas.width / 2
    ) {
      this.translateX = this.canvas.width / 2 - x;
    } else if (x >= this.gap * 48 - this.canvas.width / 2) {
      this.translateX = this.canvas.width - this.gap * 48;
    }
  }

  draw(): void {
    this.drawBackground();
    this.drawTimeLine();
    this.drawValidRange();
    this.drawCurrent();
  }

  initCanvas(): void {
    this.canvas.width = Math.round(this.canvas.offsetWidth);
    this.canvas.height = 6 * this.rowHeight;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.textBaseline = 'bottom';
    this.ctx.textAlign = 'center';
    this.ctx.font = '12px Arial';

    this.selectorCanvas.width = this.canvas.width;
    this.selectorCanvas.height = this.canvas.height;
    this.selectorCtx = this.selectorCanvas.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.selectorCtx.textBaseline = 'bottom';
    this.selectorCtx.textAlign = 'center';
    this.selectorCtx.font = '14px Arial';
    this.selectorCtx.fillStyle = '#fff';
    this.selectorCtx.strokeStyle = '#007fff';
  }

  drawBackground(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#444';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#2d2d2d';
    this.ctx.clearRect(
      0,
      3.5 * this.rowHeight,
      this.canvas.width,
      2 * this.rowHeight
    );
    this.ctx.fillRect(
      0,
      3.5 * this.rowHeight,
      this.canvas.width,
      2 * this.rowHeight
    );
  }

  drawTimeLine(): void {
    this.ctx.fillStyle = '#999';
    this.ctx.strokeStyle = '#666';

    const start = Math.floor(-this.translateX / this.gap);
    const count = Math.ceil(this.canvas.width / this.gap) + start;
    const textY = this.rowHeight * 3;
    for (let i = start > 0 ? start : 1; i < count; i++) {
      const timeText = `${Math.floor(i / 2)
        .toString()
        .padStart(2, '0')}:${(30 * (i % 2)).toString().padStart(2, '0')}`;
      const x = this.gap * i + this.translateX;
      this.ctx.fillText(timeText, x, textY);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 3 * this.rowHeight);
      this.ctx.lineTo(x, 3.5 * this.rowHeight);
      this.ctx.moveTo(x, 5.5 * this.rowHeight);
      this.ctx.lineTo(x, 6 * this.rowHeight);
      this.ctx.closePath();
      this.ctx.stroke();
    }
  }

  drawValidRange(): void {
    this.ctx.fillStyle = '#007fff80';
    const multiple = this.gap / 30;
    for (const range of this.timeRangeArr) {
      const x = range.start * multiple + this.translateX;
      const w = (range.end - range.start) * multiple;
      if (x + w < 0 || x > this.canvas.width) {
        continue;
      }
      this.ctx.fillRect(
        x,
        4 * this.rowHeight,
        (range.end - range.start) * multiple,
        this.rowHeight
      );
    }
  }

  drawCurrent(): void {
    if (this.currentTime) {
      this.selectorCtx.clearRect(
        0,
        0,
        this.selectorCanvas.width,
        this.selectorCanvas.height
      );
      const multiple = this.gap / 30;
      const x =
        this.parseDate2Minute(this.currentTime) * multiple + this.translateX;
      this.selectorCtx.fillText(
        this.parseDate2String(this.currentTime),
        x,
        2 * this.rowHeight
      );
      this.selectorCtx.save();
      this.selectorCtx.beginPath();
      this.selectorCtx.moveTo(x, 3 * this.rowHeight);
      this.selectorCtx.lineTo(x, 3.5 * this.rowHeight);
      this.selectorCtx.moveTo(x, 5.5 * this.rowHeight);
      this.selectorCtx.lineTo(x, this.selectorCanvas.height);
      this.selectorCtx.closePath();
      this.selectorCtx.stroke();
      this.selectorCtx.beginPath();
      this.selectorCtx.lineWidth = 3;
      this.selectorCtx.moveTo(x, 3.5 * this.rowHeight);
      this.selectorCtx.lineTo(x, 5.5 * this.rowHeight);
      this.selectorCtx.stroke();
      this.selectorCtx.restore();
    }
  }

  drawHoverTime(x: number): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.rowHeight);
    this.ctx.fillStyle = '#444';
    this.ctx.fillRect(0, 0, this.canvas.width, this.rowHeight);
    this.ctx.fillStyle = '#fff';
    const text = this.parseDate2String(this.calcDate(x));
    this.ctx.fillText(text, x, this.rowHeight);
  }

  parseTimeRange(arr: TimeRange[]): void {
    for (const range of arr) {
      let { start, end } = range;
      const [rangeStart, rangeEnd] = [
        new Date(`${this.parseDate2String(this.date, 'yyyy-MM-dd')} 00:00:00`),
        new Date(
          `${this.parseDate2String(
            new Date(this.date.getTime() + 24 * 60 * 60000),
            'yyyy-MM-dd'
          )} 00:00:00`
        ),
      ];
      if (range.start > rangeEnd || range.start < rangeStart) {
        continue;
      }
      if (range.start < rangeStart) {
        start = rangeStart;
      }
      if (range.end > rangeEnd) {
        end = rangeEnd;
      }
      this.timeRangeArr.push({
        start: this.parseDate2Minute(start),
        end: this.parseDate2Minute(end),
        dateArr: [start, end],
      });
      this.timeRangeArr.sort((a, b) => a.start - b.start);
    }
  }

  parseDate2Minute(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
  }

  parseDate2String(date: Date, format: string = 'yyyy-MM-dd hh:mm:ss'): string {
    const val: any = {
      y: date.getFullYear(),
      M: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
    };
    return format.replace(/(y+|M+|d+|h+|m+|s+)/g, (v) =>
      val[v.slice(-1)].toString().padStart(v.length, '0')
    );
  }

  onMouseHover(event: any): void {
    if (this.isDrag) {
      const diff = event.movementX;
      const totalWidth = this.gap * 48;
      if (diff < 0) {
        this.translateX =
          totalWidth >= this.canvas.width - this.translateX - diff
            ? this.translateX + diff
            : this.canvas.width - totalWidth;
      } else {
        this.translateX =
          this.translateX + diff <= 0 ? this.translateX + diff : 0;
      }
      if (!this.isTicking) {
        requestAnimationFrame(() => {
          this.draw();

          this.isTicking = false;
          // this.ctx.drawImage(canvas, 0, 0);
        });
      }
    } else {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.x;
      if (!this.isTicking) {
        requestAnimationFrame(() => {
          this.drawHoverTime(x);

          this.isTicking = false;
        });
      }
    }
    this.isTicking = true;
  }

  onMouseOut(event: any): void {
    requestAnimationFrame(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.rowHeight);
      this.ctx.fillStyle = '#444';
      this.ctx.fillRect(0, 0, this.canvas.width, this.rowHeight);
    });
    this.isDrag = false;
  }

  setCurrent(x: number): void {
    const date = this.calcDate(x);
    let currentTime = null;
    for (let i = 0, len = this.timeRangeArr.length; i < len; i++) {
      if (this.timeRangeArr[i].dateArr[0] > date) {
        currentTime = this.timeRangeArr[i].dateArr[0];
        break;
      }
      if (this.timeRangeArr[i].dateArr[1] < date) {
        if (
          this.timeRangeArr[i + 1] &&
          this.timeRangeArr[i + 1].dateArr[0] > date
        ) {
          currentTime = this.timeRangeArr[i + 1].dateArr[0];
          break;
        }
        continue;
      }
      if (
        date >= this.timeRangeArr[i].dateArr[0] &&
        date <= this.timeRangeArr[i].dateArr[1]
      ) {
        currentTime = date;
        break;
      }
    }
    if (currentTime) {
      this.currentTime = currentTime;
      if (
        this.parseDate2Minute(this.currentTime) * this.gap / 30 >=
        this.canvas.width - this.translateX
      ) {
        this.setTranslateXByCurrentTime();
        this.draw();
      } else {
        this.drawCurrent();
      }
      this.currentTimeChange.emit(this.currentTime);
    }
  }

  onMouseDown(event: any): void {
    event.preventDefault();
    event.stopPropagation();
    setTimeout(() => {
      if (this.isDrag) {
        event.target.style.cursor = 'grab';
        this.ctx.clearRect(0, 0, this.canvas.width, this.rowHeight);
        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(0, 0, this.canvas.width, this.rowHeight);
      }
    }, 150);
    this.mouseDownPoint = { x: event.clientX, time: new Date().getTime() };
    this.isDrag = true;
  }

  onMouseUp(event: any): void {
    if (!this.mouseDownPoint) {
      return;
    }
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.x;
    if (new Date().getTime() - this.mouseDownPoint.time < 150) {
      // click
      this.setCurrent(x);
    }
    this.mouseDownPoint = null;
    event.target.style.cursor = '';
    this.isDrag = false;
  }

  onMouseWheel(event: any): void {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.x;
    const date = this.calcDate(x);
    if (event.deltaY > 0 && this.gap > 60) {
      this.gap -= 30;
    } else if (event.deltaY < 0 && this.gap < 240) {
      this.gap += 30;
    } else {
      return;
    }
    const minutes = this.parseDate2Minute(date);
    const totalWidth = this.gap * 48;
    this.translateX = x - (minutes * this.gap) / 30;
    if (totalWidth - this.canvas.width + this.translateX <= 0) {
      this.translateX = this.canvas.width - totalWidth;
    } else if (this.translateX >= 0) {
      this.translateX = 0;
    }
    if (!this.isTicking) {
      window.requestAnimationFrame(() => {
        this.draw();
        this.drawHoverTime(x);
        this.isTicking = false;
      });
    }
    this.isTicking = true;
  }

  zoomIn(): void {
    if (this.gap >= 240) {
      return;
    }
    const originTime = this.currentTime || this.date;
    const x =
      (originTime.getHours() * 60 +
        originTime.getMinutes() +
        originTime.getSeconds() / 60) *
        (this.gap / 30) +
      this.translateX;
    this.gap += 30;
    const minutes = this.parseDate2Minute(originTime);
    const totalWidth = this.gap * 48;
    this.translateX = x - (minutes * this.gap) / 30;
    if (totalWidth - this.canvas.width + this.translateX <= 0) {
      this.translateX = this.canvas.width - totalWidth;
    } else if (this.translateX >= 0) {
      this.translateX = 0;
    }
    if (!this.isTicking) {
      window.requestAnimationFrame(() => {
        this.draw();
        this.isTicking = false;
      });
    }
    this.isTicking = true;
  }

  zoomOut(): void {
    if (this.gap <= 60) {
      return;
    }
    const originTime = this.currentTime || this.date;
    const x =
      (originTime.getHours() * 60 +
        originTime.getMinutes() +
        originTime.getSeconds() / 60) *
        (this.gap / 30) +
      this.translateX;
    this.gap -= 30;
    const minutes = this.parseDate2Minute(originTime);
    const totalWidth = this.gap * 48;

    this.translateX = x - (minutes * this.gap) / 30;
    if (totalWidth - this.canvas.width + this.translateX <= 0) {
      this.translateX = this.canvas.width - totalWidth;
    } else if (this.translateX >= 0) {
      this.translateX = 0;
    }
    if (!this.isTicking) {
      window.requestAnimationFrame(() => {
        this.draw();
        this.isTicking = false;
      });
    }
    this.isTicking = true;
  }

  slideLeft(): void {
    const totalWidth = this.gap * 48;
    const diff = 100;
    this.translateX = this.translateX + diff <= 0 ? this.translateX + diff : 0;
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        this.draw();

        this.isTicking = false;
      });
    }
    this.isTicking = true;
  }

  slideRight(): void {
    const totalWidth = this.gap * 48;
    const diff = -100;
    this.translateX =
      totalWidth >= this.canvas.width - this.translateX - diff
        ? this.translateX + diff
        : this.canvas.width - totalWidth;
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        this.draw();

        this.isTicking = false;
      });
    }
    this.isTicking = true;
  }

  calcDate(x: number): Date {
    const actualX = x - this.translateX;
    return new Date(
      new Date(
        `${this.parseDate2String(this.date, 'yyyy-MM-dd')} 00:00:00`
      ).getTime() +
        (actualX / this.gap) * 30 * 60000
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
