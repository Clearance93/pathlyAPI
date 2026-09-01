import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PsychometricScores } from '../models/ai-response.model';
import { environment } from '../../environments/environment';

export interface PsychometricSubmission {
  userId: string;
  ratingAnswers: Record<string, number>;
  trueFalseAnswers: Record<string, boolean>;
  multipleChoiceAnswers: Record<string, string>;
  profile: PsychometricScores;
}

export interface StoredPsychometricAssessment {
  psychometricAssessmentId: string;
  applicationUserId: string;
  profile: PsychometricScores & { psychometricProfileId?: string; createdAt?: string };
  ratingAnswers: Record<string, number>;
  trueFalseAnswers: Record<string, boolean>;
  multipleChoiceAnswers: Record<string, string>;
  totalQuestions: number;
  answeredQuestions: number;
  servedFromExisting: boolean;
  completedAt: string;
}

const BASE = `${environment.apiUrl}/Psychometric`;

@Injectable({ providedIn: 'root' })
export class PsychometricService {
  private http = inject(HttpClient);

  /** Stores the learner's answers + results against their logged-in account. */
  submitAssessment(submission: PsychometricSubmission): Observable<StoredPsychometricAssessment> {
    return this.http.post<StoredPsychometricAssessment>(`${BASE}/assessment`, submission);
  }

  /** The learner's most recent stored assessment, if any. */
  getLatestForUser(userId: string): Observable<StoredPsychometricAssessment> {
    return this.http.get<StoredPsychometricAssessment>(`${BASE}/assessment/${userId}`);
  }
}
