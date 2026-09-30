export interface UniversityQualification {
  name: string;
  minimumAPS: number;
  status: string;
  recommendedCourses?: string[];
  gap?: number;
}

export interface ImprovementAdvice {
  shouldRewriteMatric: boolean;
  shouldUpgradeSubjects: boolean;
  recommendedSubjectsToImprove: string[] | null;
  alternativeOptions: string[] | null;
  motivationalGuidance: string;
}

export interface ApsAnalysis {
  calculatedAPS: number | null;
  apsExplanation: string;
  qualifiesForUniversity: boolean;
  qualificationMessage: string;
  universitiesTheyQualifyFor: UniversityQualification[] | null;
  universitiesTheyDoNotQualifyFor: UniversityQualification[] | null;
  improvementAdvice?: ImprovementAdvice;
}

export interface SubjectResult {
  subject: string;
  mark: number;
  grade: string;
  careerRelevance: string;
  improvementTip: string;
}

export interface CareerMatch {
  title: string;
  reason: string;
  field: string;
  matchPercentage: number;
  requiredSubjects: string;
  universityCourse: string;
  jobDescription: string;
  growthPotential: string;
  salaryRange: string;
  timeToQualify: string;
  topCompaniesHiring: string[] | null;
}

export interface DemandingCareerAssessment {
  careerTitle: string;
  whyItIsInDemand: string;
  globalDemandLevel: string;
  salaryRange: string;
  canStudentQualify: boolean;
  qualificationVerdict: string;
  reasonForVerdict: string;
  chancesIfTheyOpt: number;
  whatTheyNeedToSucceed: string;
  honestyMessage: string;
  subjectsTheyAreMissing: string[] | null;
  alternativeRoute: string;
}

export interface DyingCareerWarning {
  careerTitle: string;
  whyItIsDying: string;
  jobAvailabilityIn5Years: number;
  chanceOfGettingJobAfterStudying: number;
  honestWarning: string;
  motivationalRedirect: string;
  betterAlternative: string;
  isRelevantToStudent: boolean;
  relevanceReason: string;
}

export interface EmploymentOutlook {
  careerTitle: string;
  chanceOfEmploymentAfterGraduation: number;
  averageTimeToGetFirstJob: string;
  jobMarketCompetition: string;
  southAfricanMarketInsight: string;
  globalOpportunities: string;
  topIndustriesHiring: string[] | null;
  entryLevelSalary: string;
  seniorLevelSalary: string;
  outlookSummary: string;
}

export interface PsychometricScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

export interface SubjectPrediction {
  subjectName: string;
  latestMark: number;
  projectedLow: number;
  projectedHigh: number;
  direction: 'up' | 'down' | 'steady' | string;
  lowConfidence: boolean;
}

export interface AcademicPrediction {
  isPredictionAvailable: boolean;
  nextTermOrdinal?: number | null;
  nextTermLabel?: string | null;
  subjectPredictions: SubjectPrediction[];
  atRiskSubjects: string[];
  caveat?: string | null;
}

export interface AnalysisHistoryItem {
  aiResponseId: string;
  extractionAcademicRecordId?: string | null;
  generatedAt: string;
  studyLevel?: string | null;
  driverTermLabel?: string | null;
  overallScore: number;
  calculatedAps?: number | null;
  isPremium: boolean;
  academicPersonality?: string | null;
}

export interface ApsTrendPoint {
  generatedAt: string;
  calculatedAps: number;
  label?: string | null;
}

export interface SubjectTrendPoint {
  periodLabel: string;
  academicYear?: number | null;
  termOrdinal?: number | null;
  mark?: number | null;
}

export interface SubjectTrend {
  subjectName: string;
  canonicalName: string;
  points: SubjectTrendPoint[];
  changeSinceFirst?: number | null;
  direction: 'improving' | 'declining' | 'steady' | 'insufficient-data' | string;
}

export interface Progression {
  isAvailable: boolean;
  uploadCount: number;
  periodCount: number;
  periodLabels: string[];
  firstAps?: number | null;
  latestAps?: number | null;
  apsChange?: number | null;
  subjectTrends: SubjectTrend[];
  summary: string;
}

export interface AnalysisHistoryResponse {
  items: AnalysisHistoryItem[];
  apsTrend: ApsTrendPoint[];
}

export interface AiResponse {
  aiResponseId: string;
  extractionAcademicRecordId?: string | null;
  driverTermLabel?: string | null;
  isPremium?: boolean;
  generatedAt?: string | null;
  academicPrediction?: AcademicPrediction | null;
  progression?: Progression | null;
  psychometricIncluded?: boolean;
  needsManualReview?: boolean;
  extractionWarnings?: string[] | null;
  userFullName: string;
  grade: string;
  summary: string;
  apsAnalysis?: ApsAnalysis;
  overallScore: number;
  academicPersonality: string;
  personalityDescription: string;
  feedBack: string;
  userStrength: string;
  userWeaknesses: string;
  motivationalMessage: string;
  subjectResults: SubjectResult[];
  topFiveBestCareers: CareerMatch[];
  topFiveAlternativeCareer: CareerMatch[];
  topDemandingJobs: DemandingCareerAssessment[];
  dyingCareers: DyingCareerWarning[];
  employmentOutlookAfterGraduation: EmploymentOutlook[];
  universitiesToConsider: string[] | null;
  bursariesAvailable: string[] | null;
  studyTips: string;
  improvementRoadmap: string;
  skillsToLearn: string[] | null;
  fiveYearOutlook: string;
  salaryRange: string;
  riskAssessment: string;
  teacherRecommendation: string;
  parentSummary: string;
  subjectChangeSuggestions: string[] | null;
  timeStamp: string;
}
