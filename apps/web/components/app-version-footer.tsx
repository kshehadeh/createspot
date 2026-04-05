import { getTranslations } from "next-intl/server";
import { APP_VERSION } from "@/lib/app-version";

export async function AppVersionFooter() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto shrink-0 border-t border-border/40 bg-background py-3">
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
        <span>{t("publisherCopyright", { year })}</span>
        <span aria-hidden className="select-none text-border">
          ·
        </span>
        <span>{t("version", { version: APP_VERSION })}</span>
      </div>
    </footer>
  );
}
