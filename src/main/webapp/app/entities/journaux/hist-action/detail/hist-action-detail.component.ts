import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IHistAction } from '../hist-action.model';

@Component({
  selector: 'jhi-hist-action-detail',
  templateUrl: './hist-action-detail.component.html',
})
export class HistActionDetailComponent implements OnInit {
  histAction: IHistAction | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ histAction }) => {
      this.histAction = histAction;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
