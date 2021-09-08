import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
// import { NgCanvasVideoModule } from 'projects/ng-canvas-video/src/lib/ng-canvas-video.module';
// import { NgTimeSliderModule } from 'projects/ng-time-slider/src/public-api';
import { NgCanvasVideoModule } from 'ng-canvas-video';
import { NgTimeSliderModule } from 'ng-time-slider';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgCanvasVideoModule,
    NgTimeSliderModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
