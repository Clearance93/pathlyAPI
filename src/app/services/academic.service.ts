import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AiResponse, AcademicPrediction, AnalysisHistoryResponse, Progression, PsychometricScores } from '../models/ai-response.model';
import { environment } from '../../environments/environment';

/** South African NSC achievement level, converted to APS points (levels 1–7). */
export function apsPointsForMark(mark: number): number {
  if (!Number.isFinite(mark)) return 0;
  if (mark >= 80) return 7;
  if (mark >= 70) return 6;
  if (mark >= 60) return 5;
  if (mark >= 50) return 4;
  if (mark >= 40) return 3;
  if (mark >= 30) return 2;
  return 1;
}

export function calculateApsFromMarks(marks: number[]): number {
  return marks.reduce((total, mark) => total + apsPointsForMark(mark), 0);
}

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/AcademicAnalysis`;

  analyzeResults(base64File: string, mimeType: string, fileName?: string): Observable<AiResponse> {
    return this.http.post<any>(`${this.base}/analysis`, { base64File, mimeType, fileName }).pipe(
      map(res => this.mapResponse(res))
    );
  }

  analyzePsychometric(extractionAcademicRecordId: string, psychometric: PsychometricScores, userId?: string): Observable<AiResponse> {
    return this.http.post<any>(`${this.base}/psychometric-analysis`, {
      extractionAcademicRecordId,
      psychometric,
      userId
    }).pipe(map(res => this.mapResponse(res)));
  }

  /** Runs the combined academic + psychometric analysis from the account's own stored data. */
  analyzeCombined(): Observable<AiResponse> {
    return this.http.post<any>(`${this.base}/combined-analysis`, {}).pipe(
      map(res => this.mapResponse(res))
    );
  }

  /** The signed-in learner's stored analysis history (newest first) plus an APS trend. */
  getHistory(): Observable<AnalysisHistoryResponse> {
    return this.http.get<AnalysisHistoryResponse>(`${this.base}/history`);
  }

  /** A single stored report by id — only returns it if it belongs to the caller. */
  getResult(aiResponseId: string): Observable<AiResponse> {
    return this.http.get<any>(`${this.base}/${aiResponseId}`).pipe(
      map(res => this.mapResponse(res))
    );
  }

  private mapResponse(res: any): AiResponse {
    return {
      ...this.mapCoreInfo(res),
      ...this.mapAcademicSummary(res),
      ...this.mapCareerMatches(res),
      ...this.mapDemandAnalysis(res),
      ...this.mapOutlook(res),
      subjectResults: this.mapSubjectResults(res),
      apsAnalysis: this.mapApsAnalysis(res),
    } as AiResponse;
  }

  private mapCoreInfo(res: any) {
    return {
      aiResponseId: res.aiResponseId,
      extractionAcademicRecordId: res.extractionAcademicRecordId ?? null,
      driverTermLabel: res.driverTermLabel ?? res.DriverTermLabel ?? null,
      isPremium: res.isPremium ?? res.IsPremium ?? false,
      generatedAt: res.generatedAt ?? res.GeneratedAt ?? null,
      needsManualReview: res.needsManualReview ?? res.NeedsManualReview ?? false,
      extractionWarnings: res.extractionWarnings ?? res.ExtractionWarnings ?? [],
      academicPrediction: this.mapAcademicPrediction(res.academicPrediction ?? res.AcademicPrediction),
      progression: this.mapProgression(res.progression ?? res.Progression),
      psychometricIncluded: res.psychometricIncluded ?? res.PsychometricIncluded ?? false,
      userFullName: res.userFullName,
      grade: res.grade,
      summary: res.summary,
      overallScore: res.overallScore,
      academicPersonality: res.academicPersonality,
      personalityDescription: res.personalityDescription,
      feedBack: res.feedBack,
      userStrength: Array.isArray(res.userStrength) ? res.userStrength.join(', ') : res.userStrength,
      userWeaknesses: Array.isArray(res.userWeaknesses) ? res.userWeaknesses.join(', ') : res.userWeaknesses,
      motivationalMessage: res.motivationalMessage,
      salaryRange: res.salaryRange,
      riskAssessment: res.riskAssessment,
    };
  }

  private mapAcademicPrediction(prediction: any): AcademicPrediction | null {
    if (!prediction || prediction.isPredictionAvailable === false) return null;

    return {
      isPredictionAvailable: prediction.isPredictionAvailable ?? false,
      nextTermOrdinal: prediction.nextTermOrdinal ?? null,
      nextTermLabel: prediction.nextTermLabel ?? null,
      subjectPredictions: (prediction.subjectPredictions ?? []).map((p: any) => ({
        subjectName: p.subjectName ?? p.SubjectName ?? '',
        latestMark: p.latestMark ?? 0,
        projectedLow: p.projectedLow ?? 0,
        projectedHigh: p.projectedHigh ?? 0,
        direction: p.direction ?? 'steady',
        lowConfidence: p.lowConfidence ?? false,
      })),
      atRiskSubjects: prediction.atRiskSubjects ?? [],
      caveat: prediction.caveat ?? null,
    };
  }

  private mapProgression(progression: any): Progression | null {
    if (!progression) return null;

    return {
      isAvailable: progression.isAvailable ?? false,
      uploadCount: progression.uploadCount ?? 0,
      periodCount: progression.periodCount ?? 0,
      periodLabels: progression.periodLabels ?? [],
      firstAps: progression.firstAps ?? null,
      latestAps: progression.latestAps ?? null,
      apsChange: progression.apsChange ?? null,
      summary: progression.summary ?? '',
      subjectTrends: (progression.subjectTrends ?? []).map((t: any) => ({
        subjectName: t.subjectName ?? '',
        canonicalName: t.canonicalName ?? '',
        direction: t.direction ?? 'insufficient-data',
        changeSinceFirst: t.changeSinceFirst ?? null,
        points: (t.points ?? []).map((p: any) => ({
          periodLabel: p.periodLabel ?? '',
          academicYear: p.academicYear ?? null,
          termOrdinal: p.termOrdinal ?? null,
          mark: p.mark ?? null,
        })),
      })),
    };
  }

  private mapAcademicSummary(res: any) {
    return {
      fiveYearOutlook: res.fiveYearOutlook ?? res.fiveYearsOutLook,
      studyTips: Array.isArray(res.studyTips) ? res.studyTips.join(' • ') : res.studyTips,
      improvementRoadmap: res.improvementRoadmap ?? res.improvementtoRoadmap,
      skillsToLearn: Array.isArray(res.skillsToLearn) ? res.skillsToLearn : res.skillsToLearn ? [res.skillsToLearn] : [],
      universitiesToConsider: this.toArray(res.universitiesToConsider) ?? this.toArray(res.universitiestoConsider) ?? [],
      bursariesAvailable: this.toArray(res.bursariesAvailable) ?? [],
      subjectChangeSuggestions: this.toSubjectChangeSuggestions(res),
      teacherRecommendation: res.teacherRecommendation,
      parentSummary: res.parentSummary,
      timeStamp: res.timeStamp,
    };
  }

  private mapCareerMatches(res: any) {
    const bestCareers = (res.top3BestCareers ?? (res as any).Top3BestCareers ?? []).map((c: any) => this.mapCareerMatch(c));
    const altCareers = (() => {
      const raw = res.alternativeCareers ?? res.topFiveAlternativeCareer ?? res.topFiveAlternativeCareers ?? res.alternativeCareer ?? res.AlternativeCareers ?? [];
      return raw.map((c: any) => this.mapCareerMatch(c));
    })();
    return { topFiveBestCareers: bestCareers, topFiveAlternativeCareer: altCareers };
  }

  private mapDemandAnalysis(res: any) {
    return {
      topDemandingJobs: (res.demandingCareers ?? res.topDemandingJobs ?? []).map((d: any) => this.mapDemandJob(d)),
      dyingCareers: (res.dyingCareerWarnings ?? res.dyingCareers ?? res.DyingCareers ?? []).map((d: any) => this.mapDyingCareer(d)),
    };
  }

  private mapOutlook(res: any) {
    return {
      employmentOutlookAfterGraduation: (res.employmentOutlooks ?? []).map((o: any) => ({
        ...o,
        outlookSummary: o.outlookSummary ?? o.outlookSummry ?? '',
        topIndustriesHiring: o.topIndustriesHiring ?? [],
      })),
    };
  }

  private mapSubjectResults(res: any) {
    return (res.subjectResults ?? res.SubjectResults ?? []).map((s: any, i: number) => {
      const rawMark = Number(s.mark ?? s.Mark);
      const hasValidMark = Number.isFinite(rawMark) && rawMark >= 0 && rawMark <= 100;
      const mark = Number.isFinite(rawMark) ? rawMark : 0;
      return {
        subject: s.subect ?? s.subject ?? s.Subject ?? `Subject ${i + 1}`,
        mark,
        apsPoints: s.apsPoints ?? s.ApsPoints ?? null,
        includedInApsCalculation: s.includedInApsCalculation ?? s.IncludedInApsCalculation ?? null,
        // Do not use the generated grade/level for APS: it can disagree with the exact mark.
        grade: hasValidMark ? `Level ${apsPointsForMark(mark)}` : (s.grade ?? s.Grade ?? ''),
        careerRelevance: s.careerRelevance ?? s.CareerRelevance,
        improvementTip: s.improvementTip ?? s.ImprovementTip,
      };
    });
  }

  private mapApsAnalysis(res: any) {
    const aps = res.apsAnalysis;
    if (!aps) return undefined;

    const val = Number(aps.calculatedAps ?? aps.calculatedAPS ?? 0);
    const subjects: any[] = res.subjectResults ?? res.SubjectResults ?? [];
    const hasSourceMarks = subjects.some((s: any) => {
      const mark = Number(s.mark ?? s.Mark);
      return Number.isFinite(mark) && mark >= 0 && mark <= 100;
    });
    const hasApsBreakdown = subjects.length > 0 && subjects.every((s: any) =>
      Number.isFinite(Number(s.apsPoints ?? s.ApsPoints)) &&
      typeof (s.includedInApsCalculation ?? s.IncludedInApsCalculation) === 'boolean'
    );
    // New API responses identify excluded subjects explicitly. For older stored reports,
    // preserve the existing SA rule that Life Orientation is not part of the APS total.
    const derivedAPS = hasApsBreakdown
      ? subjects.reduce((total: number, s: any) =>
          (s.includedInApsCalculation ?? s.IncludedInApsCalculation)
            ? total + Number(s.apsPoints ?? s.ApsPoints)
            : total, 0)
      : hasSourceMarks
        ? subjects.reduce((total: number, s: any) => {
            const name = String(s.subject ?? s.Subject ?? s.subect ?? '').toLowerCase().trim();
            if (name === 'lo' || name.includes('life orientation')) return total;
            const mark = Number(s.mark ?? s.Mark);
            return Number.isFinite(mark) && mark >= 0 && mark <= 100
              ? total + apsPointsForMark(mark)
              : total;
          }, 0)
        : (val > 0 ? val : 0);

    const allUnis = [
      ...(aps.universitiesTheyQualifyFor ?? []),
      ...(aps.universitiestheyDoNotQualifyFor ?? aps.universitiesTheyDoNotQualifyFor ?? [])
    ].map((u: any) => ({
      name: u.name,
      status: u.status ?? '',
      minimumAPS: u.minimumAPS ?? u.minimumAps ?? 0,
      recommendedCourses: u.recommendedCourses ?? u.recommendedCourse ?? [],
      gap: u.gap ?? 0,
    }));

    const improvement = aps?.improvementAdvice;

    return {
      calculatedAPS: derivedAPS,
      apsExplanation: aps.apsExplanation,
      qualifiesForUniversity: derivedAPS >= 23,
      qualificationMessage: aps.qualificationMessage,
      universitiesTheyQualifyFor: allUnis.filter(u => derivedAPS >= u.minimumAPS),
      universitiesTheyDoNotQualifyFor: allUnis.filter(u => derivedAPS < u.minimumAPS).map(u => ({
        ...u,
        gap: u.minimumAPS - derivedAPS,
      })),
      improvementAdvice: improvement ? {
        shouldRewriteMatric: improvement.shouldRewriteMatric ?? improvement.shouldReWriteMatric,
        shouldUpgradeSubjects: improvement.shouldUpgradeSubjects,
        recommendedSubjectsToImprove: improvement.recommendedSubjectsToImprove ?? improvement.recommendedSubjecrsToImprove ?? [],
        alternativeOptions: improvement.alternativeOptions ?? [],
        motivationalGuidance: improvement.motivationalGuidance,
      } : undefined,
    };
  }

  private mapCareerMatch(c: any) {
    return {
      title: c.title ?? c.Title ?? c.careerTitle ?? '',
      reason: c.reason ?? c.Reason ?? '',
      field: c.field ?? c.Field ?? '',
      matchPercentage: c.matchPercentage ?? c.MatchPercentage ?? 0,
      requiredSubjects: Array.isArray(c.requiredSubjects) ? c.requiredSubjects.join(', ') : (c.requiredSubjects ?? c.RequiredSubjects ?? ''),
      universityCourse: c.universityCourse ?? c.UniversityCourse ?? '',
      jobDescription: c.jobDescription ?? c.JobDescription ?? '',
      growthPotential: c.growthPotential ?? c.growthPotentials ?? c.GrowthPotential ?? 'N/A',
      salaryRange: c.salaryRange ?? c.SalaryRange ?? '',
      timeToQualify: c.timeToQualify ?? c.TimeToQualify ?? '',
      topCompaniesHiring: c.topCompaniesHiring ?? c.TopCompaniesHiring ?? [],
    };
  }

  private mapDemandJob(d: any) {
    return {
      careerTitle: d.careerTitle ?? d.CareerTitle ?? '',
      whyItIsInDemand: d.whyItIsInDemand ?? d.whyitIsInDemand ?? d.whyItsInDemand ?? d.WhyItIsInDemand ?? '',
      globalDemandLevel: d.globalDemandLevel ?? d.GlobalDemandLevel ?? '',
      salaryRange: d.salaryRange ?? d.SalaryRange ?? '',
      canStudentQualify: d.canStudentQualify ?? d.CanStudentQualify ?? false,
      qualificationVerdict: d.qualificationVerdict ?? d.QualificationVerdict ?? '',
      reasonForVerdict: d.reasonForVerdict ?? d.ReasonForVerdict ?? '',
      chancesIfTheyOpt: d.chancesIfTheyOpt ?? d.chancesifTheyOpt ?? d.ChancesIfTheyOpt ?? d.chancesIfTheyOpted ?? 0,
      whatTheyNeedToSucceed: d.whatTheyNeedToSucceed ?? d.whatTheyNeedToSuccess ?? d.whatTheyNeedToSucced ?? d.WhatTheyNeedToSucceed ?? '',
      honestyMessage: d.honestyMessage ?? d.HonestyMessage ?? '',
      subjectsTheyAreMissing: d.subjectsTheyAreMissing ?? d.SubjectsTheyAreMissing ?? [],
      alternativeRoute: d.alternativeRoute ?? d.AlternativeRoute ?? '',
    };
  }

  private mapDyingCareer(d: any) {
    return {
      careerTitle: d.careerTitle ?? d.CareerTitle ?? '',
      whyItIsDying: d.whyItIsDying ?? d.WhyItIsDying ?? '',
      jobAvailabilityIn5Years: d.jobAvailabilityIn5Years ?? d.JobAvailabilityIn5Years ?? 0,
      chanceOfGettingJobAfterStudying: d.chanceOfGettingJobAfterStudying ?? d.ChanceOfGettingJobAfterStudying ?? 0,
      honestWarning: d.honestWarning ?? d.HonestWarning ?? '',
      motivationalRedirect: d.motivationalRedirect ?? d.MotivationalRedirect ?? '',
      betterAlternative: d.betterAlternative ?? d.BetterAlternative ?? '',
      isRelevantToStudent: d.isRelevantToStudent ?? d.IsRelevantToStudent ?? false,
      relevanceReason: d.relevanceReason ?? d.RelevanceReason ?? '',
    };
  }

  private toArray(val: any): any[] | undefined {
    if (Array.isArray(val)) return val;
    if (val) return [val];
    return undefined;
  }

  private toSubjectChangeSuggestions(res: any): any[] {
    const primary = res.subjectChangeSuggestions;
    const fallback = res.subjectChangeSuggestion;
    if (Array.isArray(primary)) return primary;
    if (Array.isArray(fallback)) return fallback;
    if (primary) return [primary];
    if (fallback) return [fallback];
    return [];
  }
}
