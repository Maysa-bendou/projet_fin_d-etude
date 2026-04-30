import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import employeeEN from './locales/en/employee.json';
import managerEN  from './locales/en/manager.json';
import chefEN  from './locales/en/chef.json';
import adminEN  from './locales/en/admin.json';
import technicienEN  from './locales/en/technicien.json';
import profilEN  from './locales/en/profil.json';
import loginEN  from './locales/en/login.json';
import sidbarEN  from './locales/en/sidbar.json';
import topnavbarEN  from './locales/en/topnavbar.json';
import commonEN  from './locales/en/common.json';

import commonFR from './locales/fr/common.json';
import topnavbarFR from './locales/fr/topnavbar.json';
import sidbarFR from './locales/fr/sidbar.json';
import loginFR from './locales/fr/login.json';
import profilFR from './locales/fr/profil.json';
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
        profil: profilEN,
        login: loginEN,
        sidbar: sidbarEN,
        topnavbar: topnavbarEN,
        common: commonEN,
      },
      fr: {
        employee: employeeFR,
        manager:  managerFR,
        chef:  chefFR,
        admin:  adminFR,
        technicien: technicienFR,
        profil: profilFR,
        login: loginFR,
        sidbar: sidbarFR,
        topnavbar: topnavbarFR,
        common: commonFR,
      },
    },
    lng:         savedLang,
    fallbackLng: 'en',
    defaultNS:   'employee',
    ns:         ['employee', 'manager' , 'chef', 'admin' , 'technicien' , 'profil' , 'login' , 'sidbar' ,
                      'topnavbar', 'common'
                ],
    interpolation: { escapeValue: false },
  });

export default i18n;