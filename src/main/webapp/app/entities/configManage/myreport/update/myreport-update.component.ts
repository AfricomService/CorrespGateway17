import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { MyreportFormService, MyreportFormGroup } from './myreport-form.service';
import { IMyreport } from '../myreport.model';
import { MyreportService } from '../service/myreport.service';
import { IConfigexport } from 'app/entities/configManage/configexport/configexport.model';
import { ConfigexportService } from 'app/entities/configManage/configexport/service/configexport.service';

@Component({
  selector: 'jhi-myreport-update',
  templateUrl: './myreport-update.component.html',
})
export class MyreportUpdateComponent implements OnInit {
  isSaving = false;
  myreport: IMyreport | null = null;

  configexportsSharedCollection: IConfigexport[] = [];

  editForm: MyreportFormGroup = this.myreportFormService.createMyreportFormGroup();

  constructor(
    protected myreportService: MyreportService,
    protected myreportFormService: MyreportFormService,
    protected configexportService: ConfigexportService,
    protected activatedRoute: ActivatedRoute
  ) {}

  compareConfigexport = (o1: IConfigexport | null, o2: IConfigexport | null): boolean =>
    this.configexportService.compareConfigexport(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ myreport }) => {
      this.myreport = myreport;
      if (myreport) {
        this.updateForm(myreport);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const myreport = this.myreportFormService.getMyreport(this.editForm);
    if (myreport.id !== null) {
      this.subscribeToSaveResponse(this.myreportService.update(myreport));
    } else {
      this.subscribeToSaveResponse(this.myreportService.create(myreport));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IMyreport>>): void {
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

  protected updateForm(myreport: IMyreport): void {
    this.myreport = myreport;
    this.myreportFormService.resetForm(this.editForm, myreport);

    this.configexportsSharedCollection = this.configexportService.addConfigexportToCollectionIfMissing<IConfigexport>(
      this.configexportsSharedCollection,
      myreport.configexport
    );
  }

  protected loadRelationshipsOptions(): void {
    this.configexportService
      .query()
      .pipe(map((res: HttpResponse<IConfigexport[]>) => res.body ?? []))
      .pipe(
        map((configexports: IConfigexport[]) =>
          this.configexportService.addConfigexportToCollectionIfMissing<IConfigexport>(configexports, this.myreport?.configexport)
        )
      )
      .subscribe((configexports: IConfigexport[]) => (this.configexportsSharedCollection = configexports));
  }
}
