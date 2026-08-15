export const GUEST_DAILY_LIMIT = 3;
export const GUEST_HISTORY_LIMIT = 10;
export const MEMBER_HISTORY_LIMIT = 500;

export const MEMBER_BENEFITS = [
  'سوالات نامحدود با اشتراک',
  'ذخیره تاریخچه برگه‌ها در حساب',
  'دسترسی به پروفایل و تنظیمات',
  'همگام‌سازی بین دستگاه‌ها',
];

export const GUEST_BENEFITS = [
  `${GUEST_DAILY_LIMIT} سوال رایگان در روز`,
  'بدون نیاز به ثبت‌نام',
  'امتحان عکس و متن',
];

export function getPlanInfo(user) {
  if (user) {
    return {
      plan: 'member',
      label: 'اشتراک فعال',
      dailyLimit: Infinity,
      historyLimit: MEMBER_HISTORY_LIMIT,
      unlimited: true,
    };
  }
  return {
    plan: 'guest',
    label: 'مهمان',
    dailyLimit: GUEST_DAILY_LIMIT,
    historyLimit: GUEST_HISTORY_LIMIT,
    unlimited: false,
  };
}
