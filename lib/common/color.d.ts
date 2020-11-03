export declare type RgbaValue = {
    r: number;
    g: number;
    b: number;
    a: number;
};
/**
 *
 * @param num
 */
export declare function numToRgba(num: number): RgbaValue;
/**
 *
 * @param hex
 */
export declare function hexToRgba(hex: string): RgbaValue;
/**
 *
 * @param rgba
 */
export declare function rgbToHex(rgba: RgbaValue): string;
/**
 *
 * @param rgba
 */
export declare function rgbToNum(rgba: RgbaValue): number;
/**
 *
 * @param hex
 */
export declare function hexToNum(hex: string): number;
