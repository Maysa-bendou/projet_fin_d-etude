import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher({ isOpen }) {
  const { i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className={`flex items-center justify-center mb-2 ${isOpen ? 'flex-row gap-2 px-8 w-full' : 'flex-col gap-1'}`}>
      <button
        onClick={() => changeLanguage('fr')}
        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all duration-200
          ${i18n.language === 'fr'
            ? 'bg-[#fff5f5] text-[#ff0113]'
            : 'text-gray-400 hover:bg-gray-50 hover:text-[#ff0113]'
          }`}
      >
        FR
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all duration-200
          ${i18n.language === 'en'
            ? 'bg-[#fff5f5] text-[#ff0113]'
            : 'text-gray-400 hover:bg-gray-50 hover:text-[#ff0113]'
          }`}
      >
        EN
      </button>
    </div>
  );
}
