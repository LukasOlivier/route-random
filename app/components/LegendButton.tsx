"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocationStore } from "../../stores/store";
import FloatingButton from "./FloatingButton";

export default function LegendButton() {
  const t = useTranslations("LegendButton");
  const { generatedRoute } = useLocationStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!generatedRoute) {
    return null;
  }

  return (
    <>
      <FloatingButton
        onClick={() => setIsOpen(true)}
        ariaLabel={t("ariaLabel")}
        title={t("tooltip")}
        showTextOnDesktop={true}
        umamiEvent="Open legend"
        umamiEventData={{ source: "floating-actions" }}
      >
        <span className="hidden lg:inline">{t("ariaLabel")}</span>

        <Info size={20} />
      </FloatingButton>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("modalTitle")}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-1.5 h-1.5 w-8 shrink-0 rounded-full bg-[#3388ff]"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {t("normalSegment")}
                  </h3>
                  <p className="mt-1 leading-relaxed text-sm text-gray-600 dark:text-gray-400">
                    {t("normalDescription")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1.5 h-1.5 w-8 shrink-0 rounded-full bg-[#ff0000]"></div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {t("overlapSegment")}
                  </h3>
                  <p className="mt-1 leading-relaxed text-sm text-gray-600 dark:text-gray-400">
                    {t("overlapDescription")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
