export type City = {
  id: string;
  name: string;
  uf: string;
  state?: string | null;
};

export type UserAudience = 'ADULT' | 'MINOR';

export type Beach = {
  id: string;
  name: string;
  city_id: string;
};

export type BeachDetails = {
  id?: string;
  name?: string;
  city_id?: string;
  temperature?: number | null;
  wave_height?: number | null;
  wind_speed?: number | null;
  uv_index?: number | null;
  risk_level?: string | null;
  weather_updated_at?: string | null;
};

export type AlertType = 'DROWNING' | 'MEDICAL' | 'LOST_CHILD';

export type AlertStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'DISPATCHED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED'
  | string;

export type AlertCreateRequest = {
  alert_type: AlertType;
  latitude: number;
  longitude: number;
  beach_id?: string | null;
  zone_id?: string | null;
  battery_level?: number | null;
  created_by_id?: string | null;
};

export type CreatorInfo = {
  id: string;
  name: string;
};

export type AlertResponse = {
  id: string;
  alert_type: AlertType | string;
  status: AlertStatus;
  latitude: number;
  longitude: number;
  battery_level?: number | null;
  created_by?: CreatorInfo | null;
  child_id?: string | null;
  parent_id?: string | null;
  city_id?: string | null;
  beach_id?: string | null;
  zone_id?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  finished_at?: string | null;
};

export type AlertViewModel = {
  id: string;
  type: AlertType;
  status: AlertStatus;
  statusLabel: string;
  createdAtLabel: string;
  acceptedAtLabel?: string | null;
  finishedAtLabel?: string | null;
  beachId?: string | null;
  cityId?: string | null;
  zoneId?: string | null;
  batteryLevel?: number | null;
  childId?: string | null;
  parentId?: string | null;
  resolvedById?: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

export type AlertStatusSnapshot = {
  alert: AlertResponse | null;
  source: 'list_fallback';
};

export type GuardianConsentRecord = {
  version: string;
  acceptedAt: string;
  acceptedByName: string;
  acceptedByDocument?: string | null;
  relationship: string;
};

export type ChildProfileDraft = {
  id: string;
  displayName: string;
  ageBracket: '0-5' | '6-9' | '10-13' | '14-17';
  notes?: string | null;
  photoEnabled: false;
  publicVisibility: false;
  createdAt: string;
};

export type ChildContentStatus =
  | 'DRAFT_PRIVATE'
  | 'AWAITING_GUARDIAN_APPROVAL'
  | 'GUARDIAN_APPROVED_FOR_PUBLICATION'
  | 'PUBLISHED'
  | 'REJECTED_BY_GUARDIAN';

export type KidsIntegrationMode = 'LOCAL_SAFE' | 'REMOTE_CHILDREN_ONLY' | 'REMOTE_READY';

export type ChildLinkedProfile = ChildProfileDraft & {
  guardianConsentVersion: string;
  guardianName: string;
  guardianRelationship: string;
  source: 'LOCAL' | 'REMOTE';
  birthDate?: string | null;
  parentId?: string | null;
};

export type ChildProfileCreateRequest = {
  name: string;
  birth_date: string;
};

export type ChildProfileResponse = {
  id: string;
  name: string;
  birth_date: string;
  parent_id: string;
};

export type ChildProfileUpdateRequest = {
  name?: string | null;
  birth_date?: string | null;
};

export type ChildContentDraft = {
  id: string;
  childProfileId: string;
  title: string;
  category: 'DISCOVERY' | 'MISSION' | 'ACHIEVEMENT';
  status: ChildContentStatus;
  photoRequested: boolean;
  publicRequested: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChildContentCreateRequest = {
  child_profile_id: string;
  title: string;
  description?: string | null;
  category: ChildContentDraft['category'];
  photo_requested?: boolean;
};

export type ChildContentResponse = {
  id: string;
  guardian_id: string;
  child_profile_id: string;
  title: string;
  description?: string | null;
  category: ChildContentDraft['category'];
  media_url?: string | null;
  photo_requested: boolean;
  public_requested: boolean;
  status: ChildContentStatus;
  created_at: string;
  updated_at?: string | null;
};

export type GuardianConsentCreateRequest = {
  accepted_by_name: string;
  accepted_by_document?: string | null;
  relationship: string;
};

export type GuardianConsentResponse = {
  id: string;
  guardian_id: string;
  child_profile_id?: string | null;
  consent_version: string;
  accepted_at: string;
  relationship: string;
  accepted_by_name: string;
  accepted_by_document?: string | null;
  audit_id?: string | null;
};

export type GuardianNotificationItem = {
  id: string;
  type: 'KIDS_CONTENT_REVIEW' | 'KIDS_PROFILE_LINKED';
  title: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  relatedChildProfileId?: string | null;
  relatedContentId?: string | null;
};

export type GuardianNotificationResponse = {
  id: string;
  guardian_id: string;
  type: string;
  title: string;
  message: string;
  related_child_profile_id?: string | null;
  related_content_id?: string | null;
  created_at: string;
  sent_at?: string | null;
  read_at?: string | null;
};

export type GuardianContentReviewRequest = {
  decision: 'APPROVE' | 'REJECT';
  decision_reason?: string | null;
};

export type KidsFeatureAvailability = {
  childrenCrud: boolean;
  childPhotoUpload: boolean;
  guardianConsents: boolean;
  childContent: boolean;
  guardianNotifications: boolean;
};
