import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AiResponse, PsychometricScores } from '../models/ai-response.model';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private http = inject(HttpClient);
  private apiUrl = 'https://localhost:7135/api/AcademicAnalysis/analysis';

  analyzeResults(base64File: string, mimeType: string, fileName?: string): Observable<AiResponse> {
    return this.http.post<any>(this.apiUrl, { base64File, mimeType, fileName }).pipe(
      map(res => {
        console.log('Raw API response:', JSON.stringify(res));
        return this.mapResponse(res);
      })
    );
  }

  analyzePsychometric(extractionAcademicRecordId: string, psychometric: PsychometricScores): Observable<AiResponse> {
    return this.http.post<any>('https://localhost:7135/api/AcademicAnalysis/psychometric-analysis', {
      extractionAcademicRecordId,
      psychometric
    }).pipe(map(res => this.mapResponse(res)));
  }

  private mapResponse(res: any): AiResponse {
    const aps = res.apsAnalysis;
    const improvement = aps?.improvementAdvice;

    return {
      aiReponseId: res.aiResponseId,
      extractionAcademicRecordId: res.extractionAcademicRecordId ?? null,
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
      fiveYearOutlook: res.fiveYearsOutLook,
      studyTips: Array.isArray(res.studyTips) ? res.studyTips.join(' • ') : res.studyTips,
      improvementRoadmap: res.improvementtoRoadmap ?? res.improvementRoadmap,
      skillsToLearn: Array.isArray(res.skillsToLearn) ? res.skillsToLearn : res.skillsToLearn ? [res.skillsToLearn] : [],
      universitiesToConsider: Array.isArray(res.universitiestoConsider) ? res.universitiestoConsider : res.universitiestoConsider ? [res.universitiestoConsider] : [],
      bursariesAvailable: Array.isArray(res.bursariesAvailable) ? res.bursariesAvailable : res.bursariesAvailable ? [res.bursariesAvailable] : [],
      subjectChangeSuggestions: Array.isArray(res.subjectChangeSuggestion)
        ? res.subjectChangeSuggestion
        : res.subjectChangeSuggestion ? [res.subjectChangeSuggestion] : [],
      teacherRecommendation: res.teacherRecommendation,
      parentSummary: res.parentSummary,
      timeStamp: res.timeStamp,
      subjectResults: (res.subjectResults ?? []).map((s: any, i: number) => ({
        subject: s.subect ?? s.subject ?? `Subject ${i + 1}`,
        mark: s.mark,
        grade: s.grade,
        careerRelevance: s.careerRelevance,
        improvementTip: s.improvementTip
      })),
      topFiveBestCareers: (res.top5BestCareers ?? []).map((c: any) => {
        console.log('Career raw:', JSON.stringify(c));
        console.log('Total careers from API:', (res.top5BestCareers ?? []).length);
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
          topCompaniesHiring: c.topCompaniesHiring ?? c.TopCompaniesHiring ?? []
        };
      }),
      topFiveAlternativeCareer: (() => {
        const raw = res.alternativeCareers ?? res.topFiveAlternativeCareer ?? res.topFiveAlternativeCareers ?? res.alternativeCareer ?? res.AlternativeCareers ?? [];
        console.log('Alternative careers raw key check:', {
          alternativeCareers: res.alternativeCareers,
          topFiveAlternativeCareer: res.topFiveAlternativeCareer,
          topFiveAlternativeCareers: res.topFiveAlternativeCareers,
          alternativeCareer: res.alternativeCareer,
          AlternativeCareers: res.AlternativeCareers,
          chosen: raw
        });
        return raw.map((c: any) => ({
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
          topCompaniesHiring: c.topCompaniesHiring ?? c.TopCompaniesHiring ?? []
        }));
      })(),
      topDemandingJobs: (res.demandingCareers ?? res.topDemandingJobs ?? []).map((d: any) => ({
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
        alternativeRoute: d.alternativeRoute ?? d.AlternativeRoute ?? ''
      })),
      dyingCareers: (res.dyingCareerWarnings ?? res.dyingCareers ?? res.DyingCareers ?? []).map((d: any) => ({
        careerTitle: d.careerTitle ?? d.CareerTitle ?? '',
        whyItIsDying: d.whyItIsDying ?? d.WhyItIsDying ?? '',
        jobAvailabilityIn5Years: d.jobAvailabilityIn5Years ?? d.JobAvailabilityIn5Years ?? 0,
        chanceOfGettingJobAfterStudying: d.chanceOfGettingJobAfterStudying ?? d.ChanceOfGettingJobAfterStudying ?? 0,
        honestWarning: d.honestWarning ?? d.HonestWarning ?? '',
        motivationalRedirect: d.motivationalRedirect ?? d.MotivationalRedirect ?? '',
        betterAlternative: d.betterAlternative ?? d.BetterAlternative ?? '',
        isRelevantToStudent: d.isRelevantToStudent ?? d.IsRelevantToStudent ?? false,
        relevanceReason: d.relevanceReason ?? d.RelevanceReason ?? ''
      })),
      employmentOutlookAfterGraduation: (res.employmentOutlooks ?? []).map((o: any) => ({
        ...o,
        outlookSummary: o.outlookSummary ?? o.outlookSummry ?? '',
        topIndustriesHiring: o.topIndustriesHiring ?? []
      })),
      apsAnalysis: aps ? (() => {
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
          gap: u.gap ?? 0
        }));

        const qualifies = allUnis.filter(u => derivedAPS >= u.minimumAPS);
        const notQualifies = allUnis.filter(u => derivedAPS < u.minimumAPS).map(u => ({
          ...u,
          gap: u.minimumAPS - derivedAPS
        }));

        return {
          calculatedAPS: derivedAPS,
          apsExplanation: aps.apsExplanation,
          qualifiesForUniversity: derivedAPS >= 23,
          qualificationMessage: aps.qualificationMessage,
          universitiesTheyQualifyFor: qualifies,
          universitiesTheyDoNotQualifyFor: notQualifies,
          improvementAdvice: improvement ? {
            shouldRewriteMatric: improvement.shouldReWriteMatric ?? improvement.shouldRewriteMatric,
            shouldUpgradeSubjects: improvement.shouldUpgradeSubjects,
            recommendedSubjectsToImprove: improvement.recommendedSubjecrsToImprove ?? improvement.recommendedSubjectsToImprove ?? [],
            alternativeOptions: improvement.alternativeOptions ?? [],
            motivationalGuidance: improvement.motivationalGuidance
          } : undefined
        };
      })() : undefined
    } as AiResponse;
  }
}