import { Component, OnInit, Inject, ElementRef, ViewChild, HostListener } from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

import { Observable, Subscription, fromEvent, from } from 'rxjs';
// import * as d3 from "d3";

import { Draft } from '../../../core/model/draft';
import { Shuttle } from '../../../core/model/shuttle';
import { Shape } from '../../../core/model/shape';
//import { Pattern } from '../../../core/model/pattern'; // potentially save shape as a pattern?

@Component({
  selector: 'app-shape-modal',
  templateUrl: './shape.modal.html',
  styleUrls: ['./shape.modal.scss']
})
export class ShapeModal implements OnInit {
  draft: Draft;
  shapes: Array<Shape>;
  shape: Shape;
  shuttles: Array<Shuttle>;

  @ViewChild('viewShape') viewShape: ElementRef;

  view = false;
  editing = false;

  /**
   * Subscribes to move event after a touch event is started.
   * @property {Subscription}
   */
  subscription: Subscription;

  /**
   * The HTML SVG element used to show the shape.
   * @property {HTMLElement}
   */
  svgEl: HTMLElement;

  currentPos: any;

  constructor(
    private dialogRef: MatDialogRef<ShapeModal>,
      @Inject(MAT_DIALOG_DATA) public data: any) { 
  
  	this.draft = data.draft;
  	this.shapes = data.shapes;
    this.shape = data.shape;
  	this.shuttles = data.shuttles;

    this.currentPos = new Object();
    this.currentPos.draftRow = 0;
    this.currentPos.shapeRow = 0;
    this.currentPos.x = 0;
    this.currentPos.editBound = 0;
  }

  ngOnInit() {
    this.svgEl = this.viewShape.nativeElement; // SVG element
    if (this.shape.shuttles) {
      for (var i = 0; i < this.shape.shuttles.length; i++) {
        this.draft.shuttleToShape(this.shape.shuttles[i], this.shape);
      }
    }
  }

  shuttleInShape(id: number) {
    return this.draft.shuttleInShape(id, this.shape);
  }

  // given a row of the draft, gives the index of that row in shape
  // example: if Row 5 of draft is the 1st row of the shape, then getShapeRow(5) will return 0;
  getShapeRow(i: number) {
    for (var j = 0; j < this.shape.bounds.length; j++) {
      if (this.shape.bounds[j][0] == i) {
        return j;
      }
    }
    return null; // row is not in the shape
  }

  shuttleToShape(id: number) {
    if (this.shuttleInShape(id)) {
      console.log("Shuttle already added, updated")
    } else {
      console.log("Shuttle " + id + " added to Shape " + this.shape.id);
      this.draft.shuttleToShape(this.shuttles[id], this.shape);
    }
  }

  visualize() {
    var debug = true;

    if (debug) {
      var print = this.shape.printBounds();
      console.log(print);
    } else {
      
    }
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.draft.shapeToDraft(this.shape);
    this.dialogRef.close(this.shape);
  }

  /**
   * Remove the subscription from the move event.
   * @extends ShapeModal
   * @returns {void}
   */
  private removeSubscription() {    
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnDestroy() {
     this.removeSubscription();
   }

  /// EVENTS (to edit shape)
  /**
   * reference weave.directive.ts - how it manipulates canvas
   * reference code from http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/ also handled touch (touchscreen) events but I'm not worrying about that right now
   *
   */

  @HostListener('mousedown', ['$event'])
  private startDrag(event) {
    console.log(this.shape.bounds);
    // We only care when the event happens in the SVG visualization.
    if (event.target.classList.contains('bound-block')) {
      // avoid mem leaks 
      this.removeSubscription();    
      // set up subscription for move event
      this.subscription = 
        fromEvent(event.target.parentElement, 'mousemove').subscribe(e => this.onMove(e));   
    
      // set up the rectangle and position to be used.
      this.currentPos.draftRow = Math.floor((event.offsetY) / 20); // row being edited
      this.currentPos.shapeRow = this.getShapeRow(this.currentPos.draftRow);
      this.currentPos.x = Math.floor((event.offsetX) / 20) * 20;
      this.currentPos.editBound = (event.target.classList.contains('start') ? 1 : 2);

      console.log("starting x = " + this.currentPos.x / 20);
    }
  }

  private onMove(event) {
      // track where the square is being moved to
      // console.log("dragging row bound");
      var shapeRow = this.currentPos.shapeRow;
      if (event.movementX > 0) {
        this.currentPos.x = event.offsetX; 
      } else if (event.movementX < 0) {
        this.currentPos.x = event.offsetX - 3;
      }
      
      var editBound = this.currentPos.editBound;
      console.log(event.movementX);
      console.log("moved to x = " + this.currentPos.x / 20);
      this.shape.bounds[shapeRow][editBound] = Math.floor(this.currentPos.x / 20);
  }

  /**
   * Event removes subscription when touch has ended.
   * @extends ShapeModal
   * @param {Event} event - The mouseleave or mouseup event.
   * @returns {void}
   */
  @HostListener('mouseleave', ['$event'])
  @HostListener('mouseup', ['$event'])
  private endDrag(evt) {
    this.removeSubscription();
  }
}