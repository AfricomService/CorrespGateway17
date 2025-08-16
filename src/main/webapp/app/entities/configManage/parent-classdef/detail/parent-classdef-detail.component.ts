import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IParentClassdef } from '../parent-classdef.model';

@Component({
  selector: 'jhi-parent-classdef-detail',
  templateUrl: './parent-classdef-detail.component.html',
})
export class ParentClassdefDetailComponent implements OnInit {
  parentClassdef: IParentClassdef | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ parentClassdef }) => {
      this.parentClassdef = parentClassdef;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
