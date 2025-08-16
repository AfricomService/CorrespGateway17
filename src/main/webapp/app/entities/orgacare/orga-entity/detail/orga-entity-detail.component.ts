import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IOrgaEntity } from '../orga-entity.model';

@Component({
  selector: 'jhi-orga-entity-detail',
  templateUrl: './orga-entity-detail.component.html',
})
export class OrgaEntityDetailComponent implements OnInit {
  orgaEntity: IOrgaEntity | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ orgaEntity }) => {
      this.orgaEntity = orgaEntity;
    });
  }

  previousState(): void {
    window.history.back();
  }
}
