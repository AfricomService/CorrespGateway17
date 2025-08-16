import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IPj } from '../pj.model';

@Component({
  selector: 'jhi-pj-detail',
  templateUrl: './pj-detail.component.html',
})
export class PjDetailComponent implements OnInit {
  pj: IPj | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ pj }) => {
      this.pj = pj;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
