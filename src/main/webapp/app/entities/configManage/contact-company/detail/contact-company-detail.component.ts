import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IContactCompany } from '../contact-company.model';

@Component({
  selector: 'jhi-contact-company-detail',
  templateUrl: './contact-company-detail.component.html',
})
export class ContactCompanyDetailComponent implements OnInit {
  contactCompany: IContactCompany | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ contactCompany }) => {
      this.contactCompany = contactCompany;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
