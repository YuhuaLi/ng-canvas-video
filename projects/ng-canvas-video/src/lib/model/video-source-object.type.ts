import { VideoSource } from './video-source.type';

export type VideoSourceObject = Exclude<VideoSource, string>;
