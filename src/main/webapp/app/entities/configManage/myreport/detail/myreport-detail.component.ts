import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IMyreport } from '../myreport.model';

@Component({
  selector: 'jhi-myreport-detail',
  templateUrl: './myreport-detail.component.html',
})
export class MyreportDetailComponent implements OnInit {
  myreport: IMyreport | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ myreport }) => {
      this.myreport = myreport;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
