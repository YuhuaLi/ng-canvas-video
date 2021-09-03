import { VideoOptions, VideoSource, VideoStatus } from '../model';
import { isString, parseUrl, prepareWebRTCUrl } from '../util/function';
import { Player } from './player';

export class WebRtcPlayer extends Player {
  private con!: RTCPeerConnection;
  constructor(src: VideoSource, options?: VideoOptions) {
    super(src, options);
  }

  setSource(src: VideoSource): void {
    if (this.video$) {
      if (isString(src)) {
        // this.video$.src = this.srcUrl;
        this.getMediaStream(src as string).catch(
          (err) => (this.status$ = VideoStatus.Error)
        );
      } else {
        this.video$.srcObject = this.srcObj$;
      }
      this.status$ = VideoStatus.OnInit;
    }
  }

  /** 获取rtc流 */
  getMediaStream(src: string): Promise<void> {
    const conf = prepareWebRTCUrl(src);
    this.con = new RTCPeerConnection();
    this.con.addTransceiver('audio', { direction: 'recvonly' });
    this.con.addTransceiver('video', { direction: 'recvonly' });
    this.con.ontrack = (event) => {
      this.video$.srcObject = event.streams[0];
      this.recorder$ = this.initMediaRecorder(event.streams[0]);
    };

    return this.con.createOffer().then((offer) => {
      this.con.setLocalDescription(offer);
      const params = {
        api: conf.apiUrl,
        tid: conf.tid,
        streamurl: conf.streamUrl,
        clientip: null,
        sdp: offer.sdp,
      };
      return fetch(conf.apiUrl, {
        method: 'POST',
        body: JSON.stringify(params),
        headers: { 'content-type': 'application/json' },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.code) {
            Promise.reject(data);
          }
          return data;
        })
        .then((data) =>
          this.con.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: data.sdp })
          )
        );
    });
  }

  close(): void {
    this.con.close();
    super.close();
  }
}
