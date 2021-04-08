import { Point } from './point';

/**
 * FILE: shape.ts
 * Definition of Shape object (based on first iteration from Unfabricate), representing a non-rectangular shape that can be applied to a Selection or Region.
 * Reserve some number of warp ends for the shape, and track path of 
 * weft(s) to represent the shape that it is filling.
 * @class
 */
export class Shape {
	id: number;
	name: string;
	startCol: number; // first warp belonging to shape
	endCol: number; // last warp belonging to shape
	startRow: number;
	endRow: number;

	bounds: Object; // delimit shape by indicating where each row starts and ends in a dictionary; entries are [draft row #: {start, end}]

	/**
	 * Constructor needs start and end point from 
	 * the parent element (a Region or Selection)
	 */
	constructor(start:Point = null, end:Point = null) {
		if (start && end) {
			this.startCol = start.j;
			this.endCol = end.j;
			this.startRow = start.i;
			this.endRow = end.i;
		}
		this.bounds = new Object(); // try storing bounds as a dict-like Object
	}

	// returns a deep copy of itself
	copy() {
		var copy = new Shape();
		copy.id = this.id;
		copy.name = this.name + " copy";
		copy.startCol = this.startCol;
		copy.endCol = this.endCol;
		copy.startRow = this.startRow;
		copy.endRow = this.endRow;
		copy.bounds = Object.assign(this.bounds);
		return copy;
	}

	// set/get functions
	setID(id: number) {
	    this.id = id;
	    if (!this.name) {
	      this.name = 'Shape ' + (id + 1);
		}
	}

	setStartEnd(start: number, end: number) {
		this.startCol = start;
		this.endCol = end;
	}

	getPos() {
		let pos = [this.startCol, this.endCol];
		return pos;
	}

	// returns a string listing all bounds of the Shape
	printBounds() {
		// if (this.bounds.length) {
		// 	let boundsString = new String;
		// 	// for element in bounds array
		// 	for (var i = 0; i < this.bounds.length; i++) {
		// 		boundsString += "Row " + i + ": " + this.bounds[i][1] + " to " + this.bounds[i][2];
		// 	}
		// 	return boundsString;
		// } else {
		// 	return "empty shape";
		// }
	}

	/**
	 * A "simple" Shape is a rectangle with an empty bounds Object
	 */
	isSimple() {
		if (Object.keys(this.bounds).length == 0) {
			return true;
		} else {
			return false;
		}		
	}
}
