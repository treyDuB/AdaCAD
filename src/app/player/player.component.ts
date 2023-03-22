import { Component, Input, Output, OnInit, ViewChild, EventEmitter} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

import { PlayerService } from './player.service';

import { OpSequencerComponent } from './op-sequencer/op-sequencer.component';
import { WeavingStateComponent } from './weaving-state/weaving-state.component';

import { Draft } from '../core/model/datatypes';
import { wefts, warps, isUp, isSet } from '../core/model/drafts';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit {
  @ViewChild(WeavingStateComponent) weaving_state;
  @ViewChild(OpSequencerComponent) op_sequencer;

  @Input()  default_cell: number;
  @Input('draft') active_draft: Draft;

  @Output('player-open') playerOpen = new EventEmitter<boolean>();
  // @Input() 
  // get draft_set(): boolean {
  //   return (this.pls.draft !== null);
  // };

  // get pls.draft(): Draft { return this._active_draft; }
  // set pls.draft(value: Draft) {
  //   this._active_draft = value;
  // }
  // private _active_draft: Draft = null;

  open: boolean = true;
  ownContainer: HTMLElement;
  mixerContainer: HTMLElement;
  
  constructor(
    public pls: PlayerService,
    public icons: MatIconRegistry,
    private sanitizer: DomSanitizer
  ) { 
    // register all the SVG icons
    // icon registry has property _svgIconConfigs with :icon-name as keys
    for (let op of pls.ops) {
      // console.log(op.name);
      icons.addSvgIcon('op-'+op.name, sanitizer.bypassSecurityTrustResourceUrl('assets/op_icons/'+op.name.replaceAll(" ", "-") + ".svg"));
    }

    icons.addSvgIcon('op-chain', sanitizer.bypassSecurityTrustResourceUrl('assets/op_icons/chain.svg'));
    icons.addSvgIcon('op-custom', sanitizer.bypassSecurityTrustResourceUrl('assets/op_icons/custom.svg'));
    
    console.log(icons);
  }

  ngOnInit(): void {
    // console.log("ng on init, pedals: ", this.pls.pedals);
    /** FOR TESTING ONLY: generate random draft and set it at start-up */
  }

  ngAfterViewInit() {
    // console.log("ng after view init, pedals: ", this.pls.pedals);
    // const startPattern = this.oss.getOp('tabby');
    // startPattern.perform([]).then((result) => {
    //   this.pls.setDraft(result[0]);
    //   this.drawDraft();
    // });
    this.ownContainer = document.querySelector("#player-container > .mat-expansion-panel");
    this.mixerContainer = document.querySelector('app-mixer > mat-drawer-container');
    // console.log("init w/ element refs ", this.ownContainer, this.mixerContainer);
    // this.draftCanvas = <HTMLCanvasElement> document.getElementById('active-draft-canvas');
    // this.cx = this.draftCanvas.getContext("2d");
    // this.drawDraft(); //force call here because it likely didn't render previously. 

    // let expansionPanel = document.querySelector('mat-expansion-panel');
    // expansionPanel.close();

    this.open = false;
    // this.resizeContainer();
    this.drawPlayback();

    this.pls.redraw.on('redraw', () => {
      console.log("redrawing ", this.pls.state);
      // this.drawDraft();
      // this.resizeContainer();
    });

    window.addEventListener('keydown', function(e) {
      if(e.key == ' ' && e.target == document.body) {
        e.preventDefault();
        console.log("no scrolling!");
      }
    });
  }

  resizeContainer() {
    console.log("resizing");
    let t = document.querySelector("app-topbar").getBoundingClientRect().height;
    if (this.open) {
      this.mixerContainer.style.height = '0px';
      this.ownContainer.style.height = 'calc(100vh - ' + t.toString() + 'px)';
      this.ownContainer.style.overflow = "scroll";
    } else {
      let h = document.querySelector("mat-expansion-panel-header").getBoundingClientRect().height;
      this.mixerContainer.style.height = 'calc(100vh - '+ (h+t).toString() + 'px)';
      this.ownContainer.style.overflow = "unset";
    }
  }

  drawPlayback() { this.weaving_state.drawPlayback(); }

  toggleOpen(state: boolean) {
    console.log("toggling");
    this.open = state;
    // this.resizeContainer();
    this.playerOpen.emit(this.open);
  }

  toggleWeaving(state: boolean) {
    console.log("weaving state toggle ", state);
    if (state) {
      this.op_sequencer.closeMenus();
    }
  }
}
  
