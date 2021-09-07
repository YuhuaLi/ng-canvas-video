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
    closeable: false,
    width: 480,
    height: 270,
    controls: {
      type: 'outside',
    },
  };
  options1 = {
    autoplay: true,
    closeable: true,
    width: 480,
    height: 270,
    controls: {
      type: 'inside',
      actions: {
        play: false,
        record: false,
        download: false,
        progress: false,
        rate: false
      },
    },
  };
  validDateArr = [
    { start: new Date('2021-09-07 10:31'), end: new Date('2021-09-07 12:41') },
    { start: new Date('2021-09-07 14:11'), end: new Date('2021-09-07 16:49') },
    { start: new Date('2021-09-07 18:21'), end: new Date('2021-09-07 21:50') },
  ];
  date = new Date('2021-09-07 00:00');
  constructor() {
    fetch('assets/mov_bbb.mp4').then((response) => {
      response.blob().then((blob) => (this.src = blob));
    });
  }
}
