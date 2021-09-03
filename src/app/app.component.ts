import { Component } from '@angular/core';
import { VideoOptions } from 'projects/ng-canvas-video/src/lib/model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ng-canvas-video-app';
  // src = 'webrtc://10.169.88.5/live/test';
  // src = 'assets/mov_bbb.mp4';
  src: any;
  options = {
    autoplay: false,
    width: 480,
    height: 270,
    controls: {
      type: 'outside'
    }
  };
  options1 = {
    autoplay: true,
    closeable: true,
    width: 480,
    height: 270,
    controls: {
      type: 'inside'
    }
  };
  constructor() {
    fetch('assets/mov_bbb.mp4').then((response) => {
      response.blob().then((blob) => (this.src = blob));
    });
  }
}
