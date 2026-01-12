/**
 * Represents a point in a 2D space.
 * Can be used for both normalized (0-1) and pixel coordinates.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Represents the dimensions of a 2D plane (e.g., an image).
 */
export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Converts absolute pixel coordinates to normalized (0-1) coordinates.
 * This is used to save UI interaction points in a resolution-independent format.
 *
 * @param pixelPoint The (x, y) coordinates in pixels from the top-left of the image.
 * @param imageDimensions The total width and height of the source image.
 * @returns A point with normalized (0-1) coordinates.
 */
export function toNormalized(pixelPoint: Point, imageDimensions: Dimensions): Point {
  if (imageDimensions.width === 0 || imageDimensions.height === 0) {
    throw new Error("Image dimensions cannot be zero.");
  }
  return {
    x: pixelPoint.x / imageDimensions.width,
    y: pixelPoint.y / imageDimensions.height,
  };
}

/**
 * Converts normalized (0-1) coordinates back to absolute pixel coordinates.
 * This is used to draw saved points onto a displayed image of any size.
 *
 * @param normalizedPoint The (x, y) coordinates in the 0-1 range.
 * @param displayDimensions The display width and height of the image on the screen.
 * @returns A point with absolute pixel coordinates for drawing.
 */
export function toPixels(normalizedPoint: Point, displayDimensions: Dimensions): Point {
  return {
    x: normalizedPoint.x * displayDimensions.width,
    y: normalizedPoint.y * displayDimensions.height,
  };
}

/**
 * Calculates the pixel coordinates of a mouse event relative to the target element (e.g., the image).
 *
 * @param event The mouse event (e.g., from a click or mousemove).
 * @param targetElement The HTML element on which the event occurred.
 * @returns The (x, y) pixel coordinates relative to the top-left of the element.
 */
export function getEventPixelPosition(
  event: React.MouseEvent<HTMLElement, MouseEvent>,
  targetElement: HTMLElement
): Point {
  const rect = targetElement.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
    
    /**
     * Rotates a point around a center point by a given angle.
     *
     * @param point The point to rotate.
     * @param center The center of rotation.
     * @param angleDegrees The angle of rotation in degrees.
     * @returns The new, rotated point.
     */
    export function rotatePoint(point: Point, center: Point, angleDegrees: number): Point {
      const angleRadians = angleDegrees * (Math.PI / 180);
      const cos = Math.cos(angleRadians);
      const sin = Math.sin(angleRadians);
    
      const px = point.x - center.x;
      const py = point.y - center.y;
    
      const newX = px * cos - py * sin;
      const newY = px * sin + py * cos;
    
      return {
        x: newX + center.x,
        y: newY + center.y,
      };
    }
    
    
