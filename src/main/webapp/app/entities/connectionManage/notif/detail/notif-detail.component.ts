import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { INotif } from '../notif.model';
import { DataUtils } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-notif-detail',
  templateUrl: './notif-detail.component.html',
})
export class NotifDetailComponent implements OnInit {
  notif: INotif | null = null;

  constructor(protected dataUtils: DataUtils, protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ notif }) => {
      this.notif = notif;
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
