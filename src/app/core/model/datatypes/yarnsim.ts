/****** OBJECTS/TYPES to CONTROL YARN SIMULATION ******/


/**
 * Used to draw on screen paths, refers to x, y coordiantes relative to the draft simulation
 * Used only in yarn sim
 * @param x - x position rendered as a % of the total width
 * @param y - y position
 */
export interface Vertex {
  x_pcent: number;
  y: number;
}

/**
 * Used to draw on screen paths, refers to x, y coordiantes relative to the draft simulation
 * Used only in yarn sim
 * @param draft_ndx - the row id within the draft of this yarn
 * @param material_id the material id at this row
 * @param verticies - list of points that form this path
 */
export interface YarnPath {
	draft_ndx: number;
  material_id: number;
  verticies: Array<Vertex>;
}

/**
 * describes the relationship between weft rows along the same warp
 */
export type crossType = 
 	{t:boolean, b:boolean} |
  {t:null, b:null} | //"FLOAT",
  {t:null, b:true} | //"UNSET_UNDER"
  {t:null, b:false} | //"UNSET_OVER"
  {t:true, b:null} | //"UNDER_UNSET"
  {t:false, b:null} | //"OVER_UNSET"
  {t:false, b:true} | //"OVER_UNDER",
  {t:true, b:false}; //"UNDER_OVER", 


/**
 * A yarn cross describes the relationship betwen two draft cells
 * read from top to bottom. This is used within the sparce 
 * draft representation, stores only "warp" crossings
 */
export interface Crossing {
  j: number, 
  type: crossType;
}