import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IPersonCompany } from '../person-company.model';

@Component({
  selector: 'jhi-person-company-detail',
  templateUrl: './person-company-detail.component.html',
})
export class PersonCompanyDetailComponent implements OnInit {
  personCompany: IPersonCompany | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ personCompany }) => {
      this.personCompany = personCompany;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
