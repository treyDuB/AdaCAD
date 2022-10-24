import utilInstance from "./util";

/**
 * Definition of System object.
* a system describes a structural relationship between rows and wefts. Used in overshot, mutipic structures, or adding conductive rows
 * @class
 */
export class System {
  id: number;
  name: string;
  notes: string;
  visible: boolean;
  in_use: boolean;

  constructor(systemDict = null) {

    //defaults
    this.id = 0;
    this.name = "weft system"
    this.notes = "";
    this.visible = true;
    this.in_use = false;

    if (systemDict) this.updateVariables(systemDict);
  }

  updateVariables({id, name, notes, visible}) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.visible = visible;
  }

  setID(id: number) {
    this.id = id;
    if (!this.name) {
      this.name = 'System ' + (id + 1);
    }
  }

  isVisible(){
    return this.visible;
  }

  setVisible(bool: boolean) {
    this.visible = bool;
  }

  getChar(){
    return String.fromCharCode(97 + this.id)
  }

}

/**
   * takes system maps and makes them all unique by adding a base value to the n+1th map. This helps when interlacing 
   * drafts that have different system mappings, and making sure they are each unique. 
   * This function will also return standard sized arrays = to the maximum sized input
   * @param systems the system mappings to compare
   */
export function makeSystemsUnique(systems: Array<Array<number>>) : Array<Array<number>> {

  if (systems.length === 0) return [];


  const max_in_systems: Array<number> = systems.map(el => utilInstance.getArrayMax(el));
 
  let last_max = 0;
  const unique_systems = systems.map((sys, ndx) => {
    if(ndx > 0){
      last_max += (max_in_systems[ndx -1]+1)
      return sys.map(el => el + last_max);
    }else{
      return sys;
    }
  });  

   //standardize teh lengths of all the returned arrays 
   const max_length:number = unique_systems.reduce((acc, el) => {
    const len = el.length;
    if(len > acc) return len;
    else return acc;
  }, 0);

  unique_systems.forEach((sys, ndx) => {
    if(sys.length < max_length){
      for(let i = sys.length; i < max_length; i++){
        sys.push(sys[0]);
      }
    }
  });

  return unique_systems;
}