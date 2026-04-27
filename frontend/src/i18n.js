import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import employeeEN from './locales/en/employee.json';
import managerEN  from './locales/en/manager.json';
import employeeFR from './locales/fr/employee.json';
import managerFR  from './locales/fr/manager.json';

const savedLang = localStorage.getItem('lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        employee: employeeEN,
        manager:  managerEN,
      },
      fr: {
        employee: employeeFR,
        manager:  managerFR,
      },
    },
    lng:         savedLang,
    fallbackLng: 'en',
    defaultNS:   'employee',
    ns:          ['employee', 'manager'],
    interpolation: { escapeValue: false },
  });

export default i18n;