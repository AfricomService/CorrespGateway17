import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as docx from 'docx-preview';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { PjService } from '../service/pj.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

type FileType = 'image' | 'pdf' | 'docx' | 'excel' | 'unsupported';

@Component({
  selector: 'app-file-preview',
  templateUrl: 'file-preview.component.html',
  standalone: true,
  imports: [PdfViewerModule, NgSwitch, NgIf, NgSwitchCase, NgSwitchDefault],
  styleUrls: ['file-preview.component.scss'],
})
export class FilePreviewComponent implements OnChanges {
  @Input() pjId!: number;
  @Input() fileName: string = 'download'; // Optional: if you have the filename beforehand

  @ViewChild('docxContainer', { static: false }) docxContainer!: ElementRef;

  isLoading = false;
  errorMsg: string | null = null;
  currentBlob: Blob | null = null;

  // State for view switching
  fileType: FileType = 'unsupported';

  // Data holders
  imageSrc: SafeUrl | null = null;
  // pdfSrc: string | ArrayBuffer | Uint8Array | null = null; // ng2-pdf-viewer supports various inputs
  pdfSrc: string | null = null;

  excelHtml: string = '';

  constructor(private pjService: PjService, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pjId'] && this.pjId) {
      this.loadFile();
    }
  }

  private loadFile(): void {
    this.isLoading = true;
    this.errorMsg = null;
    this.resetView();

    this.pjService.getFile(this.pjId).subscribe({
      next: (blob: Blob) => {
        this.currentBlob = blob;
        console.log('blob');
        console.log(blob);
        this.determineFileTypeByName(this.fileName);
        this.renderFile(blob);
        this.isLoading = false;
      },
      error: err => {
        console.error('Download failed', err);
        this.errorMsg = 'Could not load file preview.';
        this.isLoading = false;
      },
    });
  }

  private determineFileType(blob: Blob): void {
    const type = blob.type;

    if (type.includes('image')) {
      this.fileType = 'image';
    } else if (type === 'application/pdf') {
      this.fileType = 'pdf';
    } else if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || type === 'application/msword') {
      this.fileType = 'docx';
    } else if (type.includes('excel') || type.includes('spreadsheet') || type === 'text/csv') {
      this.fileType = 'excel';
    } else {
      this.fileType = 'unsupported';
    }
  }

  private determineFileTypeByName(fileName: string): void {
    if (!fileName) {
      this.fileType = 'unsupported';
      return;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();

    switch (extension) {
      // Images
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        this.fileType = 'image';
        break;

      // PDF
      case 'pdf':
        this.fileType = 'pdf';
        break;

      // Word
      case 'doc':
      case 'docx':
        this.fileType = 'docx';
        break;

      // Excel
      case 'xls':
      case 'xlsx':
      case 'csv':
        this.fileType = 'excel';
        break;

      default:
        this.fileType = 'unsupported';
        break;
    }
  }

  private renderFile(blob: Blob): void {
    switch (this.fileType) {
      case 'image':
        const objectUrl = URL.createObjectURL(blob);
        this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        break;

      case 'pdf':
        this.pdfSrc = URL.createObjectURL(blob);
        break;

      case 'docx':
        setTimeout(() => {
          if (this.docxContainer && this.docxContainer.nativeElement) {
            docx.renderAsync(blob, this.docxContainer.nativeElement).catch(err => (this.errorMsg = 'Failed to render Word document.'));
          }
        }, 0);
        break;

      case 'excel':
        this.renderExcel(blob);
        break;
    }
  }

  private renderExcel(blob: Blob): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });

      // Grab the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to HTML
      this.excelHtml = XLSX.utils.sheet_to_html(sheet, { id: 'excel-table' });
    };
    reader.readAsBinaryString(blob);
  }

  downloadFile(): void {
    if (this.currentBlob) {
      saveAs(this.currentBlob, this.fileName);
    }
  }

  private resetView(): void {
    this.imageSrc = null;
    this.pdfSrc = null;
    this.excelHtml = '';
    this.fileType = 'unsupported';
    if (this.docxContainer && this.docxContainer.nativeElement) {
      this.docxContainer.nativeElement.innerHTML = '';
    }
  }
}
