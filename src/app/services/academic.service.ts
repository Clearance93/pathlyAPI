import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
  import { AiResponse } from '../models/ai-response.model';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private http = inject(HttpClient);
  private apiUrl = 'https://pathly.azurewebsites.net/api/AI/academicRecord';

  analyzeResults(base64File: string): Observable<AiResponse> {
    return this.http.post<any>(this.apiUrl, {
      reportId: '00000000-0000-0000-0000-000000000000',
      reportExtraction: base64File,
      timeStamp: new Date().toISOString()
    }).pipe(
      map(res => {
        console.log('Raw API response:', JSON.stringify(res));

        const raw: string | undefined =
          typeof res === 'string' ? res
          : typeof res?.rawResponse === 'string' ? res.rawResponse
          : typeof res?.result === 'string' ? res.result
          : typeof res?.data === 'string' ? res.data
          : undefined;

        // Already a parsed object
        if (!raw && res?.topFiveBestCareers) return res as AiResponse;

        if (!raw) {
          console.error('Unexpected API response shape:', res);
          throw new Error('Unexpected response format from API');
        }

        const cleaned = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        const parsed = JSON.parse(cleaned);
        console.log('Parsed API response keys:', Object.keys(parsed));
        if (!parsed.topFiveAlternativeCareer && parsed.topFiveAlternativeCareers) {
          parsed.topFiveAlternativeCareer = parsed.topFiveAlternativeCareers;
        }
        if (!parsed.topFiveBestCareers && parsed.TopFiveBestCareers) {
          parsed.topFiveBestCareers = parsed.TopFiveBestCareers;
        }
        return parsed as AiResponse;
      })
    );
  }
}