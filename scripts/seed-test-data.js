#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://iopidkmpoxcctixchkmv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcGlka21wb3hjY3RpeGNoa212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMjE5NDUsImV4cCI6MjAzOTc5Nzk0NX0.YPJGb6Atk6IfLEDEn8jF11JL7qIcq7dGhPBSqgA_uf8';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 테스트용 더미 데이터 생성
 */
class TestDataSeeder {
  constructor() {
    this.timestamp = Date.now();
    this.testIdentifier = `test_${this.timestamp}`;
  }

  /**
   * 테스트용 사용자 프로필 생성
   */
  async seedUserProfiles() {
    const users = [
      // 일반 회원들 - 기본 컬럼만 사용
      {
        email: `testuser1.${this.timestamp}@planb-test.com`,
        nickname: `테스트유저1_${this.timestamp}`
      },
      {
        email: `testuser2.${this.timestamp}@planb-test.com`,
        nickname: `테스트유저2_${this.timestamp}`
      },
      // 기본 회원 (전문가로 등록 예정)
      {
        email: `expert.user.${this.timestamp}@planb-test.com`,
        nickname: `전문가유저_${this.timestamp}`
      }
    ];

    const { data, error } = await supabase
      .from('user_profiles')
      .insert(users)
      .select();

    if (error) {
      console.error('❌ 사용자 프로필 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${users.length}개의 테스트 사용자 프로필 생성 완료`);
    return data;
  }

  /**
   * 테스트용 익명 세션 데이터 생성 (계산 데이터)
   */
  async seedAnonymousSessions() {
    const sessions = [
      {
        session_token: `${this.testIdentifier}_session_1`,
        calculation_hash: `${this.testIdentifier}_calc_1`,
        assigned_group: 'A',
        nickname: `테스트계산자1_${this.timestamp}`,
        monthly_budget: 3000000,
        asset_years: 25,
        housing_type: 'owned_living',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        last_active: new Date().toISOString(),
        community_posts_count: 0
      },
      {
        session_token: `${this.testIdentifier}_session_2`,
        calculation_hash: `${this.testIdentifier}_calc_2`,
        assigned_group: 'B',
        nickname: `테스트계산자2_${this.timestamp}`,
        monthly_budget: 2500000,
        asset_years: 30,
        housing_type: 'jeonse',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_active: new Date().toISOString(),
        community_posts_count: 0
      }
    ];

    const { data, error } = await supabase
      .from('anonymous_sessions')
      .insert(sessions)
      .select();

    if (error) {
      console.error('❌ 익명 세션 데이터 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${sessions.length}개의 테스트 익명 세션 생성 완료`);
    return data;
  }

  /**
   * 테스트용 전문가 프로필 생성
   */
  async seedExpertProfiles() {
    const expertProfiles = [
      {
        email: `expert.approved.${this.timestamp}@planb-test.com`,
        name: `승인전문가_${this.timestamp}`,
        phone: '010-1111-1111',
        title: '공인회계사 • 세무사',
        category: 'financial',
        specialties: ['세무상담', '자산관리', '상속세 절세'],
        bio: '15년 경력의 세무 전문가입니다. 개인 및 법인 세무상담을 전문으로 합니다.',
        experience_years: '15',
        credentials: ['공인회계사', '세무사', 'CFP'],
        business_license: '123-45-67890',
        qualification_number: 'CPA-12345',
        available_types: ['phone', 'video'],
        verification_status: 'approved',
        created_at: new Date().toISOString()
      },
      {
        email: `expert.pending.${this.timestamp}@planb-test.com`,
        name: `대기전문가_${this.timestamp}`,
        phone: '010-2222-2222',
        title: '시니어 여행 플래너',
        category: 'travel',
        specialties: ['시니어여행', '국내여행', '해외여행'],
        bio: '시니어 여행 전문 플래너로 안전하고 즐거운 여행을 기획합니다.',
        experience_years: '8',
        credentials: ['관광통역안내사', '여행상품기획사'],
        qualification_number: 'TG-67890',
        available_types: ['phone', 'video', 'chat'],
        verification_status: 'pending',
        created_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('expert_profiles')
      .insert(expertProfiles)
      .select();

    if (error) {
      console.error('❌ 전문가 프로필 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${expertProfiles.length}개의 테스트 전문가 프로필 생성 완료`);
    return data;
  }

  /**
   * 테스트용 커뮤니티 게시글 생성 (현재 구현되지 않음)
   */
  async seedCommunityPosts() {
    const posts = [
      {
        title: `[테스트] 은퇴 준비 질문 - ${this.timestamp}`,
        content: '50대 중반부터 은퇴 준비를 시작하려고 합니다. 어떤 것부터 시작해야 할까요?',
        author_nickname: `테스트유저1_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_user_1`,
        topic: 'general',
        group_name: '50대 그룹',
        is_anonymous: true,
        likes: 5,
        replies_count: 3,
        views: 42,
        created_at: new Date().toISOString()
      },
      {
        title: `[테스트] 전문가 추천 - ${this.timestamp}`,
        content: '세무 상담을 받고 싶은데 좋은 전문가 추천해주실 수 있나요?',
        author_nickname: `테스트유저2_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_user_2`,
        topic: 'general',
        group_name: '50대 그룹',
        is_anonymous: true,
        likes: 8,
        replies_count: 7,
        views: 68,
        created_at: new Date().toISOString()
      },
      {
        title: `[테스트] 전문가 서비스 소개 - ${this.timestamp}`,
        content: '15년 경력의 세무 전문가입니다. 은퇴 후 세금 절약 방법에 대해 상담해드립니다.',
        author_nickname: `승인전문가_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_expert_approved`,
        topic: 'expert',
        group_name: '전문가',
        is_anonymous: false,
        likes: 15,
        replies_count: 12,
        views: 156,
        expert_badge: '인증 전문가',
        expert_consultation_fee: '시간당 15만원',
        expert_available_methods: ['전화상담', '화상상담'],
        created_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('community_posts')
      .insert(posts)
      .select();

    if (error) {
      console.error('❌ 커뮤니티 게시글 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${posts.length}개의 테스트 게시글 생성 완료`);
    return data;
  }

  /**
   * 테스트용 댓글 생성
   */
  async seedCommunityReplies(posts) {
    if (!posts || posts.length === 0) return;

    const replies = [
      {
        post_id: posts[0].id,
        content: '저도 비슷한 고민을 하고 있습니다. 좋은 정보 공유해주세요!',
        author_nickname: `테스트유저2_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_user_2`,
        is_anonymous: true,
        created_at: new Date().toISOString()
      },
      {
        post_id: posts[0].id,
        content: '먼저 은퇴생활비 계산기로 현재 상황을 파악해보시는 것을 추천합니다.',
        author_nickname: `승인전문가_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_expert_approved`,
        is_anonymous: false,
        created_at: new Date().toISOString()
      },
      {
        post_id: posts[1].id,
        content: '세무 전문가님께 상담받았는데 정말 도움이 많이 되었습니다.',
        author_nickname: `테스트유저1_${this.timestamp}`,
        user_hash: `${this.testIdentifier}_user_1`,
        is_anonymous: true,
        created_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('community_replies')
      .insert(replies)
      .select();

    if (error) {
      console.error('❌ 댓글 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${replies.length}개의 테스트 댓글 생성 완료`);
    return data;
  }

  /**
   * 테스트용 공지사항 생성
   */
  async seedAnnouncements() {
    const announcements = [
      {
        title: `[테스트] 새로운 전문가 매칭 서비스 오픈 - ${this.timestamp}`,
        content: '더욱 정확한 전문가 매칭을 위한 새로운 서비스가 오픈되었습니다.',
        author_id: `${this.testIdentifier}_admin`,
        is_important: true,
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        title: `[테스트] WebRTC 영상통화 서비스 추가 - ${this.timestamp}`,
        content: '이제 전문가와 실시간 영상통화로 상담을 받으실 수 있습니다.',
        author_id: `${this.testIdentifier}_admin`,
        is_important: false,
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('announcements')
      .insert(announcements)
      .select();

    if (error) {
      console.error('❌ 공지사항 생성 오류:', error);
      return false;
    }

    console.log(`✅ ${announcements.length}개의 테스트 공지사항 생성 완료`);
    return data;
  }

  /**
   * 테스트용 채팅방 및 메시지 생성
   */
  async seedChatData() {
    // 채팅방 생성
    const chatRooms = [
      {
        name: `테스트 상담방 - ${this.timestamp}`,
        room_type: 'private',
        topic: '은퇴 자산관리 상담',
        created_by: `${this.testIdentifier}_user_1`,
        created_at: new Date().toISOString()
      }
    ];

    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert(chatRooms)
      .select();

    if (roomError) {
      console.error('❌ 채팅방 생성 오류:', roomError);
      return false;
    }

    // 채팅 참여자 추가
    const participants = [
      {
        room_id: roomData[0].id,
        user_id: `${this.testIdentifier}_user_1`,
        joined_at: new Date().toISOString(),
        is_active: true
      },
      {
        room_id: roomData[0].id,
        user_id: `${this.testIdentifier}_expert_approved`,
        joined_at: new Date().toISOString(),
        is_active: true
      }
    ];

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantError) {
      console.error('❌ 채팅 참여자 추가 오류:', participantError);
      return false;
    }

    // 테스트 메시지 생성
    const messages = [
      {
        room_id: roomData[0].id,
        sender_id: `${this.testIdentifier}_user_1`,
        content: '안녕하세요, 은퇴 후 자산관리에 대해 상담받고 싶습니다.',
        message_type: 'text',
        created_at: new Date().toISOString()
      },
      {
        room_id: roomData[0].id,
        sender_id: `${this.testIdentifier}_expert_approved`,
        content: '안녕하세요! 어떤 부분에 대해 궁금하신지 말씀해주세요.',
        message_type: 'text',
        created_at: new Date(Date.now() + 1000).toISOString()
      }
    ];

    const { data: messageData, error: messageError } = await supabase
      .from('chat_messages')
      .insert(messages)
      .select();

    if (messageError) {
      console.error('❌ 채팅 메시지 생성 오류:', messageError);
      return false;
    }

    console.log(`✅ 1개의 테스트 채팅방과 ${messages.length}개의 메시지 생성 완료`);
    return { roomData, messageData };
  }

  /**
   * 모든 테스트 데이터 생성
   */
  async seedAll() {
    console.log('🌱 테스트 데이터 생성 시작...');
    console.log(`📍 테스트 식별자: ${this.testIdentifier}`);

    try {
      // 1. 사용자 프로필 생성
      const users = await this.seedUserProfiles();
      if (!users) throw new Error('사용자 프로필 생성 실패');

      // 2. 전문가 프로필 생성
      const expertProfiles = await this.seedExpertProfiles();
      if (!expertProfiles) throw new Error('전문가 프로필 생성 실패');

      // 3. 익명 세션 데이터 생성 (계산 데이터)
      const sessions = await this.seedAnonymousSessions();
      if (!sessions) throw new Error('익명 세션 생성 실패');

      console.log('🎉 모든 테스트 데이터 생성 완료!');
      console.log('📊 생성된 데이터 요약:');
      console.log(`  - 사용자: ${users.length}명`);
      console.log(`  - 전문가 프로필: ${expertProfiles.length}개`);
      console.log(`  - 익명 세션: ${sessions.length}개`);
      console.log(`\n🔍 테스트 식별자: ${this.testIdentifier}`);
      console.log('   (데이터 정리시 이 식별자를 사용합니다)');

      return {
        testIdentifier: this.testIdentifier,
        users,
        expertProfiles,
        sessions
      };

    } catch (error) {
      console.error('❌ 테스트 데이터 생성 중 오류:', error.message);
      return false;
    }
  }
}

// 스크립트 직접 실행시 테스트 데이터 생성
if (require.main === module) {
  const seeder = new TestDataSeeder();
  seeder.seedAll()
    .then(result => {
      if (result) {
        console.log('\n✅ 테스트 데이터 생성이 성공적으로 완료되었습니다!');
        process.exit(0);
      } else {
        console.log('\n❌ 테스트 데이터 생성에 실패했습니다.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 스크립트 실행 오류:', error);
      process.exit(1);
    });
}

module.exports = TestDataSeeder;