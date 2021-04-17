/**
 * Definition of pattern object.
 * @class
 */

export class Pattern {
  height: number;
  width: number;
  pattern: Array<Array<boolean>>;
  favorite: boolean;
  id: number;
  name: string;

  constructor(patternArray = null) {
    this.favorite = false;
    this.id = -1;
    if (patternArray) {
      this.setPattern(patternArray);
    } else {
      this.height = 0;
      this.width = 0;
      this.pattern = [];
    }
  }


  setPattern(pattern) {
    this.height = pattern.length;

    if (this.height > 0) {
      this.width = pattern[0].length;
    } else {
      this.width = 0;
    }

    this.pattern = pattern;

    return this;
  }
}