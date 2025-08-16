import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IBordereaux } from '../bordereaux.model';

@Component({
  selector: 'jhi-bordereaux-detail',
  templateUrl: './bordereaux-detail.component.html',
})
export class BordereauxDetailComponent implements OnInit {
  bordereaux: IBordereaux | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ bordereaux }) => {
      this.bordereaux = bordereaux;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
