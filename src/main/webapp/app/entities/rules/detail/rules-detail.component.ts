import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IRules } from '../rules.model';
import { DataUtils } from 'app/core/util/data-util.service';

@Component({
  selector: 'jhi-rules-detail',
  templateUrl: './rules-detail.component.html',
})
export class RulesDetailComponent implements OnInit {
  rules: IRules | null = null;

  constructor(protected dataUtils: DataUtils, protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ rules }) => {
      this.rules = rules;
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
