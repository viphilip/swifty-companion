export interface FortyTwoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  created_at: number;
}

export interface FortyTwoImageVersions {
  large?: string;
  medium?: string;
  small?: string;
  micro?: string;
}

export interface FortyTwoImage {
  link?: string;
  versions?: FortyTwoImageVersions;
}

export interface FortyTwoSkill {
  id: number;
  name: string;
  level: number;
}

export interface FortyTwoCursus {
  id: number;
  name: string;
  slug: string;
  kind?: string;
}

export interface FortyTwoCursusUser {
  begin_at?: string | null;
  end_at?: string | null;
  grade: string | null;
  level: number;
  skills: FortyTwoSkill[];
  cursus_id: number;
  cursus: FortyTwoCursus;
}

export interface FortyTwoProject {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

export interface FortyTwoProjectUser {
  id: number;
  occurrence?: number;
  final_mark: number | null;
  status: string;
  'validated?'?: boolean | null;
  validated?: boolean | null;
  current_team_id?: number | null;
  marked_at?: string | null;
  updated_at?: string;
  project: FortyTwoProject;
  cursus_ids: number[];
}

export interface FortyTwoUser {
  id: number;
  login: string;
  email: string;
  phone: string | null;
  wallet: number;
  correction_point: number;
  location: string | null;
  image: FortyTwoImage;
  cursus_users: FortyTwoCursusUser[];
  projects_users: FortyTwoProjectUser[];
}
