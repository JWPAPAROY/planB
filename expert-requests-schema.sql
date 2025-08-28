-- 전문가 등록 요청 테이블
CREATE TABLE expert_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 기본 정보
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- 전문 분야 정보
    category TEXT NOT NULL CHECK (category IN ('travel', 'finance', 'housing')),
    experience_years TEXT NOT NULL,
    keywords TEXT,
    
    -- 검증 정보
    verification_type TEXT NOT NULL CHECK (verification_type IN ('business', 'license', 'organization', 'experience')),
    business_number TEXT,
    license_type TEXT,
    organization TEXT,
    
    -- 상태 관리
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    review_reason TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS 정책 설정
ALTER TABLE expert_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 요청만 조회/수정 가능
CREATE POLICY "Users can view own expert requests"
    ON expert_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expert requests"
    ON expert_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expert requests"
    ON expert_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- 관리자는 모든 요청 조회/수정 가능
CREATE POLICY "Admins can manage all expert requests"
    ON expert_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
        OR
        auth.uid() IN (
            SELECT id FROM auth.users 
            WHERE email IN (
                'jwpaparoy@gmail.com',
                'knoww.official@gmail.com'
            )
        )
    );

-- 인덱스 생성
CREATE INDEX idx_expert_requests_user_id ON expert_requests(user_id);
CREATE INDEX idx_expert_requests_status ON expert_requests(status);
CREATE INDEX idx_expert_requests_created_at ON expert_requests(created_at DESC);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_expert_requests_updated_at
    BEFORE UPDATE ON expert_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();