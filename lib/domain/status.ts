export const assessmentStatuses = ["FIELD_SURVEY_REQUIRED", "ADDRESS_CORRECTION_REQUIRED", "MANUAL_DATA_REVIEW", "OUTSIDE_SERVICE_AREA", "SYSTEM_ERROR"] as const;
export type AssessmentStatus = (typeof assessmentStatuses)[number];
