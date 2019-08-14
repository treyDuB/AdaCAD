import { Shuttle } from './shuttle';

/**
 * Definition of Shape object, representing a woven shape
 * Reserve some number of warp ends for the shape, and track path of 
 * weft(s) to represent the shape that it is filling.
 * @class
 * 
 */
export class Shape {
	id: number;
	name: string;
	width: number; // number of warp ends across
	sett: number; // number of picks per inch, or maybe warp:weft ratio?
	height: number; // multiple of sett, does not necessarily reflect # of rows in draft
	startCol: number; // first warp belonging to shape
	endCol: number; // last warp belonging to shape
	shuttles: Array<Shuttle>; // associated shuttles
	bounds: Array<Array<number>> // delimit shape by indicating where each pick starts and ends; each element in Array is Array of length 3 - < row num, startCol, endCol >

	/**
	 * Constructor needs width and where the shape is placed
	 */
	constructor() {
		this.shuttles = [];
		this.bounds = [];
	}

	// set functions

	setID(id: number) {
	    this.id = id;
	    if (!this.name) {
	      this.name = 'Shape ' + (id + 1);
		}
	}

	setWidth(width: number) {
		this.width = width;
	}

	setStartCol(col: number) {
		this.startCol = col;
	}

	setEndCol(col: number) {
		this.endCol = col;
	}

	// get functions

	getWidth() {
		return this.width;
	}

	getHeight() {
		return this.height;
	}

	getPos() {
		let pos = [this.startCol, this.endCol];
		return pos;
	}

	// returns a string listing all bounds of the Shape
	printBounds() {
		if (this.bounds.length) {
			let boundsString = new String;
			// for element in bounds array
			for (var i = 0; i < this.bounds.length; i++) {
				boundsString += "Row " + i + ": " + this.bounds[i][1] + " to " + this.bounds[i][2];
			}
			return boundsString;
		} else {
			return "empty shape";
		}
	}

	/**
	 * Once given a shuttle, fills out bounds row by row
	 * implement in draft.ts? draft has access to shuttle row mapping
	 */
	addShuttle(shuttle: Shuttle) {
		this.shuttles.push(shuttle); // add shuttle to associate
	}

	/**
	 * Update height with Shuttle information and sett
	 */
	updateHeight() {
		this.height = 0;
	}
}
