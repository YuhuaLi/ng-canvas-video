import { TestBed } from '@angular/core/testing';

import { NgWeekTimerangeService } from './ng-week-timerange.service';

describe('NgWeekTimerangeService', () => {
  let service: NgWeekTimerangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgWeekTimerangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
