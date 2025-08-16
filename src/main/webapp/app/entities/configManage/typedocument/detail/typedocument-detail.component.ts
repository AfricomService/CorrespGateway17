import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ITypedocument } from '../typedocument.model';

@Component({
  selector: 'jhi-typedocument-detail',
  templateUrl: './typedocument-detail.component.html',
})
export class TypedocumentDetailComponent implements OnInit {
  typedocument: ITypedocument | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ typedocument }) => {
      this.typedocument = typedocument;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
