import { TestBed } from '@angular/core/testing';

import { NgCanvasVideoService } from './ng-canvas-video.service';

describe('NgCanvasVideoService', () => {
  let service: NgCanvasVideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgCanvasVideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
