import { Shape } from './shape';
import { Effect } from './effect';
import { Point } from './point';

/**
 * FILE: region.ts
 * Definition of Region object, representing a section of the draft
 * that may or may not be rectangular in its Shape, but has a single 
 * Effect applied across its entire Shape.
 * @class
 */

export class Region {
	id: number;
	name: string;

	start: Point; // see selection.ts, upper-left corner of bounding box
	end: Point; // lower-right corner of bounding box
	width: number; // max number of warp ends across (longest row)
	height: number; // number of picks

	effect: Effect;
	shape: Shape;

	selvedge: boolean; // whether or not the region will interact with the cloth's selvedge (i.e. brocade vs supp weft)

	// minimal example of region: automatically create from a rectangular selection and one pattern fill
	fromSelection(sel, patt) {
		this.start = sel.start;
		this.end = sel.end;
		this.width = sel.width;
		this.height = sel.height;

		this.shape = new Shape(this.start, this.end);
		this.effect = new Effect(patt);
	}

	isShaped() {
		if (this.shape.isSimple()) {
			return false;
		} else { return true; }
	}

	// set/get functions
	setID(id: number) {
	    this.id = id;
	    if (!this.name) {
	      this.name = 'Region ' + (id + 1);
		}
		if (this.shape.id === undefined || this.shape.id < 0) {
			this.shape.id = this.id;
		}
		if (this.effect.id === undefined || this.effect.id < 0) {
			this.effect.id = this.id;
		}
	}

	printout() {
		var str = this.name + " has shape ";
		str += this.shape.id + ", filled with effect ";
		str += this.effect.name;
		return str;
	}
}
