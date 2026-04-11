declare module 'dom-to-image-more' {
  export interface Options {
    filter?: (node: Node) => boolean;
    backgroundColor?: string;
    pixelRatio?: number;
    width?: number;
    height?: number;
    style?: any;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
  }

  export function toSvg(node: Node, options?: Options): Promise<string>;
  export function toPng(node: Node, options?: Options): Promise<string>;
  export function toJpeg(node: Node, options?: Options): Promise<string>;
  export function toBlob(node: Node, options?: Options): Promise<Blob>;
  export function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
}
