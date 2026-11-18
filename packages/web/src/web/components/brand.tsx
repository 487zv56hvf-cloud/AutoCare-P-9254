import { Gauge } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
export function Brand({ lang, dark = false }: { lang: Lang; dark?: boolean }) {
  return (
    <div className={`brand ${dark ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <Gauge size={25} />
      </span>
      <span>
        {t(lang, "appName")}
        <small>
          {lang === "ar" ? "صيانة أوضح. قيادة أريح." : "A clearer way to care."}
        </small>
      </span>
    </div>
  );
}
