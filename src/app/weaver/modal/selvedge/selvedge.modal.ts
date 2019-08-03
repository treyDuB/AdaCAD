import { Component, OnInit, Inject } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

import { Draft } from '../../../core/model/draft';
//import { Pattern } from '../../../core/model/pattern'; // potentially save selvedge as a pattern?

@Component({
  selector: 'app-selvedge-modal',
  templateUrl: './selvedge.modal.html',
  styleUrls: ['./selvedge.modal.scss']
})
export class SelvedgeModal implements OnInit {
  draft: Draft;
  L: Array<boolean>;
  R: Array<boolean>;

  constructor(
	  private dialogRef: MatDialogRef<SelvedgeModal>,
      @Inject(MAT_DIALOG_DATA) public data: any) { 
  
  	this.draft = data.draft;
  	this.L = data.L;
  	this.R = data.R;
  }

  ngOnInit() {
  }

  close() {
    this.dialogRef.close(this.draft);
  }

  save() {
    this.dialogRef.close(this.draft);
  }

  addSelvedge() {
    this.draft.addSelvedge();
  }

  removeSelvedge() {
    this.draft.removeSelvedge();
  }

  replaceSelvedge() {
    this.draft.replaceSelvedge();
  }
}