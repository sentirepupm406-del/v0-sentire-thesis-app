-- ============================================================
-- Sentire: Add survey_responses table with all question columns
-- Migration 003: Create survey_responses table
-- ============================================================

-- ---- survey_responses ----
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program TEXT,
  gender TEXT,
  -- Loneliness Section
  q2_lonely_1 TEXT,
  q3_lonely_2 TEXT,
  q4_lonely_3 TEXT,
  q5_lonely_4 TEXT,
  -- Procrastination Section
  q6_procrastinate_1 TEXT,
  q7_procrastinate_2 TEXT,
  q8_procrastinate_3 TEXT,
  q9_procrastinate_4 TEXT,
  q10_procrastinate_5 TEXT,
  -- Depression Section
  q11_depressed_1 TEXT,
  q12_depressed_2 TEXT,
  q13_depressed_3 TEXT,
  -- Stress and Sleep
  q14_stress_1 TEXT,
  q15_sleep_1 TEXT,
  q16_sleep_2 TEXT,
  -- Work-life Balance
  q17_balance_1 TEXT,
  q18_balance_2 TEXT,
  -- Additional meta fields
  sentiment_score NUMERIC,
  ai_summary TEXT,
  detected_mood TEXT,
  survey_category TEXT,
  responses JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Students can select own responses
CREATE POLICY "survey_responses_select" ON public.survey_responses
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = user_id
  );

-- Students can insert responses
CREATE POLICY "Students can insert responses" ON public.survey_responses
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR auth.uid() = user_id
  );

-- Students can update own responses
CREATE POLICY "survey_responses_update" ON public.survey_responses
  FOR UPDATE USING (
    auth.uid() = student_id OR auth.uid() = user_id
  );

-- Teachers and Admins can view all responses
CREATE POLICY "Admins and Teachers can view all responses" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles_teachers pt
      WHERE pt.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles_admin pa
      WHERE pa.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = auth.uid() AND sp.role = 'teacher'
    )
  );

-- Admin insert support
CREATE POLICY "survey_insert_admin" ON public.survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles_admin pa
      WHERE pa.user_id = auth.uid()
    )
  );

-- Teachers can view all responses
CREATE POLICY "survey_staff_select_all" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles_teachers pt
      WHERE pt.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.profiles_admin pa
      WHERE pa.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_student_id ON public.survey_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_program ON public.survey_responses(program);
