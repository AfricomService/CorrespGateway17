import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IHistConsult } from '../hist-consult.model';

@Component({
  selector: 'jhi-hist-consult-detail',
  templateUrl: './hist-consult-detail.component.html',
})
export class HistConsultDetailComponent implements OnInit {
  histConsult: IHistConsult | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ histConsult }) => {
      this.histConsult = histConsult;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
