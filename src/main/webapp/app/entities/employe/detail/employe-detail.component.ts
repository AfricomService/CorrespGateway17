import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IEmploye } from '../employe.model';

@Component({
  selector: 'jhi-employe-detail',
  templateUrl: './employe-detail.component.html',
})
export class EmployeDetailComponent implements OnInit {
  employe: IEmploye | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ employe }) => {
      this.employe = employe;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
