import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { SmtpConfigFormService, SmtpConfigFormGroup } from './smtp-config-form.service';
import { ISmtpConfig } from '../smtp-config.model';
import { SmtpConfigService } from '../service/smtp-config.service';

@Component({
  selector: 'jhi-smtp-config-update',
  templateUrl: './smtp-config-update.component.html',
})
export class SmtpConfigUpdateComponent implements OnInit {
  isSaving = false;
  smtpConfig: ISmtpConfig | null = null;

  editForm: SmtpConfigFormGroup = this.smtpConfigFormService.createSmtpConfigFormGroup();

  constructor(
    protected smtpConfigService: SmtpConfigService,
    protected smtpConfigFormService: SmtpConfigFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ smtpConfig }) => {
      this.smtpConfig = smtpConfig;
      if (smtpConfig) {
        this.updateForm(smtpConfig);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const smtpConfig = this.smtpConfigFormService.getSmtpConfig(this.editForm);
    if (smtpConfig.id !== null) {
      this.subscribeToSaveResponse(this.smtpConfigService.update(smtpConfig));
    } else {
      this.subscribeToSaveResponse(this.smtpConfigService.create(smtpConfig));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ISmtpConfig>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(smtpConfig: ISmtpConfig): void {
    this.smtpConfig = smtpConfig;
    this.smtpConfigFormService.resetForm(this.editForm, smtpConfig);
  }
}
