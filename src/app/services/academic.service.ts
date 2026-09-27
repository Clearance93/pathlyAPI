import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AiResponse, AcademicPrediction, AnalysisHistoryResponse, PsychometricScores } from '../models/ai-response.model';
import { environment } from '../../environments/environment';

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
    return (res.subjectResults ?? []).map((s: any, i: number) => ({
      subject: s.subect ?? s.subject ?? `Subject ${i + 1}`,
      mark: s.mark,
      grade: s.grade,
      careerRelevance: s.careerRelevance,
      improvementTip: s.improvementTip,
    }));
  }

  private mapApsAnalysis(res: any) {
    const aps = res.apsAnalysis;
    if (!aps) return undefined;

    const val = aps.calculatedAps ?? aps.calculatedAPS ?? 0;
    const subjects: any[] = res.subjectResults ?? [];
    const derivedAPS = val > 0 ? val : subjects.reduce((sum: number, s: any) => {
      const mark = s.mark ?? 0;
      if (mark >= 90) return sum + 7;
      if (mark >= 80) return sum + 6;
      if (mark >= 70) return sum + 5;
      if (mark >= 60) return sum + 4;
      if (mark >= 50) return sum + 3;
      if (mark >= 40) return sum + 2;
      if (mark >= 30) return sum + 1;
      return sum;
    }, 0);

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
