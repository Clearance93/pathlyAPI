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
  topCompaniesHiring: string[];
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
  subjectsTheyAreMissing: string[];
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
  topIndustriesHiring: string[];
  entryLevelSalary: string;
  seniorLevelSalary: string;
  outlookSummary: string;
}

export interface AiResponse {
  aiReponseId: string;
  userFullName: string;
  grade: string;
  summary: string;
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
  universitiesToConsider: string[];
  bursariesAvailable: string[];
  studyTips: string;
  improvementRoadmap: string;
  skillsToLearn: string[];
  fiveYearOutlook: string;
  salaryRange: string;
  riskAssessment: string;
  teacherRecommendation: string;
  parentSummary: string;
  subjectChangeSuggestions: string[];
  timeStamp: string;
}
