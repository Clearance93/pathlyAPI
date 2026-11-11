import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { AssessmentService, AssessmentDraft } from './assessment.service';
import { AuthService } from '../services/auth.service';
import { PsychometricService } from '../services/psychometric.service';

describe('AssessmentService drafts', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUserId: () => 'learner-1' } },
        { provide: PsychometricService, useValue: {} },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  it('saves and restores a draft for the active learner', () => {
    const service = TestBed.inject(AssessmentService);
    const draft: AssessmentDraft = {
      phase: 'truefalse',
      ratingGroup: 5,
      tfGroup: 1,
      ratingAnswers: { 1: 4 },
      tfAnswers: { 101: false },
      mcAnswers: {},
    };

    service.saveDraft(draft);

    expect(service.getDraft()).toEqual(draft);
  });

  it('removes a draft when the assessment is completed or reset', () => {
    const service = TestBed.inject(AssessmentService);
    service.saveDraft({
      phase: 'rating', ratingGroup: 0, tfGroup: 0,
      ratingAnswers: {}, tfAnswers: {}, mcAnswers: {},
    });

    service.clearDraft();

    expect(service.getDraft()).toBeNull();
  });
});
