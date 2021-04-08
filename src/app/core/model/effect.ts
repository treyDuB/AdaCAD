import { Pattern } from "./pattern";
import { Shuttle } from "./shuttle";
import { System } from "./system";

// var lcm = require( '@stdlib/math/base/special/lcm' );

/**
 * FILE: effect.ts
 * Definition of Effect class (named according to Holyoke Digital 
 * Jacquard Design book), representing an effect that may be 
 * composed of multiple Patterns using multiple Shuttles 
 * and/or warp/weft Systems.
 * @class
 */

 export class Effect {
 	id: number;
 	name: string;

 	patterns: Array<Pattern>; // patterns used to compose the effect
 	complexity: number; // number of patterns used - 1
 	numLayers: number;

 	warp_systems: Array<System>;
 	weft_systems: Array<System>;

	weftSystemRepeat: Array<number>;
	warpSystemRepeat: Array<number>;

 	width: number;
 	height: number;
 	warpStep: number;
 	weftStep: number;
 	data: Array<Array<boolean>>;

 	constructor(basePattern, structureDict = null) {
 		this.id = -1;
 		this.name = basePattern.name;
 		this.patterns = [basePattern];
		this.complexity = 0;
		if (basePattern.name == "Double Weave") {
			this.numLayers = 2;
		} else {
			this.numLayers = 1;
		}

		this.data = basePattern.pattern;

		if (structureDict) { this.updateVariables(structureDict)
		} else {
			this.warp_systems = [];
			this.weft_systems = [];
		}
 	}

 	updateVariables({id, name}) {
	    this.id = id;
	    this.name = name;
	  }


 	addPattern(newPattern, weftSystem, warpSystem = null) {
 		// assume newPattern is on a separate weftSystem
 		this.patterns.push(newPattern);
 		this.weft_systems.push(weftSystem);
 		this.weftSystemRepeat.push(weftSystem.id);
 		// width/height = LCM of all pattern widths/heights
 		if (warpSystem) {
	 		this.warp_systems.push(warpSystem);
	 		this.warpSystemRepeat.push(warpSystem.id);
 		}
 		this.updatePatternData();
 		this.updateComplexity();
 	}

 	updateComplexity() {
 		this.complexity = this.patterns.length - 1;
 		if (this.numLayers > 1) {
 			this.complexity += 1;
 		}
 	}

 	updatePatternData() {
 		// update effect dimensions w/ LCM
 		// iterate over each pattern rows and their corresponding weft systems (how to handle warp systems?) in the weftSystemRepeat array
 		var newData = [];
 		// LCM is commutative, so we can find the LCM of all of the effect's patterns by iterating thru the list
 		for (var patt in this.patterns) {
 			// this.width = lcm(this.width, patt.width);
 			// this.height = lcm(this.height, patt.height);
 		}
 		var whichPattern = 0;
 		var numRepeats = 0;
 		for (var i = 0; i < this.height; i++) {
 			// repeat the appropriate row of the right pattern until the effect row is filled
 			var rowData = [];
 			var patternForRow = this.patterns[whichPattern];
 			var pattData = patternForRow.pattern[numRepeats % patternForRow.height];
 			while (rowData.length < this.width) {
 				rowData.concat(pattData);
 			}
 			newData.push(rowData);
 			whichPattern += 1;
 			if (whichPattern == this.patterns.length) {
 				whichPattern = 0;
 				numRepeats += 1;
 			}
 		}
 	}

 	isSimple() {
 		if (this.complexity == 0) {
 			return true;
 		} else {
 			return false;
 		}
 	}
 }