-- Create workspace_onboarding table
CREATE TABLE IF NOT EXISTS workspace_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  website TEXT,
  sales_development_representative TEXT,
  calendar_integration BOOLEAN DEFAULT false,
  cal_com_api_key TEXT,
  product_description_short TEXT,
  product_description_indepth TEXT,
  icp_persona TEXT,
  icp_geography TEXT DEFAULT 'Global',
  icp_industry TEXT,
  icp_job_titles TEXT,
  icp_company_size TEXT,
  competitors TEXT,
  usp TEXT,
  icp_pains_needs TEXT,
  common_objections TEXT,
  reasons_to_believe TEXT,
  lead_magnet_ideas TEXT,
  product_presentation_url TEXT,
  video_presentation_url TEXT,
  useful_information TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id)
);

-- Add RLS policies for workspace_onboarding
ALTER TABLE workspace_onboarding ENABLE ROW LEVEL SECURITY;

-- Admin can do anything
CREATE POLICY admin_all ON workspace_onboarding 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Users can only view and update their own workspace's onboarding
CREATE POLICY user_select ON workspace_onboarding 
  FOR SELECT 
  TO authenticated 
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY user_insert ON workspace_onboarding 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

CREATE POLICY user_update ON workspace_onboarding 
  FOR UPDATE 
  TO authenticated 
  USING (
    workspace_id IN (
      SELECT workspace_id FROM users 
      WHERE users.id = auth.uid()
    )
  ) 
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspace_onboarding_updated_at
BEFORE UPDATE ON workspace_onboarding
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 