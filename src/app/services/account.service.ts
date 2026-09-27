import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** POPIA data-subject rights: export everything held about the account, or delete it. */
@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Account`;

  exportData(): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/data-export`);
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.base);
  }
}
