import { z } from 'zod'

export const onboardingSchema = z.object({
  workspace_id: z.string(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  company_name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Invalid URL').nullish(),
  sales_development_representative: z.string().nullish(),
  product_description_short: z.string().min(1, 'Short product description is required'),
  product_description_indepth: z.string().min(1, 'In-depth product description is required'),
  usp: z.string().min(1, 'Unique selling proposition is required'),
  icp_persona: z.string().min(1, 'ICP persona is required'),
  icp_pains_needs: z.string().min(1, 'ICP pains and needs are required'),
  icp_geography: z.enum(['US', 'EU', 'Global', 'Other']).default('Global'),
  icp_industry: z.string().min(1, 'Target industry is required'),
  icp_job_titles: z.string().min(1, 'Target job titles are required'),
  icp_company_size: z.enum(['1-10', '11-50', '51-200', '201-5000', '5001+']).nullish(),
  competitors: z.string().min(1, 'Competitors information is required'),
  common_objections: z.string().min(1, 'Common objections are required'),
  reasons_to_believe: z.string().min(1, 'Reasons to believe are required'),
  lead_magnet_ideas: z.string().min(1, 'Lead magnet ideas are required'),
  product_presentation_url: z.string().url('Invalid URL').nullish(),
  video_presentation_url: z.string().url('Invalid URL').nullish(),
  calendar_integration: z.boolean().default(false),
  cal_com_api_key: z.string().nullish(),
  useful_information: z.string().nullish(),
  updated_at: z.string().nullish()
})

export type OnboardingFormData = z.infer<typeof onboardingSchema>

// Define which fields are required for each step
export const stepValidation = {
  1: ['first_name', 'last_name', 'email'] as const,
  2: ['company_name', 'website', 'sales_development_representative'] as const,
  3: ['product_description_short', 'product_description_indepth'] as const,
  4: ['usp', 'competitors'] as const,
  5: ['icp_persona', 'icp_geography', 'icp_industry', 'icp_job_titles', 'icp_company_size'] as const,
  6: ['icp_pains_needs', 'common_objections', 'reasons_to_believe'] as const,
  7: ['lead_magnet_ideas', 'product_presentation_url', 'video_presentation_url'] as const,
  8: ['calendar_integration', 'cal_com_api_key', 'useful_information'] as const
} as const 