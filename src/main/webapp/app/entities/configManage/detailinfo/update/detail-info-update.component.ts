import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { DetailInfoFormService, DetailInfoFormGroup } from './detail-info-form.service';
import { IDetailInfo } from '../detail-info.model';
import { DetailInfoService } from '../service/detail-info.service';

const OPTIONS_INPUT_TYPES = ['RADIO_BUTTON', 'SELECT', 'CHECKBOX'];

@Component({
  selector: 'jhi-detail-info-update',
  templateUrl: './detail-info-update.component.html',
})
export class DetailInfoUpdateComponent implements OnInit {
  isSaving = false;
  detailInfo: IDetailInfo | null = null;

  // Gestion locale des options pour les types RADIO_BUTTON / SELECT / CHECKBOX
  choiceOptions: { value: number; label: string }[] = [];

  editForm: DetailInfoFormGroup = this.detailInfoFormService.createDetailInfoFormGroup();

  constructor(
    protected detailInfoService: DetailInfoService,
    protected detailInfoFormService: DetailInfoFormService,
    protected activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ detailInfo }) => {
      this.detailInfo = detailInfo;
      if (detailInfo) {
        this.updateForm(detailInfo);
        this.loadChoiceOptions(detailInfo.multipleChoiceOption);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  needsOptionsList(inputType: string | null | undefined): boolean {
    return !!inputType && OPTIONS_INPUT_TYPES.includes(inputType);
  }

  addChoiceOption(): void {
    this.choiceOptions.push({ value: this.choiceOptions.length + 1, label: '' });
  }

  removeChoiceOption(index: number): void {
    this.choiceOptions.splice(index, 1);
    this.renumberChoiceOptions();
  }

  protected renumberChoiceOptions(): void {
    this.choiceOptions.forEach((opt, i) => (opt.value = i + 1));
  }

  save(): void {
    this.isSaving = true;
    this.syncChoiceOptionsToForm();
    const detailInfo = this.detailInfoFormService.getDetailInfo(this.editForm);
    if (detailInfo.id !== null) {
      this.subscribeToSaveResponse(this.detailInfoService.update(detailInfo as IDetailInfo));
    } else {
      this.subscribeToSaveResponse(this.detailInfoService.create(detailInfo));
    }
  }

  protected syncChoiceOptionsToForm(): void {
    const inputType = this.editForm.get('inputType')?.value;
    if (this.needsOptionsList(inputType)) {
      const cleanOptions = this.choiceOptions
        .filter(opt => opt.label.trim() !== '')
        .map((opt, i) => ({ value: String(i + 1), label: opt.label.trim() }));
      this.editForm.patchValue({ multipleChoiceOption: cleanOptions });
    } else {
      this.editForm.patchValue({ multipleChoiceOption: null });
    }
  }

  protected loadChoiceOptions(options: Record<string, string>[] | null | undefined): void {
    if (options && options.length > 0) {
      this.choiceOptions = options.map((opt, i) => ({ value: Number(opt['value'] ?? i + 1), label: opt['label'] ?? '' }));
    } else {
      this.choiceOptions = [];
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IDetailInfo>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {}

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(detailInfo: IDetailInfo): void {
    this.detailInfo = detailInfo;
    this.detailInfoFormService.resetForm(this.editForm, detailInfo);
  }
}
