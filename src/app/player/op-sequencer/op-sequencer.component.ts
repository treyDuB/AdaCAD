import { Component, OnInit, ViewChild, Input, ViewContainerRef } from '@angular/core';
import { PlayerService } from '../player.service';
import { PedalsService } from '../provider/pedals.service';
import { SequencerService } from '../provider/sequencer.service';
import { MatExpansionPanel } from '@angular/material/expansion';
import { OperationComponent } from './operation/operation.component';
import { MappingsService } from '../provider/mappings.service';
import { MenuOp } from '../model/mapping';

@Component({
  selector: 'app-op-sequencer',
  templateUrl: './op-sequencer.component.html',
  styleUrls: ['./op-sequencer.component.scss']
})
export class OpSequencerComponent implements OnInit {
  @ViewChild('opMenuS') op_menu_s: MatExpansionPanel;
  @ViewChild('opMenuT') op_menu_t: MatExpansionPanel;

  @Input() isWeaving: boolean;

  /**
   * A container that supports the automatic generation and removal of the components inside of it
   */
  @ViewChild('vc', {read: ViewContainerRef, static: true}) vc: ViewContainerRef;

  constructor(
    public pls: PlayerService,
    public pds: PedalsService,
    public seq: SequencerService,
    public map: MappingsService,
  ) { }

  ngOnInit(): void {
    // console.log(this.op_menu);
  }

  ngAfterViewInit() {
    // console.log(this.op_menu_s);
    // console.log(this.op_menu_t);
  }

  closeMenus() {
    this.op_menu_s.close();
    this.op_menu_t.close();
  }

  /**
   * creates an operation component
   * @param name the name of the operation this component will perform
   * @returns the OperationComponent created
   */
  createOperation(name: string): OperationComponent{
    const op = this.vc.createComponent<OperationComponent>(OperationComponent);
    // const id = this.tree.createNode('op', op.instance, op.hostView);

    // this.tree.loadOpData({prev_id: -1, cur_id: id}, name, undefined, undefined);
    // this.setOperationSubscriptions(op.instance);

    op.instance.name = name;
    // op.instance.id = id;
    // op.instance.zndx = this.layers.createLayer();
    // op.instance.scale = this.scale;
    // op.instance.default_cell = this.default_cell_size;

    return op.instance;
  }

  addSequencerOp(op: MenuOp) {
    // console.log(op);
    let inst = this.map.createOpInstance(op);
    // console.log(inst);
    this.seq.addSingleOp(inst);
  }

  shiftOp(i: number, dir: boolean) { 
    this.seq.shiftOp(i, dir);
  }

  removeOp(i: number) {
    this.seq.delOpAt(i);
  }

  updateParam(x:any) {
    console.log(x);
  }
}
