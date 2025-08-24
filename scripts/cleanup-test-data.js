#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://iopidkmpoxcctixchkmv.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcGlka21wb3hjY3RpeGNoa212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyMjE5NDUsImV4cCI6MjAzOTc5Nzk0NX0.YPJGb6Atk6IfLEDEn8jF11JL7qIcq7dGhPBSqgA_uf8';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 테스트 데이터 정리 클래스
 */
class TestDataCleaner {
  constructor(specificIdentifier = null) {
    this.specificIdentifier = specificIdentifier;
  }

  /**
   * 테스트용 사용자 프로필 삭제
   */
  async cleanUserProfiles() {
    let query = supabase.from('user_profiles');

    if (this.specificIdentifier) {
      // 특정 식별자의 데이터만 삭제
      query = query.delete().like('user_id', `${this.specificIdentifier}_%`);
    } else {
      // 모든 테스트 데이터 삭제
      query = query.delete().or(
        'email.like.%@planb-test.com,user_id.like.test_%,nickname.like.테스트%'
      );
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 사용자 프로필 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 사용자 프로필 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 계산 데이터 삭제
   */
  async cleanCalculations() {
    let query = supabase.from('user_calculations');

    if (this.specificIdentifier) {
      query = query.delete().like('user_hash', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().like('user_hash', 'test_%');
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 계산 데이터 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 계산 데이터 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 지출 데이터 삭제
   */
  async cleanExpenses() {
    let query = supabase.from('user_expenses');

    if (this.specificIdentifier) {
      query = query.delete().like('user_hash', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().like('user_hash', 'test_%');
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 지출 데이터 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 지출 데이터 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 커뮤니티 댓글 삭제
   */
  async cleanCommunityReplies() {
    let query = supabase.from('community_replies');

    if (this.specificIdentifier) {
      query = query.delete().like('user_hash', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().or(
        'user_hash.like.test_%,author_nickname.like.테스트%'
      );
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 댓글 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 댓글 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 커뮤니티 게시글 삭제
   */
  async cleanCommunityPosts() {
    let query = supabase.from('community_posts');

    if (this.specificIdentifier) {
      query = query.delete().like('user_hash', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().or(
        'user_hash.like.test_%,author_nickname.like.테스트%,title.like.[테스트]%'
      );
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 게시글 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 게시글 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 공지사항 삭제
   */
  async cleanAnnouncements() {
    let query = supabase.from('announcements');

    if (this.specificIdentifier) {
      query = query.delete().like('author_id', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().like('title', '[테스트]%');
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 공지사항 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 공지사항 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 채팅 데이터 삭제
   */
  async cleanChatData() {
    // 채팅 메시지 삭제
    let messageQuery = supabase.from('chat_messages');
    if (this.specificIdentifier) {
      messageQuery = messageQuery.delete().like('sender_id', `${this.specificIdentifier}_%`);
    } else {
      messageQuery = messageQuery.delete().like('sender_id', 'test_%');
    }

    const { data: messageData, error: messageError } = await messageQuery.select();

    if (messageError) {
      console.error('❌ 채팅 메시지 삭제 오류:', messageError);
      return false;
    }

    // 채팅 참여자 삭제
    let participantQuery = supabase.from('chat_participants');
    if (this.specificIdentifier) {
      participantQuery = participantQuery.delete().like('user_id', `${this.specificIdentifier}_%`);
    } else {
      participantQuery = participantQuery.delete().like('user_id', 'test_%');
    }

    const { data: participantData, error: participantError } = await participantQuery.select();

    if (participantError) {
      console.error('❌ 채팅 참여자 삭제 오류:', participantError);
      return false;
    }

    // 채팅방 삭제
    let roomQuery = supabase.from('chat_rooms');
    if (this.specificIdentifier) {
      roomQuery = roomQuery.delete().like('created_by', `${this.specificIdentifier}_%`);
    } else {
      roomQuery = roomQuery.delete().or(
        'created_by.like.test_%,name.like.테스트%'
      );
    }

    const { data: roomData, error: roomError } = await roomQuery.select();

    if (roomError) {
      console.error('❌ 채팅방 삭제 오류:', roomError);
      return false;
    }

    const totalChatData = (messageData?.length || 0) + (participantData?.length || 0) + (roomData?.length || 0);
    console.log(`✅ ${totalChatData}개의 테스트 채팅 데이터 삭제 완료`);
    return totalChatData;
  }

  /**
   * 테스트용 예약 데이터 삭제
   */
  async cleanBookings() {
    let query = supabase.from('expert_bookings');

    if (this.specificIdentifier) {
      query = query.delete().or(
        `expert_id.like.${this.specificIdentifier}_%,client_id.like.${this.specificIdentifier}_%`
      );
    } else {
      query = query.delete().or(
        'expert_id.like.test_%,client_id.like.test_%'
      );
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 예약 데이터 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 예약 데이터 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 테스트용 게스트 계산 데이터 삭제
   */
  async cleanGuestCalculations() {
    let query = supabase.from('guest_calculations');

    if (this.specificIdentifier) {
      query = query.delete().like('guest_id', `${this.specificIdentifier}_%`);
    } else {
      query = query.delete().like('guest_id', 'test_%');
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ 게스트 계산 삭제 오류:', error);
      return false;
    }

    console.log(`✅ ${data ? data.length : 0}개의 테스트 게스트 계산 삭제 완료`);
    return data ? data.length : 0;
  }

  /**
   * 오래된 테스트 데이터 삭제 (1주일 이상 된 데이터)
   */
  async cleanOldTestData() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log(`📅 ${oneWeekAgo.toISOString()} 이전의 테스트 데이터 정리...`);

    let totalCleaned = 0;

    // 오래된 사용자 프로필
    const { data: oldUsers, error: userError } = await supabase
      .from('user_profiles')
      .delete()
      .lt('created_at', oneWeekAgo.toISOString())
      .like('email', '%@planb-test.com')
      .select();

    if (!userError && oldUsers) {
      totalCleaned += oldUsers.length;
      console.log(`✅ ${oldUsers.length}개의 오래된 테스트 사용자 삭제`);
    }

    // 오래된 계산 데이터
    const { data: oldCalculations, error: calcError } = await supabase
      .from('user_calculations')
      .delete()
      .lt('created_at', oneWeekAgo.toISOString())
      .like('user_hash', 'test_%')
      .select();

    if (!calcError && oldCalculations) {
      totalCleaned += oldCalculations.length;
      console.log(`✅ ${oldCalculations.length}개의 오래된 계산 데이터 삭제`);
    }

    // 오래된 게시글
    const { data: oldPosts, error: postError } = await supabase
      .from('community_posts')
      .delete()
      .lt('created_at', oneWeekAgo.toISOString())
      .like('title', '[테스트]%')
      .select();

    if (!postError && oldPosts) {
      totalCleaned += oldPosts.length;
      console.log(`✅ ${oldPosts.length}개의 오래된 테스트 게시글 삭제`);
    }

    console.log(`✅ 총 ${totalCleaned}개의 오래된 테스트 데이터 정리 완료`);
    return totalCleaned;
  }

  /**
   * 데이터베이스 연결 테스트
   */
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (error) throw error;

      console.log('✅ Supabase 연결 성공');
      return true;
    } catch (error) {
      console.error('❌ Supabase 연결 실패:', error.message);
      return false;
    }
  }

  /**
   * 모든 테스트 데이터 정리
   */
  async cleanAll() {
    console.log('🧹 테스트 데이터 정리 시작...');
    
    if (this.specificIdentifier) {
      console.log(`🎯 특정 식별자 대상: ${this.specificIdentifier}`);
    } else {
      console.log('🎯 모든 테스트 데이터 정리');
    }

    // 연결 테스트
    const connected = await this.testConnection();
    if (!connected) {
      console.error('❌ 데이터베이스 연결에 실패했습니다.');
      return false;
    }

    let totalCleaned = 0;

    try {
      // 의존성 순서대로 삭제 (외래키 제약조건 고려)
      
      // 1. 댓글 삭제 (게시글에 의존)
      const repliesCount = await this.cleanCommunityReplies();
      if (repliesCount !== false) totalCleaned += repliesCount;

      // 2. 채팅 데이터 삭제
      const chatCount = await this.cleanChatData();
      if (chatCount !== false) totalCleaned += chatCount;

      // 3. 예약 데이터 삭제
      const bookingCount = await this.cleanBookings();
      if (bookingCount !== false) totalCleaned += bookingCount;

      // 4. 게시글 삭제
      const postsCount = await this.cleanCommunityPosts();
      if (postsCount !== false) totalCleaned += postsCount;

      // 5. 공지사항 삭제
      const announcementsCount = await this.cleanAnnouncements();
      if (announcementsCount !== false) totalCleaned += announcementsCount;

      // 6. 지출 데이터 삭제
      const expensesCount = await this.cleanExpenses();
      if (expensesCount !== false) totalCleaned += expensesCount;

      // 7. 계산 데이터 삭제
      const calculationsCount = await this.cleanCalculations();
      if (calculationsCount !== false) totalCleaned += calculationsCount;

      // 8. 게스트 계산 삭제
      const guestCount = await this.cleanGuestCalculations();
      if (guestCount !== false) totalCleaned += guestCount;

      // 9. 사용자 프로필 삭제 (마지막)
      const usersCount = await this.cleanUserProfiles();
      if (usersCount !== false) totalCleaned += usersCount;

      console.log('🎉 테스트 데이터 정리 완료!');
      console.log(`📊 총 삭제된 레코드: ${totalCleaned}개`);

      return totalCleaned;

    } catch (error) {
      console.error('❌ 테스트 데이터 정리 중 오류:', error.message);
      return false;
    }
  }

  /**
   * 통계 조회
   */
  async getTestDataStats() {
    console.log('📊 테스트 데이터 통계 조회...');

    const stats = {};

    try {
      // 테스트 사용자 수
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .like('email', '%@planb-test.com');
      stats.users = userCount || 0;

      // 테스트 계산 수
      const { count: calcCount } = await supabase
        .from('user_calculations')
        .select('*', { count: 'exact', head: true })
        .like('user_hash', 'test_%');
      stats.calculations = calcCount || 0;

      // 테스트 게시글 수
      const { count: postCount } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true })
        .like('title', '[테스트]%');
      stats.posts = postCount || 0;

      // 테스트 댓글 수
      const { count: replyCount } = await supabase
        .from('community_replies')
        .select('*', { count: 'exact', head: true })
        .like('author_nickname', '테스트%');
      stats.replies = replyCount || 0;

      // 테스트 채팅방 수
      const { count: roomCount } = await supabase
        .from('chat_rooms')
        .select('*', { count: 'exact', head: true })
        .like('name', '테스트%');
      stats.chatRooms = roomCount || 0;

      console.log('현재 테스트 데이터 현황:');
      console.log(`  👥 사용자: ${stats.users}명`);
      console.log(`  🧮 계산: ${stats.calculations}건`);
      console.log(`  📝 게시글: ${stats.posts}건`);
      console.log(`  💬 댓글: ${stats.replies}건`);
      console.log(`  🏠 채팅방: ${stats.chatRooms}개`);

      return stats;

    } catch (error) {
      console.error('❌ 통계 조회 오류:', error.message);
      return null;
    }
  }
}

// 스크립트 직접 실행시 데이터 정리
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const identifier = args[1];

  const cleaner = new TestDataCleaner(identifier);

  if (command === 'stats') {
    // 통계 조회
    cleaner.getTestDataStats()
      .then(stats => {
        if (stats) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      });
  } else if (command === 'old') {
    // 오래된 데이터 정리
    cleaner.cleanOldTestData()
      .then(result => {
        if (result !== false) {
          console.log('\n✅ 오래된 테스트 데이터 정리가 완료되었습니다!');
          process.exit(0);
        } else {
          console.log('\n❌ 데이터 정리에 실패했습니다.');
          process.exit(1);
        }
      });
  } else {
    // 전체 정리
    cleaner.cleanAll()
      .then(result => {
        if (result !== false) {
          console.log('\n✅ 테스트 데이터 정리가 성공적으로 완료되었습니다!');
          process.exit(0);
        } else {
          console.log('\n❌ 테스트 데이터 정리에 실패했습니다.');
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('❌ 스크립트 실행 오류:', error);
        process.exit(1);
      });
  }
}

module.exports = TestDataCleaner;