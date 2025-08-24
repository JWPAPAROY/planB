-- 전문가 예약 및 결제 시스템 스키마

-- 전문가 예약 테이블
CREATE TABLE expert_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    consultation_type TEXT CHECK (consultation_type IN ('phone', 'video', 'chat')) NOT NULL,
    consultation_topic TEXT NOT NULL,
    client_questions TEXT,
    client_phone TEXT, -- 전화 상담시 필요
    
    -- 결제 정보
    payment_amount INTEGER NOT NULL, -- 총 결제 금액
    platform_fee INTEGER NOT NULL,  -- 플랫폼 수수료 (10%)
    expert_payout INTEGER NOT NULL, -- 전문가 수령액 (90%)
    payment_method TEXT CHECK (payment_method IN ('card', 'kakaopay', 'toss', 'bank_transfer')) NOT NULL,
    payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
    
    -- 예약 상태
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    cancellation_reason TEXT,
    cancelled_by TEXT CHECK (cancelled_by IN ('client', 'expert', 'admin')),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- 상담 진행 관련
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_ended_at TIMESTAMP WITH TIME ZONE,
    expert_notes TEXT, -- 전문가 상담 노트
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5), -- 고객 평점
    client_review TEXT, -- 고객 리뷰
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 결제 내역 테이블 (상세 결제 로그)
CREATE TABLE payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES expert_bookings(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE, -- 외부 결제 시스템 트랜잭션 ID
    payment_method TEXT NOT NULL,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'KRW',
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
    
    -- 결제 게이트웨이 정보
    gateway_provider TEXT, -- 'kakaopay', 'toss', 'inicis' etc.
    gateway_transaction_id TEXT,
    gateway_response JSONB, -- 결제 게이트웨이 응답 저장
    
    -- 환불 정보
    refund_amount INTEGER DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 수수료 정산 테이블
CREATE TABLE fee_settlements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    settlement_period_start DATE NOT NULL,
    settlement_period_end DATE NOT NULL,
    
    -- 정산 금액 정보
    total_bookings_count INTEGER DEFAULT 0,
    total_revenue INTEGER DEFAULT 0,     -- 총 매출
    total_platform_fee INTEGER DEFAULT 0, -- 총 플랫폼 수수료
    expert_payout INTEGER DEFAULT 0,      -- 전문가 지급액
    
    -- 정산 상태
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    settlement_date TIMESTAMP WITH TIME ZONE,
    bank_account TEXT, -- 전문가 계좌 정보 (암호화 필요)
    transfer_memo TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_expert_bookings_expert_id ON expert_bookings(expert_id);
CREATE INDEX idx_expert_bookings_client_id ON expert_bookings(client_id);
CREATE INDEX idx_expert_bookings_scheduled_time ON expert_bookings(scheduled_time);
CREATE INDEX idx_expert_bookings_status ON expert_bookings(status);
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_fee_settlements_expert_id ON fee_settlements(expert_id);

-- Row Level Security 활성화
ALTER TABLE expert_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_settlements ENABLE ROW LEVEL SECURITY;

-- 예약 정책
CREATE POLICY "Users can read their own bookings" ON expert_bookings
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() = expert_id OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "Users can create bookings as clients" ON expert_bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Experts and admins can update bookings" ON expert_bookings
    FOR UPDATE USING (
        auth.uid() = expert_id OR
        auth.uid() = client_id OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 결제 내역 정책
CREATE POLICY "Users can read related payment transactions" ON payment_transactions
    FOR SELECT USING (
        booking_id IN (
            SELECT id FROM expert_bookings 
            WHERE client_id = auth.uid() OR expert_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "System can manage payment transactions" ON payment_transactions
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 수수료 정산 정책
CREATE POLICY "Experts can read their own settlements" ON fee_settlements
    FOR SELECT USING (
        auth.uid() = expert_id OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "Only admins can manage settlements" ON fee_settlements
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 자동 업데이트 시간 설정 트리거
CREATE TRIGGER update_expert_bookings_updated_at
    BEFORE UPDATE ON expert_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at(); -- 기존 함수 재사용

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at(); -- 기존 함수 재사용

CREATE TRIGGER update_fee_settlements_updated_at
    BEFORE UPDATE ON fee_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at(); -- 기존 함수 재사용

-- 자동 수수료 계산 함수
CREATE OR REPLACE FUNCTION calculate_platform_fees()
RETURNS TRIGGER AS $$
BEGIN
    NEW.platform_fee := ROUND(NEW.payment_amount * 0.1);
    NEW.expert_payout := NEW.payment_amount - NEW.platform_fee;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 수수료 자동 계산 트리거
CREATE TRIGGER calculate_fees_on_booking
    BEFORE INSERT OR UPDATE ON expert_bookings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_platform_fees();

-- 샘플 데이터는 실제 사용자 데이터가 있을 때 추가