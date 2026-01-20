export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};

export const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 将 datetime-local 输入值转换为后端需要的格式 YYYY-MM-DD HH:MM:SS
export const formatDateTimeForAPI = (datetimeLocalValue: string): string => {
  if (!datetimeLocalValue) return '';
  // datetime-local 格式: YYYY-MM-DDTHH:MM
  // 转换为: YYYY-MM-DD HH:MM:SS
  const [datePart, timePart] = datetimeLocalValue.split('T');
  if (!timePart) return '';
  // 如果没有秒数，添加 :00
  const timeWithSeconds = timePart.includes(':') && timePart.split(':').length === 2 
    ? `${timePart}:00` 
    : timePart;
  return `${datePart} ${timeWithSeconds}`;
};

// 将后端格式 YYYY-MM-DD HH:MM:SS 转换为 datetime-local 输入值
export const formatDateTimeForInput = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  // 格式: YYYY-MM-DD HH:MM:SS
  // 转换为: YYYY-MM-DDTHH:MM
  const [datePart, timePart] = dateTimeString.split(' ');
  if (!timePart) return '';
  // 移除秒数部分
  const timeWithoutSeconds = timePart.split(':').slice(0, 2).join(':');
  return `${datePart}T${timeWithoutSeconds}`;
};
