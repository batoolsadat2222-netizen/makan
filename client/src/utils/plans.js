export const GUEST_DAILY_LIMIT = Infinity;
export const GUEST_HISTORY_LIMIT = 500;
export const MEMBER_HISTORY_LIMIT = 500;

export const MEMBER_BENEFITS = [
  'سوالات کاملاً نامحدود',
  'ذخیره تاریخچه برگه‌ها در حساب',
  'دسترسی به پروفایل و تنظیمات',
  'همگام‌سازی بین دستگاه‌ها',
];

export const GUEST_BENEFITS = [
  'سوالات کاملاً نامحدود',
  'بدون نیاز به ثبت‌نام',
  'استفاده سریع و رایگان',
];

export function getPlanInfo(user) {
  if (user) {
    return {
      plan: 'member',
      label: 'عضو',
      dailyLimit: Infinity,
      historyLimit: MEMBER_HISTORY_LIMIT,
      unlimited: true,
    };
  }
  return {
    plan: 'guest',
    label: 'مهمان',
    dailyLimit: Infinity,
    historyLimit: GUEST_HISTORY_LIMIT,
    unlimited: true,
  };
}
