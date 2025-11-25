import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AttachmentResponse {
  blob: Blob;
  filename: string;
  contentType: string | null;
}

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  constructor(private http: HttpClient) {}

  // Call your Spring endpoint, returning the binary and headers
  getAttachmentAsBlob(pjId: number): Observable<AttachmentResponse> {
    return this.http
      .get(`/api/pjs/getFile?pjId=${pjId}`, {
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        map((res: HttpResponse<Blob>) => {
          const contentDisposition = res.headers.get('content-disposition') || '';
          const filenameMatch = /filename\*?=([^;]+)/i.exec(contentDisposition);
          let filename = 'attachment';
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/["']/g, '').trim();
          } else {
            // fallback: try to infer from URL or blob type
          }
          const contentType = res.headers.get('content-type');
          return {
            blob: res.body as Blob,
            filename,
            contentType,
          };
        })
      );
  }
}
