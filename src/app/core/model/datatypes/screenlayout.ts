/***** OBJECTS/TYPES RELATED TO SCREEN LAYOUT ****/

/**
 * describes a point using x,y coordinates
 * often used for referencing mouse and/or screen drawing positions
 */
 export interface Point {
    x: number;
    y: number;
  }
  
  /**
   * Describes a rectangle on the screen.
   * @param topleft - position of this rectanble
   * @param width - the width of the rectangle
   * @param height - the height of this rectanble.
   */
  export interface Bounds {
    topleft: Point;  //row on draft
    width: number;  //column on draft 
    height: number; //corresponding screen row
  }
  
  // /**
  //  * A type to communicate locations on the loom that have been updated in response to a given action
  //  */
  // interface LoomUpdate {
  //   threading: Array<InterlacementVal>,
  //   treadling: Array<InterlacementVal>,
  //   tieup: Array<Array<InterlacementVal>>
  // }