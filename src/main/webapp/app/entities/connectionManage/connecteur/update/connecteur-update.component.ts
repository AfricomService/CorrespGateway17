import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { ConnecteurFormService, ConnecteurFormGroup } from './connecteur-form.service';
import { IConnecteur } from '../connecteur.model';
import { ConnecteurService } from '../service/connecteur.service';

@Component({
  selector: 'jhi-connecteur-update',
  templateUrl: './connecteur-update.component.html',
})
export class ConnecteurUpdateComponent implements OnInit {
  isSaving = false;
  connecteur: IConnecteur | null = null;

  editForm: ConnecteurFormGroup = this.connecteurFormService.createConnecteurFormGroup();

  constructor(
    protected connecteurService: ConnecteurService,
    protected connecteurFormService: ConnecteurFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ connecteur }) => {
      this.connecteur = connecteur;
      if (connecteur) {
        this.updateForm(connecteur);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const connecteur = this.connecteurFormService.getConnecteur(this.editForm);
    if (connecteur.id !== null) {
      this.subscribeToSaveResponse(this.connecteurService.update(connecteur));
    } else {
      this.subscribeToSaveResponse(this.connecteurService.create(connecteur));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IConnecteur>>): void {
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

  protected updateForm(connecteur: IConnecteur): void {
    this.connecteur = connecteur;
    this.connecteurFormService.resetForm(this.editForm, connecteur);
  }
}
