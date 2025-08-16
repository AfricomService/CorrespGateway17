import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { INumsequentielle } from '../numsequentielle.model';

@Component({
  selector: 'jhi-numsequentielle-detail',
  templateUrl: './numsequentielle-detail.component.html',
})
export class NumsequentielleDetailComponent implements OnInit {
  numsequentielle: INumsequentielle | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ numsequentielle }) => {
      this.numsequentielle = numsequentielle;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
