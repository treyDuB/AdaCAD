/****** OBJECTS/TYPES to CONTROL SELECT LISTS******/

export interface LoomTypes {
    value: string;
    viewValue: string;
  }
  
  export interface MaterialTypes {
    value: number;
    viewValue: string;
  }
  
  export interface DensityUnits {
    value: string;
    viewValue: string;
  }
  
  export interface ViewModes {
    value: string;
    viewValue: string;
  }
  
  
  /**
   * Stores the icons and language for determining different 
   * modes within which the mouse points are handled
   * @param value - reference 
   * @param viewValue - text shown to users
   * @param icon
   * @param children, menu to nest within this
   * @param selected boolean to show if it is selected
   */
  export interface DesignMode {
    value: string;
    viewValue: string;
    icon: string;
    children: Array<DesignMode>;
    selected: boolean;
  }
  