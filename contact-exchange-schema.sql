-- 전문가 연락처 교환 시스템 스키마

-- 연락처 교환 요청 테이블
CREATE TABLE contact_exchange_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES expert_bookings(id) ON DELETE CASCADE UNIQUE, -- 한 예약당 하나의 교환 요청
    expert_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- 요청 상태
    status TEXT CHECK (status IN ('pending', 'approved_by_expert', 'approved_by_client', 'both_approved', 'declined', 'expired')) DEFAULT 'pending',
    
    -- 전문가 연락처 (결제 완료 후에만 공개)
    expert_phone TEXT,
    expert_email TEXT,
    expert_preferred_contact TEXT, -- 'phone', 'email', 'both'
    expert_available_hours TEXT,   -- '평일 9-18시, 주말 상담 가능' 등
    expert_consultation_notes TEXT, -- 상담 전 안내사항
    
    -- 고객 연락처 (전문가에게만 공개)
    client_phone TEXT,
    client_email TEXT,
    client_preferred_contact TEXT,
    client_consultation_notes TEXT, -- 고객이 전문가에게 전달할 메시지
    
    -- 교환 승인 시간
    expert_approved_at TIMESTAMP WITH TIME ZONE,
    client_approved_at TIMESTAMP WITH TIME ZONE,
    both_approved_at TIMESTAMP WITH TIME ZONE, -- 양쪽 모두 승인된 시점
    
    -- 만료 시간 (상담 시간 + 24시간)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 연락처 교환 로그 테이블 (감사 목적)
CREATE TABLE contact_exchange_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exchange_request_id UUID REFERENCES contact_exchange_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT CHECK (action IN ('created', 'expert_approved', 'client_approved', 'declined', 'expired', 'contact_shared', 'consultation_completed')) NOT NULL,
    details JSONB, -- 추가 정보 (IP, 기기 정보 등)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 임시 연락처 시스템 테이블 (선택적 - 추후 구현)
CREATE TABLE temporary_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exchange_request_id UUID REFERENCES contact_exchange_requests(id) ON DELETE CASCADE,
    temp_phone TEXT UNIQUE, -- 플랫폼에서 제공하는 임시 번호
    temp_email TEXT UNIQUE, -- 플랫폼에서 제공하는 임시 이메일
    forwarding_to_expert_phone TEXT,
    forwarding_to_expert_email TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 인덱스 생성
CREATE INDEX idx_contact_exchange_requests_booking_id ON contact_exchange_requests(booking_id);
CREATE INDEX idx_contact_exchange_requests_expert_id ON contact_exchange_requests(expert_id);
CREATE INDEX idx_contact_exchange_requests_client_id ON contact_exchange_requests(client_id);
CREATE INDEX idx_contact_exchange_requests_status ON contact_exchange_requests(status);
CREATE INDEX idx_contact_exchange_requests_expires_at ON contact_exchange_requests(expires_at);
CREATE INDEX idx_contact_exchange_logs_exchange_request_id ON contact_exchange_logs(exchange_request_id);
CREATE INDEX idx_temporary_contacts_exchange_request_id ON temporary_contacts(exchange_request_id);

-- Row Level Security 활성화
ALTER TABLE contact_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_exchange_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE temporary_contacts ENABLE ROW LEVEL SECURITY;

-- 연락처 교환 요청 정책
CREATE POLICY "Users can read their own exchange requests" ON contact_exchange_requests
    FOR SELECT USING (
        auth.uid() = expert_id OR 
        auth.uid() = client_id OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "System can create exchange requests" ON contact_exchange_requests
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        ) OR
        auth.uid() = expert_id OR
        auth.uid() = client_id
    );

CREATE POLICY "Users can update their own exchange requests" ON contact_exchange_requests
    FOR UPDATE USING (
        auth.uid() = expert_id OR 
        auth.uid() = client_id OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 연락처 교환 로그 정책
CREATE POLICY "Users can read related exchange logs" ON contact_exchange_logs
    FOR SELECT USING (
        exchange_request_id IN (
            SELECT id FROM contact_exchange_requests 
            WHERE expert_id = auth.uid() OR client_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

CREATE POLICY "System can manage exchange logs" ON contact_exchange_logs
    FOR INSERT WITH CHECK (true); -- 시스템에서 자동 생성

-- 임시 연락처 정책
CREATE POLICY "Users can read related temporary contacts" ON temporary_contacts
    FOR SELECT USING (
        exchange_request_id IN (
            SELECT id FROM contact_exchange_requests 
            WHERE expert_id = auth.uid() OR client_id = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE role = 'admin' OR role = 'super_admin'
        )
    );

-- 자동 업데이트 시간 설정 트리거
CREATE TRIGGER update_contact_exchange_requests_updated_at
    BEFORE UPDATE ON contact_exchange_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at(); -- 기존 함수 재사용

-- 연락처 교환 자동 생성 함수 (결제 완료 시 호출)
CREATE OR REPLACE FUNCTION create_contact_exchange_request()
RETURNS TRIGGER AS $$
BEGIN
    -- 결제가 완료되고 예약이 확정된 경우에만 연락처 교환 요청 생성
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'completed' AND OLD.status != 'confirmed' THEN
        INSERT INTO contact_exchange_requests (
            booking_id,
            expert_id,
            client_id,
            expires_at
        ) VALUES (
            NEW.id,
            NEW.expert_id,
            NEW.client_id,
            NEW.scheduled_time + INTERVAL '24 hours' -- 상담 시간 + 24시간 후 만료
        );
        
        -- 로그 기록
        INSERT INTO contact_exchange_logs (
            exchange_request_id,
            user_id,
            action,
            details
        ) VALUES (
            (SELECT id FROM contact_exchange_requests WHERE booking_id = NEW.id),
            NEW.client_id,
            'created',
            jsonb_build_object('booking_id', NEW.id, 'auto_created', true)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 연락처 교환 자동 생성 트리거
CREATE TRIGGER auto_create_contact_exchange
    AFTER UPDATE ON expert_bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_contact_exchange_request();

-- 연락처 교환 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_contact_exchange_status()
RETURNS TRIGGER AS $$
BEGIN
    -- 전문가와 고객 모두 승인한 경우
    IF NEW.expert_approved_at IS NOT NULL AND NEW.client_approved_at IS NOT NULL AND OLD.both_approved_at IS NULL THEN
        NEW.status := 'both_approved';
        NEW.both_approved_at := TIMEZONE('utc'::text, NOW());
        
        -- 로그 기록
        INSERT INTO contact_exchange_logs (
            exchange_request_id,
            action,
            details
        ) VALUES (
            NEW.id,
            'contact_shared',
            jsonb_build_object('both_approved_at', NEW.both_approved_at)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 연락처 교환 상태 업데이트 트리거
CREATE TRIGGER update_exchange_status
    BEFORE UPDATE ON contact_exchange_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_exchange_status();

-- 만료된 연락처 교환 요청 정리 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION cleanup_expired_contact_exchanges()
RETURNS void AS $$
BEGIN
    UPDATE contact_exchange_requests 
    SET status = 'expired'
    WHERE expires_at < TIMEZONE('utc'::text, NOW()) 
    AND status NOT IN ('both_approved', 'expired');
    
    -- 만료 로그 기록
    INSERT INTO contact_exchange_logs (
        exchange_request_id,
        action,
        details
    )
    SELECT 
        id,
        'expired',
        jsonb_build_object('expired_at', TIMEZONE('utc'::text, NOW()))
    FROM contact_exchange_requests 
    WHERE status = 'expired' 
    AND updated_at >= TIMEZONE('utc'::text, NOW()) - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;