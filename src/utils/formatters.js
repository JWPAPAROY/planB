// 금액 포맷팅 유틸리티 함수들 (원본에서 가져옴, 기능 완전 보존)

export const formatAmount = (value) => {
  if (!value || value === '' || value === '0') return '💰 0원';
  const num = parseInt(value);
  if (num >= 10000) return `💰 ${(num / 10000).toFixed(1)}억원`;
  if (num >= 1000) return `💰 ${Math.round(num / 1000)}천만원`;
  return `💰 ${num.toLocaleString()}만원`;
};

export const formatResultAmount = (amount) => {
  if (amount < 0) {
    return `-${formatResultAmount(-amount)}`;
  }
  
  const 억 = Math.floor(amount / 100000000);
  const 만 = Math.round((amount % 100000000) / 10000);
  
  if (억 >= 1) {
    if (만 === 0) {
      return `${억}억원`;
    } else {
      return `${억}억 ${만}만원`;
    }
  } else {
    return `${만}만원`;
  }
};