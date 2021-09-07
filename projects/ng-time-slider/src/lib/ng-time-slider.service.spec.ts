import { TestBed } from '@angular/core/testing';

import { NgTimeSliderService } from './ng-time-slider.service';

describe('NgTimeSliderService', () => {
  let service: NgTimeSliderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgTimeSliderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
