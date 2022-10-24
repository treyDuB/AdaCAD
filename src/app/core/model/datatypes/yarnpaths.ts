import { Cell } from '../cell';

/****** OBJECTS/TYPES FOR SIMULATING YARN PATHS *****/

export type YarnMap = Array<Array<Cell>>;

/**
 * a yarn cell holds a binary value representing the direction of the weft yarn through the cell. 
 * the binary is organized as NESW and has a 0 if no yarn is at that point, or 1 if there is a yarn at that point
 * for example. 0101 is a weft yarn that travels through the cell, 1100 is a weft yarn that comes in the east (right) size and curves, existing the bottom edge of teh cell
 */
export type YarnCell = number;


/**
 * Stores all the simulation information as a 2D array mapped onto the draft
 */
export type YarnSim = Array<Array<YarnCell>>;
 
 