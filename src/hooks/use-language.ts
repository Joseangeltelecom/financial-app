import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "./use-profile";

export function useLanguage() {
  const { i18n } = useTranslation();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (profile?.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language);
    }
  }, [profile?.language, i18n]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return {
    language: i18n.language,
    changeLanguage,
    resolvedLanguage: i18n.resolvedLanguage,
  };
}
