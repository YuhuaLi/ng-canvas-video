import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgTimeSliderComponent } from './ng-time-slider.component';

describe('NgTimeSliderComponent', () => {
  let component: NgTimeSliderComponent;
  let fixture: ComponentFixture<NgTimeSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgTimeSliderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgTimeSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
