import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import employeeEN from './locales/en/employee.json';
import managerEN  from './locales/en/manager.json';
import chefEN  from './locales/en/chef.json';
import adminEN  from './locales/en/admin.json';
import technicienEN  from './locales/en/technicien.json';
import technicienFR from './locales/fr/technicien.json';
import adminFR from './locales/fr/admin.json';
import chefFR from './locales/fr/chef.json';
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
        chef:  chefEN,
        admin:  adminEN,
        technicien: technicienEN,
      },
      fr: {
        employee: employeeFR,
        manager:  managerFR,
        chef:  chefFR,
        admin:  adminFR,
        technicien: technicienFR,
      },
    },
    lng:         savedLang,
    fallbackLng: 'en',
    defaultNS:   'employee',
    ns:          ['employee', 'manager' , 'chef', 'admin' , 'technicien'],
    interpolation: { escapeValue: false },
  });

export default i18n;