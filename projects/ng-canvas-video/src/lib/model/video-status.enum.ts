export enum VideoStatus {
  /** 加载失败 */
  Error = -1,
  /** 未初始化 */
  UnInit = 0,
  /** 已初始化 */
  OnInit = 1,
  /** 可以开始播放 */
  CanPlay = 2,
  /** 可以播放全部 */
  CanPlayThrougth = 3,
  /**  播放中 */
  Playing = 4,
  /** 停止 */
  Pause = 5,
  /** 录制中 */
  Recording = 6,
  /** 录制暂停 */
  RecordPause = 7,
  /** 结束播放 */
  Ended = 8,
}
