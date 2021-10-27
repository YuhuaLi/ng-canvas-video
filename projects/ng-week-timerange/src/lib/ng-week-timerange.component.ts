import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Range } from './model/range';
import { Status } from './model/status';

@Component({
  selector: 'lib-ng-week-timerange',
  template: `
    <div class="wrapper">
      <canvas class="back" #back></canvas>
      <canvas
        tabindex="1"
        autofocus
        #canvas
        (mousemove)="onMouseMove($event)"
        (mousedown)="onMouseDown($event)"
        (mouseup)="onMouseUp($event)"
        (mouseover)="onMouseOver($event)"
        (mouseout)="onMouseOut($event)"
        (dblclick)="onDblClick($event)"
        (keydown)="onKeyDown($event)"
      ></canvas>
      <canvas class="front" #front></canvas>
      <canvas class="active" #active></canvas>
      <ul
        class="tools"
        [ngStyle]="{ width: actionWidth + 'px', top: headerHeight + 'px' }"
      >
        <li *ngFor="let week of weeks; let i = index">
          <span class="action iconfont icon-copy"></span>
          <span
            class="action iconfont icon-delete"
            (click)="clearDayRange($event, i)"
          ></span>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
      .wrapper {
        position: relative;
        width: 960px;
        height: 320px;
      }
      canvas.back,
      canvas.front,
      canvas.active {
        pointer-events: none;
      }
      canvas {
        outline: none;
        position: absolute;
        top: 0;
        left: 0;
        width: 960px;
        height: 370px;
      }
      ul.tools {
        list-style: none;
        position: absolute;
        right: 0;
        margin: 0;
        padding: 0;
        z-index: 10;
      }
      ul.tools li {
        display: flex;
        justify-content: space-around;
        align-items: center;
        height: 50px;
      }
      ul.tools li span.action {
        cursor: pointer;
      }
      ul.tools li span.action:hover {
        color: #007fff;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgWeekTimerangeComponent implements OnInit, AfterViewInit {
  @ViewChild('back') backElem!: ElementRef;
  @ViewChild('canvas') canvasElem!: ElementRef;
  @ViewChild('front') frontElem!: ElementRef;
  @ViewChild('active') activElem!: ElementRef;
  backCtx!: CanvasRenderingContext2D;
  frontCtx!: CanvasRenderingContext2D;
  ctx!: CanvasRenderingContext2D;
  activeCtx!: CanvasRenderingContext2D;

  get canvas(): HTMLCanvasElement {
    return this.canvasElem.nativeElement as HTMLCanvasElement;
  }
  get backCanvas(): HTMLCanvasElement {
    return this.backElem.nativeElement as HTMLCanvasElement;
  }
  get frontCanvas(): HTMLCanvasElement {
    return this.frontElem.nativeElement as HTMLCanvasElement;
  }
  get activeCanvas(): HTMLCanvasElement {
    return this.activElem.nativeElement as HTMLCanvasElement;
  }
  rowUnit = 0;
  heightUnit = 0;
  headerHeight = 20;
  actionWidth = 50;
  weekNameWidth = 80;
  spinWidth = 6;
  weeks = [
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
    '星期日',
  ];
  renderring = false;
  status = Status.None;
  mousedownTimeoutId: any;
  rafId: any;

  timeRange: Range[][] = Array.from({ length: 7 }, (item) => []);

  activeRange?: Range; // 缓存新增时间段
  selectedRange?: Range; // 选中时间段
  pointOffsetLeft: any; // mousedown时偏差
  preMovePoint?: { x: number; y: number }; // 上次鼠标位置

  constructor(private cdr: ChangeDetectorRef, private vcf: ViewContainerRef) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.init();
  }

  init(): void {
    this.initCanvas();
  }

  initCanvas(): void {
    this.canvas.width = Math.round(this.canvas.offsetWidth);
    this.canvas.height = Math.round(this.canvas.offsetHeight);
    this.backCanvas.width = this.canvas.width;
    this.backCanvas.height = this.canvas.height;
    this.frontCanvas.width = this.canvas.width;
    this.frontCanvas.height = this.canvas.height;
    this.activeCanvas.width = this.canvas.width;
    this.activeCanvas.height = this.canvas.height;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.backCtx = this.backCanvas.getContext('2d') as CanvasRenderingContext2D;
    this.frontCtx = this.frontCanvas.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.activeCtx = this.activeCanvas.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.rowUnit =
      (this.canvas.width - this.actionWidth - this.weekNameWidth) / 12;
    this.heightUnit = (this.canvas.height - this.headerHeight) / 7;
    this.backCtx.fillStyle = '#aaa';

    this.ctx.fillStyle = '#ccc';
    this.frontCtx.fillStyle = '#007fff';
    this.activeCtx.fillStyle = '#007fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);
    this.ctx.fillRect(
      12 * this.rowUnit + this.weekNameWidth,
      this.headerHeight,
      this.actionWidth,
      this.canvas.height - this.headerHeight
    );

    this.ctx.strokeStyle = '#ccc';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.headerHeight);
    this.ctx.lineTo(0, this.canvas.height);
    for (let i = 0; i < 12; i++) {
      this.ctx.moveTo(this.weekNameWidth + i * this.rowUnit, this.headerHeight);
      this.ctx.lineTo(
        this.weekNameWidth + i * this.rowUnit,
        this.canvas.height
      );
    }
    this.ctx.moveTo(0, this.canvas.height);
    this.ctx.lineTo(this.canvas.width, this.canvas.height);
    this.ctx.stroke();

    this.ctx.textBaseline = 'middle';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';
    for (let i = 0; i < this.weeks.length; i++) {
      this.ctx.fillText(
        this.weeks[i],
        this.weekNameWidth / 2,
        this.headerHeight + (i + 0.5) * this.heightUnit,
        this.rowUnit
      );
    }
    this.ctx.textAlign = 'left';
    for (let i = 0; i < 12; i++) {
      this.ctx.fillText(
        `${2 * i}`.padStart(2, '0'),
        this.weekNameWidth + i * this.rowUnit,
        this.headerHeight / 2
      );
    }
    this.ctx.textAlign = 'right';
    this.ctx.fillText(
      '24',
      this.weekNameWidth + 12 * this.rowUnit,
      this.headerHeight / 2
    );
  }

  onMouseMove(event: MouseEvent): void {
    const x = event.offsetX;
    const y = event.offsetY;
    this.preMovePoint = { x, y };
    this.raf(() => {
      if (this.status !== Status.ResizeRange) {
        if (y > this.headerHeight) {
          this.canvas.style.cursor = 'pointer';
          this.backCtx.clearRect(
            0,
            0,
            this.backCanvas.width,
            this.backCanvas.height
          );
          const idx = Math.floor((y - this.headerHeight) / this.heightUnit);
          this.backCtx.fillRect(
            0,
            this.headerHeight + idx * this.heightUnit,
            this.backCanvas.width,
            this.heightUnit
          );
        } else {
          this.canvas.style.cursor = 'default';
        }
      }

      if (this.status === Status.SetRange && this.activeRange) {
        this.clearRange(this.activeRange, this.frontCtx);
        this.activeRange.end = this.calcSetBound(this.activeRange, x);

        this.drawRange(this.activeRange, this.frontCtx);
        // this.timeRange[this.activeRange.week].push(this.activeRange);
      } else if (this.status === Status.MoveRange && this.selectedRange) {
        let start = x - this.pointOffsetLeft;
        let end =
          x -
          this.pointOffsetLeft +
          this.selectedRange.end -
          this.selectedRange.start;
        // if (start <= this.weekNameWidth) {
        //   start = this.weekNameWidth;
        //   end = start + this.selectedRange.end - this.selectedRange.start;
        // } else if (end >= this.canvas.width - this.actionWidth) {
        //   end = this.canvas.width - this.actionWidth;
        //   start = end - this.selectedRange.end + this.selectedRange.start;
        // }
        let pre = start;
        start = this.calcSetBound(this.selectedRange, start);
        if (pre === start) {
          pre = end;
          end = this.calcSetBound(this.selectedRange, end);
          start = end - this.selectedRange.end + this.selectedRange.start;
        } else {
          end = start + this.selectedRange.end - this.selectedRange.start;
        }
        this.clearSelectedRange();
        this.selectedRange.start = start;
        this.selectedRange.end = end;
        this.drawSelectedRange();
      } else if (this.status === Status.ResizeRange && this.selectedRange) {
        const isLeftResize = this.canvas.style.cursor === 'w-resize';
        if (isLeftResize) {
          let start = x - this.pointOffsetLeft;
          // if (start <= this.weekNameWidth) {
          //   start = this.weekNameWidth;
          // } else if (
          //   start > this.selectedRange.end &&
          //   start >= this.canvas.width - this.actionWidth
          // ) {
          //   start = this.canvas.width - this.actionWidth;
          //   console.log(2);
          // }
          start = this.calcResizeBound(this.selectedRange, start);
          this.selectedRange.start = start;
        } else {
          let end = x - this.pointOffsetLeft;
          // if (end >= this.canvas.width - this.actionWidth) {
          //   end = this.canvas.width - this.actionWidth;
          // } else if (
          //   end < this.selectedRange.start &&
          //   end <= this.weekNameWidth
          // ) {
          //   end = this.weekNameWidth;
          // }
          end = this.calcResizeBound(this.selectedRange, end);
          this.selectedRange.end = end;
        }
        this.clearSelectedRange();
        this.drawSelectedRange();
      } else {
        const range = this.getRangeByPoint(x, y);
        if (range && range.selected) {
          const isLeftResize =
            range.start + this.spinWidth / 2 >= x &&
            range.start - this.spinWidth / 2 <= x;
          const isRightResize =
            range.end - this.spinWidth / 2 <= x &&
            range.end + this.spinWidth / 2 >= x;
          if (isLeftResize) {
            this.canvas.style.cursor = `w-resize`;
          } else if (isRightResize) {
            this.canvas.style.cursor = `e-resize`;
          }
        }
      }
    });
  }

  onMouseOver(event: MouseEvent): void {}

  onMouseOut(event: MouseEvent): void {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId);
      this.renderring = false;
    }
    this.backCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.preMovePoint = undefined;
    this.pointOffsetLeft = 0;
    this.status = Status.None;
    this.activeRange = undefined;
  }

  onMouseDown(event: MouseEvent): void {
    (event.target as any).focus();
    const x = event.offsetX;
    const y = event.offsetY;
    const range = this.getRangeByPoint(x, y);
    if (range) {
      if (range !== this.selectedRange) {
        range.selected = true;
        this.setSelectedRange(range);
      }
      this.status = Status.SelectRange;
    }
    this.mousedownTimeoutId = setTimeout(() => {
      if (range) {
        const isLeftResize =
          range.start + this.spinWidth / 2 >= x &&
          range.start - this.spinWidth / 2 <= x;
        const isRightResize =
          range.end - this.spinWidth / 2 <= x &&
          range.end + this.spinWidth / 2 >= x;
        if (range.selected && (isLeftResize || isRightResize)) {
          this.status = Status.ResizeRange;
          this.pointOffsetLeft = x - (isLeftResize ? range.start : range.end);
          // this.canvas.style.cursor = `${isLeftResize ? 'w' : 'e'}-resize`;
          // this.cdr.detectChanges();
        } else if (this.selectedRange === range) {
          this.status = Status.MoveRange;
          this.pointOffsetLeft = x - range.start;
        }
      } else {
        if (
          y >= this.headerHeight &&
          x >= this.weekNameWidth - this.spinWidth
        ) {
          this.status = Status.SetRange;
          const start = x < this.weekNameWidth ? this.weekNameWidth : x;
          this.activeRange = {
            week: Math.floor((y - this.headerHeight) / this.heightUnit),
            start,
            end: start,
            selected: false,
          };
          this.setSelectedRange();
        }
      }
    }, 100);
  }

  onMouseUp(event: MouseEvent): void {
    console.log(event);
    const x = event.offsetX;
    const y = event.offsetY;
    if (this.mousedownTimeoutId) {
      clearTimeout(this.mousedownTimeoutId);
      this.mousedownTimeoutId = null;
    }
    if (this.status === Status.SetRange && this.activeRange) {
      if (this.activeRange.start > this.activeRange.end) {
        const temp = this.activeRange.start;
        this.activeRange.start = this.activeRange.end;
        this.activeRange.end = temp;
      }
      if (this.activeRange.start !== this.activeRange.end) {
        const weekRanges = this.timeRange[this.activeRange.week];
        if (weekRanges.length) {
          let i = 0;
          for (; i < weekRanges.length; i++) {
            if (weekRanges[i].start > this.activeRange.start) {
              break;
            }
          }
          weekRanges.splice(i, 0, this.activeRange);
        } else {
          this.timeRange[this.activeRange.week].push(this.activeRange);
        }
        this.clearRange(this.activeRange, this.frontCtx);
        this.drawRange(this.activeRange, this.activeCtx);

        // this.clearSelectedRange();
        // this.activeRange.selected = true;
        // this.selectedRange = this.activeRange;
        // this.drawSelectedRange();
        this.setSelectedRange(this.activeRange);
      } else {
        this.clearSelectedRange();
        this.selectedRange = undefined;
      }
      this.activeRange = undefined;
    } else if (
      (this.status === Status.SelectRange ||
        (this.status === Status.MoveRange &&
          this.preMovePoint &&
          this.preMovePoint.x === x &&
          this.preMovePoint.y === y)) &&
      this.selectedRange
    ) {
    }
    this.preMovePoint = undefined;
    this.pointOffsetLeft = 0;
    this.status = Status.None;
    this.canvas.style.cursor =
      x > this.weekNameWidth && y > this.headerHeight ? 'pointer' : 'default';
  }

  setSelectedRange(range?: Range): void {
    if (this.selectedRange) {
      if (
        this.timeRange[this.selectedRange.week].findIndex(
          (item) => item === this.selectedRange
        ) > -1
      ) {
        this.drawRange(this.selectedRange, this.frontCtx);
      }
      this.selectedRange.selected = false;
    }
    this.clearSelectedRange();
    if (range) {
      range.selected = true;
      this.selectedRange = range;
      this.drawSelectedRange();
      this.clearRange(range, this.frontCtx);
    }
  }

  onDblClick(event: MouseEvent): void {
    const x = event.offsetX;
    const y = event.offsetY;
    const range = this.getRangeByPoint(x, y);
    if (range) {
      this.deleteRange(range);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' && this.selectedRange) {
      this.deleteRange(this.selectedRange);
    }
  }

  deleteRange(range: Range): void {
    const index = this.timeRange[range.week].findIndex(
      (item) => item === range
    );
    this.timeRange[range.week].splice(index, 1);
    if (this.selectedRange === range) {
      this.clearSelectedRange();
      this.selectedRange = undefined;
    }
  }

  raf(func: () => void): void {
    if (!this.renderring) {
      this.rafId = window.requestAnimationFrame(() => {
        func.call(this);
        this.renderring = false;
      });
      this.renderring = true;
    }
  }

  getRangeByPoint(x: number, y: number): Range | null {
    if (y <= this.headerHeight) {
      return null;
    }
    const week = Math.floor((y - this.headerHeight) / this.heightUnit);
    for (const range of this.timeRange[week]) {
      if (!range.selected && range.start <= x && range.end >= x) {
        return range;
      } else if (
        range.selected &&
        range.start - this.spinWidth / 2 <= x &&
        range.end + this.spinWidth / 2 >= x
      ) {
        return range;
      }
    }
    return null;
  }

  drawRange(range: Range, ctx: CanvasRenderingContext2D): void {
    ctx.fillRect(
      range.start,
      this.headerHeight + range.week * this.heightUnit + this.heightUnit / 4,
      range.end - range.start,
      this.heightUnit / 2
    );
  }

  clearSelectedRange(): void {
    // if (this.selectedRange) {
    //   this.activeCtx.clearRect(
    //     this.selectedRange.start - this.spinWidth / 2 - 1,
    //     this.selectedRange.week * this.heightUnit + this.headerHeight - 1,
    //     this.spinWidth + this.selectedRange.end - this.selectedRange.start + 2,
    //     this.heightUnit / 4
    //   );
    //   this.activeCtx.clearRect(
    //     this.selectedRange.start - this.spinWidth / 2 - 1,
    //     this.selectedRange.week * this.heightUnit +
    //       0.75 * this.heightUnit +
    //       this.headerHeight +
    //       1,
    //     this.spinWidth + this.selectedRange.end - this.selectedRange.start + 2,
    //     this.heightUnit / 4
    //   );
    // }
    this.activeCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSelectedRange(): void {
    if (this.selectedRange) {
      this.drawTriangle(
        this.activeCtx,
        this.selectedRange.start,
        this.selectedRange.week * this.heightUnit + this.headerHeight,
        'down'
      );
      this.drawTriangle(
        this.activeCtx,
        this.selectedRange.end,
        this.selectedRange.week * this.heightUnit + this.headerHeight,
        'down'
      );
      this.drawTriangle(
        this.activeCtx,
        this.selectedRange.start,
        (this.selectedRange.week + 1) * this.heightUnit + this.headerHeight,
        'up'
      );
      this.drawTriangle(
        this.activeCtx,
        this.selectedRange.end,
        (this.selectedRange.week + 1) * this.heightUnit + this.headerHeight,
        'up'
      );
      this.drawRange(this.selectedRange, this.activeCtx);
    }
  }

  drawTriangle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: 'up' | 'down'
  ): void {
    ctx.beginPath();
    ctx.moveTo(x - this.spinWidth / 2, y);
    ctx.lineTo(x + this.spinWidth / 2, y);
    ctx.lineTo(
      x,
      y +
        (direction === 'down' ? 1 : -1) * Math.sin(Math.PI / 3) * this.spinWidth
    );
    ctx.closePath();
    ctx.fill();
  }

  clearRange(range: Range, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(
      range.start,
      this.headerHeight + range.week * this.heightUnit,
      range.end - range.start,
      this.heightUnit
    );
  }

  clearDayRange(event: MouseEvent, week: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.selectedRange?.week === week) {
      this.setSelectedRange();
    }
    this.timeRange[week].splice(0);
    this.frontCtx.clearRect(
      this.weekNameWidth,
      this.headerHeight + week * this.heightUnit,
      this.canvas.width,
      this.heightUnit
    );
  }

  calcResizeBound(range: Range, x: number): number {
    const weekRanges = this.timeRange[range.week];
    const [min, max] = [
      Math.min(range.start, range.end),
      Math.max(range.start, range.end),
    ];
    if (x > max) {
      let bound = this.canvas.width - this.actionWidth;
      for (const weekRange of weekRanges) {
        if (weekRange.start <= x && weekRange.start >= max) {
          bound = weekRange.start;
          break;
        }
      }
      return x < bound ? x : bound;
    } else if (x < min) {
      let bound = this.weekNameWidth;
      for (const weekRange of weekRanges) {
        if (weekRange.end >= x && weekRange.end <= range.start) {
          bound = weekRange.end > bound ? weekRange.end : bound;
        } else if (weekRange.start >= range.start) {
          break;
        }
      }
      return x > bound ? x : bound;
    }

    return x;
  }

  calcSetBound(range: Range, x: number): number {
    const weekRanges = this.timeRange[range.week];
    if (x > range.start) {
      let bound = this.canvas.width - this.actionWidth;
      for (const weekRange of weekRanges) {
        if (weekRange === range) {
          continue;
        }
        if (weekRange.start <= x && weekRange.start >= range.start) {
          bound = weekRange.start;
          break;
        }
      }
      return x < bound ? x : bound;
    } else if (x < range.start) {
      let bound = this.weekNameWidth;
      for (const weekRange of weekRanges) {
        if (weekRange === range) {
          continue;
        }
        if (weekRange.end >= x && weekRange.end <= range.start) {
          bound = weekRange.end > bound ? weekRange.end : bound;
        } else if (weekRange.start >= range.start) {
          break;
        }
      }
      return x > bound ? x : bound;
    }

    return x;
  }
}
