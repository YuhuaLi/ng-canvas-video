import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgCanvasVideoComponent } from './ng-canvas-video.component';

describe('NgCanvasVideoComponent', () => {
  let component: NgCanvasVideoComponent;
  let fixture: ComponentFixture<NgCanvasVideoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgCanvasVideoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgCanvasVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
