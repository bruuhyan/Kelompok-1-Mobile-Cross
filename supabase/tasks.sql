-- Task assignment setup
-- Run this in Supabase SQL Editor to enable supervisor task assignment/review.

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'submitted', 'approved', 'rejected')),
  submission_note TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Employees can view own tasks" ON tasks;
CREATE POLICY "Employees can view own tasks"
  ON tasks FOR SELECT
  USING (assigned_to = auth.uid());

DROP POLICY IF EXISTS "Employees can submit own assigned tasks" ON tasks;
CREATE POLICY "Employees can submit own assigned tasks"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid() AND status IN ('assigned', 'rejected'))
  WITH CHECK (assigned_to = auth.uid());

DROP POLICY IF EXISTS "Supervisors can view org tasks" ON tasks;
CREATE POLICY "Supervisors can view org tasks"
  ON tasks FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

DROP POLICY IF EXISTS "Supervisors can create org tasks" ON tasks;
CREATE POLICY "Supervisors can create org tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Supervisors can review org tasks" ON tasks;
CREATE POLICY "Supervisors can review org tasks"
  ON tasks FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  )
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );
