import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgWeekTimerangeComponent } from './ng-week-timerange.component';

describe('NgWeekTimerangeComponent', () => {
  let component: NgWeekTimerangeComponent;
  let fixture: ComponentFixture<NgWeekTimerangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgWeekTimerangeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgWeekTimerangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
