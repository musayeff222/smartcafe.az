import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { pageTitle } from "../config/branding";
import QuickOrderPos from "../components/quickorder/QuickOrderPos";
import { useLanguage } from "../i18n/LanguageContext";

function MusteriSiparisEkle() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{pageTitle(t("musteriSiparis.title"))}</title>
      </Helmet>
      <QuickOrderPos
        initialQuickOrderId={id}
        mode="page"
        onBack={() => navigate("/siparisler")}
        onComplete={() => navigate("/siparisler")}
      />
    </>
  );
}

export default MusteriSiparisEkle;
