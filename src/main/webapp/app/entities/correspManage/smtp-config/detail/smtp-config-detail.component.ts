import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ISmtpConfig } from '../smtp-config.model';

@Component({
  selector: 'jhi-smtp-config-detail',
  templateUrl: './smtp-config-detail.component.html',
})
export class SmtpConfigDetailComponent implements OnInit {
  smtpConfig: ISmtpConfig | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ smtpConfig }) => {
      this.smtpConfig = smtpConfig;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
