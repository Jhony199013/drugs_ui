import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://base.neurotalk.pro'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUyODcyNDAwLCJleHAiOjE5MTA2Mzg4MDB9.X_cIaZUuaPLipP5tBiV9w6oWwzRhmOvUXAVZTaKq79o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Drug {
  id: number
  commercialName: string
  mnnName: string
  active_Substance: string
  lpid: string
  conditionValue?: string
  owner?: string
  pharmacotherapeuticGroups?: string
  siteAddresses?: string
  ownersCountry?: string
  ruNumber?: string
  url?: string
  // Противопоказания
  ci_pregnancy?: string
  ci_pregnancy_t1?: string
  ci_pregnancy_t2?: string
  ci_pregnancy_t3?: string
  ci_breastfeeding?: string
  ci_newborns?: string
  ci_children_under_1y?: string
  ci_children_under_3y?: string
  ci_children_under_12y?: string
  ci_children_under_18y?: string
  ci_elderly?: string
  ci_diabetes_mellitus?: string
  ci_endocrine_disorders?: string
  ci_bronchial_asthma?: string
  ci_seizures_epilepsy?: string
  ci_gastrointestinal_disease?: string
  ci_liver_diseases?: string
  ci_hepatic_failure?: string
  ci_kidney_diseases?: string
  ci_renal_failure?: string
  ci_cardiovascular_diseases?: string
  ci_heart_failure?: string
  ci_driving_and_machinery?: string
}

export interface Cache {
  id: number
  cache_token: string
  interact: string
  explanation?: string
  created_at?: string
  updated_at?: string
}

