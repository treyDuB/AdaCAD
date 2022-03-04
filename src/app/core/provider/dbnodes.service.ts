import { Injectable } from '@angular/core';
import { getDatabase, child, ref, set, get, query, onValue, DatabaseReference, onChildAdded, onChildChanged, onChildRemoved} from "firebase/database";
import { Database } from '@angular/fire/database';
import { EventEmitter } from 'events';

interface NodeParams {
  db?: Database,
  name?: string,
  root?: string,
  path?: string,
  key?: string,
  initVal?: any,
  ref?: DatabaseReference
}

class DBNode extends EventEmitter {
  _name: string;
  _dbref: DatabaseReference;
  _val: any;
  _active: boolean;

  /**
   * 
   * @param {*} params \{ db: Database, path: string, initVal: any }
   * @param {*} params \{ ref: DatabaseReference, key: string, initVal: any }
   */

  constructor(params: NodeParams) {
    super();
    if (params.db) {
      this._name = params.path;
      this._dbref = ref(params.db, params.root + params.path);
      this._val = params.initVal;
      // console.log(this);
    } else if (params.ref) {
      console.log(params.key);
      this._name = params.key;
      this._dbref = params.ref;
    }
    this._active = false;
  }

  get ref() {
    return this._dbref;
  }

  get name() {
    return this._name;
  }

  get val() {
    if (typeof(this._val) == 'number' || typeof(this._val == 'boolean')) {
      return this._val;
    } else if (this._val != undefined) {
      return Object.keys(this._val);
    }
  }

  set val(x) {
    this._val = x;
  }

  get active() {
    return this._active;
  }

  set active(tf: boolean) {
    this._active = tf;
  }

  // methods for a node: 
  // attach() means it is updating with the database
  // detach() means it is not updating
}

export class DBListener extends DBNode {
  _name: string;
  _dbref: DatabaseReference;
  _val: any;
  _active: boolean;

  constructor(params: NodeParams) {
    super(params);
  }

  attach() {
    var detachDB = onValue(this.ref, (snapshot) => {
      this.val = snapshot.val();
      this.emit('change', this.val);
    });

    Object.defineProperty(this, 'detach', {value: () => {
      detachDB();
      this.active = false;
    }});
    this.active = true;
  }

  getNow() {
    get(query(this.ref))
      .then((snapshot) => {
        this.val = snapshot.val();
      })
      .catch(result => console.log(result));
  }

  detach() {}
}

export class DBWriter extends DBNode {
  _name: string;
  _ref: DatabaseReference;
  _val: any;
  // setVal: Function;

  constructor(params: NodeParams) {
    super(params);
  }

  attach() {
    // if (!this.active) {
    //   const setVal = (x: any) => {
        
    //   }

    //   const detach = () => {
    //     if (this.active) {
    //       delete this.setVal;
    //       Object.defineProperty(this, 'setVal', {value: () => { return; }});
    //       this.active = false;
    //     }
    //   }
    //   Object.defineProperty(this, 'setVal', { value: setVal });
    //   Object.defineProperty(this, 'detach', { value: detach });
      this.active = true;
    // }
  }

  setVal(x) {
    if (this.active) {
      this.val = x;
      set(this.ref, this.val);
    }
  }

  detach() {
    this.active = false;
  }
}

export class DBListenerArray extends EventEmitter {
  lengthNode: DBListener;
  parentNode: DBListener;
  nodes: Array<DBListener>;

  constructor(lengthNode: DBListener, parentNode: DBListener) {
    super();
    this.lengthNode = lengthNode;
    this.parentNode = parentNode;
    this.nodes = [];

    onChildAdded(this.parentNode.ref, (snapshot) => {
      // console.log("child added", snapshot);
      this.addNode(snapshot.key);
    })

    onChildChanged(this.parentNode.ref, (snapshot) => {
      console.log("child changed", snapshot);
    })

    onChildRemoved(this.parentNode.ref, (snapshot) => {
      // console.log("child removed", snapshot);
      this.remNode();
    })

    // this.lengthNode.on('change', (n) => {
    //   console.log("length node changed", n);
    //   // console.log(this.parentNode);
    //   this.parentNode.once('change', (val) => {
    //     console.log("parent node changed", val);
    //     console.log(this.parentNode.val);
    //     this.updateArray(n);
    //   })
    // });
  }

  get length() {
    return this.nodes.length;
  }

  nodeAt(n) {
    // console.log(this.nodes);
    // console.log("node at ", n);
    // console.log(this.nodes[n]);
    return this.nodes[n];
  }

  pushNode(n) {
    this.nodes.push(n);
  }

  popNode() {
    return this.nodes.pop();
  }

  addNode(key: string) {
    console.log('child key', key);
    const childRef = child(this.parentNode.ref, key);
    const childNode = new DBListener({ ref: childRef, key: key });
    childNode.attach();
    this.pushNode(childNode);
    // this.lengthNode.setVal(this.length);
  }

  remNode() {
    const node = this.popNode();
    // remove(node.ref);
    // this.lengthNode.setVal(this.length);
  }

  updateArray(num) {
    // this.parentNode.getNow();
    if (num > this.length) {
      let parentKeys = this.parentNode.val;
      // console.log(this.parentNode);
      console.log(parentKeys);
      let childKeys = Object.keys(parentKeys);
      while (this.length < num) {
        this.addNode(childKeys[this.length]);
      }
    } else if (num < this.length) {
      while (this.length > num) {
        this.remNode();
      }
    }

    console.log(this);
  }

  toString() {
    var str = "";
    // str += "length: " + this.length + ", ";
    str += "[ \n";
    for (var i=0; i < this.nodes.length; i++) {    
      // str += "\t" + this.nodes[i].name + ": "; 
      str += this.nodes[i].val;
      if (i < this.nodes.length-1) {
        str += ",";
      }
      str += " \n";
    } 
    str += " ]";
    return str;
  }

  // setNode(i, x) {
  //   this.nodes[i].setVal(x);
  // }
}

export class OnlineStatus extends DBListener {
  _name: string;
  _ref: DatabaseReference;
  _val: boolean;

  constructor(params) {
    super(params);
    var start = get(query(this.ref))
      .then((snapshot) => {
        this.val = snapshot.val();
      })
      .catch(result => console.log(result));

    this.attach();
  }

  checkAlive() {
    set(this.ref, false)
      .then(() => { this.emit('set', true); })
      .catch(() => { this.emit('set', false); });
  }
}


@Injectable({
  providedIn: 'root'
})
export class DbNodesService {

  constructor() { }
}
