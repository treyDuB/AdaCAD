/**
 * Definition of render object.
 * @class
 */
export class Render {

  zoom: number;

  base_cell: {
    w: {max: number, min: number},
    h: {max: number, min: number},
    margin_fill_x: {max: number, min: number},
    margin_fill_y: {max: number, min: number},
    margin_clear_x: {max: number, min: number},
    margin_clear_y: {max: number, min: number},
  };

  select:{
    offset_x: {max: number, min: number},
    offset_y: {max: number, min: number};
  }

  constructor() {

    //max values
    this.zoom = 100;


    this.base_cell = {
    w: {max: 20, min: 2},
    h: {max: 20, min: 2},
    margin_fill_x: {max: 1, min: 0},
    margin_fill_y: {max: 1, min: 0},
    margin_clear_x: {max: 2, min: 0},
    margin_clear_y: {max: 2, min: 0},
  };

   this.select = {
    offset_x: {max: 7, min: 0},
    offset_y: {max: 7, min: 0}
   }

  }

  interpolate(base: any){
    // console.log("interp", base);
      var r1 = base.max - base.min; 
      if(r1 == 0) return 0;
      // console.log("i", r1, this.zoom/100, base.min);
      return r1 * (this.zoom/100) + base.min;


  }

  getCellDims(type: string){
    // console.log("get cell dims", type);
    var x = this.interpolate(this.getOffset(type+"_x"));
    var y = this.interpolate(this.getOffset(type+"_y"));


    return {
      x: x,
      y: y,
      w: this.interpolate({max: this.base_cell.w.max - (x*2), min: this.base_cell.w.min}),
      h: this.interpolate({max: this.base_cell.h.max - (y*2), min: this.base_cell.h.min})
    }

  }

  setZoom(z: number){
    this.zoom = z;
  }

  getZoom(){
    return this.zoom;
  }

  private getOffset(type) {
     // console.log("get offset", type);
    if(type ==="select_x") return this.select.offset_x;
    if(type ==="select_y") return this.select.offset_y;
    if(type ==="base_clear_x") return this.base_cell.margin_clear_x;
    if(type ==="base_clear_y") return this.base_cell.margin_clear_y;
    if(type ==="base_fill_x") return this.base_cell.margin_fill_x;
    if(type ==="base_fill_y") return this.base_cell.margin_fill_y;
    else return {max: 0, min: 0};
  }


}