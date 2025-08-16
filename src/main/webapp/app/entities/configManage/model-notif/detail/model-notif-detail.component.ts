import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IModelNotif } from '../model-notif.model';
import { DataUtils } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-model-notif-detail',
  templateUrl: './model-notif-detail.component.html',
})
export class ModelNotifDetailComponent implements OnInit {
  modelNotif: IModelNotif | null = null;

  constructor(protected dataUtils: DataUtils, protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ modelNotif }) => {
      this.modelNotif = modelNotif;
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  previousState(): void {
    window.history.back();
  }
}
