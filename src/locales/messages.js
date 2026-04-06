/**
 * UI strings: English and Arabic. Default app language is Arabic.
 * Keys are grouped by section for readability.
 */
export const messages = {
  en: {
    dashboard: {
      loading: 'Loading dashboard...',
      errorLoad: 'Failed to load dashboard data',
      welcome: 'Welcome back',
      welcomeEmoji: '👋',
      welcomeSub: "Here's what's happening with your business today",
      roleAllOrg: 'All Organization',
      roleMyTeam: 'My Team',
      roleMyPerformance: 'My Performance',
      roleDashboard: 'Dashboard',
      statTotalLeads: 'Total Leads',
      statActiveProperties: 'Active Properties',
      statDealsClosed: 'Deals Closed',
      statRevenue: 'Revenue',
      recentLeads: 'Recent Leads',
      viewAll: 'View all',
      noRecentLeads: 'No recent leads',
      todaysTasks: "Today's Tasks",
      viewCalendar: 'View calendar',
      noTasksToday: 'No tasks for today'
    },
    layout: {
      navDashboard: 'Dashboard',
      navLeads: 'Leads',
      navPipeline: 'Pipeline',
      navProperties: 'Properties',
      navDeals: 'Deals',
      navCalendar: 'Calendar',
      navTeam: 'Team',
      navReports: 'Reports',
      navSettings: 'Settings',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      switchToDark: 'Switch to dark mode',
      switchToLight: 'Switch to light mode',
      searchPlaceholder: 'Search leads, properties...',
      logout: 'Logout',
      logoAlt: 'Rukn'
    },
    roles: {
      admin: 'Admin',
      manager: 'Manager',
      team_leader: 'Team Leader',
      agent: 'Agent',
      sales_support: 'Sales Support'
    },
    leadPriority: {
      hot: 'Hot',
      warm: 'Warm',
      cold: 'Cold'
    },
    taskPriority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      urgent: 'Urgent'
    },
    leadSource: {
      facebook: 'Facebook',
      olx: 'OLX',
      website: 'Website',
      referral: 'Referral',
      call: 'Call',
      walk_in: 'Walk-in',
      other: 'Other'
    },
    taskTitle: {
      followUpPrefix: 'Follow up with '
    },
    auth: {
      loginTitle: 'Welcome Back',
      loginSub: 'Sign in to your account to continue',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      signInBtn: 'Sign In',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up',
      registerTitle: 'Create Account',
      registerSub: 'Sign up to get started with our CRM',
      firstNameLabel: 'First Name',
      lastNameLabel: 'Last Name',
      phoneLabel: 'Phone Number',
      confirmPasswordLabel: 'Confirm Password',
      createAccountBtn: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      signInLink: 'Sign in',
      brandingDesc: 'Manage your leads, properties, and deals efficiently',
      registerBrandingTitle: 'Join Rukn CRM',
      registerBrandingDesc: 'Start managing your real estate business more efficiently'
    },
    leads: {
      title: 'Leads',
      addLead: 'Add Lead',
      pipeline: 'Lead Pipeline',
      noLeads: 'No leads found',
      status: 'Status',
      priority: 'Priority',
      source: 'Source',
      assignedTo: 'Assigned To',
      contactInfo: 'Contact Information',
      notes: 'Notes',
      activities: 'Activities'
    },
    properties: {
      title: 'Properties',
      addProperty: 'Add Property',
      type: 'Type',
      price: 'Price',
      location: 'Location',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      area: 'Area',
      status: 'Status',
      amenities: 'Amenities',
      description: 'Description'
    },
    deals: {
      title: 'Deals',
      pipeline: 'Deal Pipeline',
      amount: 'Amount',
      stage: 'Stage',
      probability: 'Probability',
      expectedClose: 'Expected Close'
    },
    calendar: {
      title: 'Calendar',
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day'
    },
    reports: {
      title: 'Reports & Analytics',
      leadOverview: 'Lead Overview',
      revenueOverview: 'Revenue Overview',
      teamPerformance: 'Team Performance'
    },
    settings: {
      title: 'Settings',
      agency: 'Agency Settings',
      agencyDesc: 'Manage your agency settings and configuration',
      profile: 'Profile',
      notifications: 'Notifications',
      security: 'Security',
      language: 'Language',
      appearance: 'Appearance'
    }
  },
  ar: {
    dashboard: {
      loading: 'جاري تحميل لوحة التحكم...',
      errorLoad: 'تعذّر تحميل بيانات لوحة التحكم',
      welcome: 'مرحبًا بعودتك',
      welcomeEmoji: '👋',
      welcomeSub: 'إليك ملخص نشاط عملك اليوم',
      roleAllOrg: 'كامل المؤسسة',
      roleMyTeam: 'فريقي',
      roleMyPerformance: 'أدائي',
      roleDashboard: 'لوحة التحكم',
      statTotalLeads: 'إجمالي العملاء المحتملين',
      statActiveProperties: 'العقارات النشطة',
      statDealsClosed: 'الصفقات المغلقة',
      statRevenue: 'الإيرادات',
      recentLeads: 'أحدث العملاء المحتملين',
      viewAll: 'عرض الكل',
      noRecentLeads: 'لا يوجد عملاء محتملون حديثون',
      todaysTasks: 'مهام اليوم',
      viewCalendar: 'عرض التقويم',
      noTasksToday: 'لا توجد مهام لليوم'
    },
    layout: {
      navDashboard: 'لوحة التحكم',
      navLeads: 'العملاء المحتملون',
      navPipeline: 'مسار المبيعات',
      navProperties: 'العقارات',
      navDeals: 'الصفقات',
      navCalendar: 'التقويم',
      navTeam: 'الفريق',
      navReports: 'التقارير',
      navSettings: 'الإعدادات',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      switchToDark: 'التبديل إلى الوضع الداكن',
      switchToLight: 'التبديل إلى الوضع الفاتح',
      searchPlaceholder: 'ابحث عن عملاء، عقارات...',
      logout: 'تسجيل الخروج',
      logoAlt: 'ركن'
    },
    roles: {
      admin: 'مسؤول',
      manager: 'مدير',
      team_leader: 'قائد فريق',
      agent: 'وسيط',
      sales_support: 'دعم مبيعات'
    },
    leadPriority: {
      hot: 'ساخن',
      warm: 'دافئ',
      cold: 'بارد'
    },
    taskPriority: {
      high: 'مرتفع',
      medium: 'متوسط',
      low: 'منخفض',
      urgent: 'عاجل'
    },
    leadSource: {
      facebook: 'فيسبوك',
      olx: 'أوليكس',
      website: 'الموقع',
      referral: 'إحالة',
      call: 'اتصال',
      walk_in: 'زيارة مباشرة',
      other: 'أخرى'
    },
    taskTitle: {
      followUpPrefix: 'متابعة مع '
    },
    auth: {
      loginTitle: 'مرحبًا بعودتك',
      loginSub: 'قم بتسجيل الدخول إلى حسابك للمتابعة',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور الخاصة بك',
      rememberMe: 'تذكرني',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      signInBtn: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      signUpLink: 'إنشاء حساب',
      registerTitle: 'إنشاء حساب جديد',
      registerSub: 'قم بالتسجيل للبدء في استخدام نظام ركن',
      firstNameLabel: 'الاسم الأول',
      lastNameLabel: 'الاسم بالتحديد',
      phoneLabel: 'رقم الهاتف',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      createAccountBtn: 'إنشاء الحساب',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      signInLink: 'تسجيل الدخول',
      brandingDesc: 'إدارة العملاء والعقارات والصفقات بكفاءة عالية',
      registerBrandingTitle: 'انضم إلى ركن CRM',
      registerBrandingDesc: 'ابدأ في إدارة أعمالك العقارية بكفاءة أكبر اليوم'
    },
    leads: {
      title: 'العملاء المحتملون',
      addLead: 'إضافة عميل',
      pipeline: 'مسار العملاء',
      noLeads: 'لم يتم العثور على عملاء',
      status: 'الحالة',
      priority: 'الأولوية',
      source: 'المصدر',
      assignedTo: 'مخصص لـ',
      contactInfo: 'معلومات الاتصال',
      notes: 'ملاحظات',
      activities: 'الأنشطة'
    },
    properties: {
      title: 'العقارات',
      addProperty: 'إضافة عقار',
      type: 'النوع',
      price: 'السعر',
      location: 'الموقع',
      bedrooms: 'غرف النوم',
      bathrooms: 'دورات المياه',
      area: 'المساحة',
      status: 'الحالة',
      amenities: 'المرافق',
      description: 'الوصف'
    },
    deals: {
      title: 'الصفقات',
      pipeline: 'مسار الصفقات',
      amount: 'المبلغ',
      stage: 'المرحلة',
      probability: 'الاحتمالية',
      expectedClose: 'الإغلاق المتوقع'
    },
    calendar: {
      title: 'التقويم',
      today: 'اليوم',
      month: 'شهر',
      week: 'أسبوع',
      day: 'يوم'
    },
    reports: {
      title: 'التقارير والتحليلات',
      leadOverview: 'نظرة عامة على العملاء',
      revenueOverview: 'نظرة عامة على الإيرادات',
      teamPerformance: 'أداء الفريق'
    },
    settings: {
      title: 'الإعدادات',
      agency: 'إعدادات الوكالة',
      agencyDesc: 'إدارة إعدادات وتهيئة الوكالة الخاصة بك',
      profile: 'الملف الشخصي',
      notifications: 'التنبيهات',
      security: 'الأمان',
      language: 'اللغة',
      appearance: 'المظهر'
    }
  }
};

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function createTranslator(lang) {
  const isEn = lang === 'en';
  const primary = isEn ? messages.en : messages.ar;
  const fallback = isEn ? messages.ar : messages.en;

  function t(path) {
    const v = getNested(primary, path) ?? getNested(fallback, path);
    return v !== undefined ? v : path;
  }

  function leadPriority(p) {
    const key = p?.toLowerCase?.() || p;
    return getNested(primary, `leadPriority.${key}`) || p;
  }

  function taskPriority(p) {
    const key = p?.toLowerCase?.() || p;
    return getNested(primary, `taskPriority.${key}`) || p;
  }

  function leadSource(s) {
    const key = s;
    return getNested(primary, `leadSource.${key}`) || s;
  }

  function userRole(r) {
    const key = r;
    return getNested(primary, `roles.${key}`) || r;
  }

  /** Localize task title from API (e.g. "Follow up with John Doe") */
  function taskTitle(title) {
    if (!title || isEn) return title;
    const enPrefix = messages.en.taskTitle.followUpPrefix;
    if (title.startsWith(enPrefix)) {
      return messages.ar.taskTitle.followUpPrefix + title.slice(enPrefix.length);
    }
    return title;
  }

  return { t, leadPriority, taskPriority, leadSource, userRole, taskTitle };
}
