"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { sendFeedbackToDiscord } from "../utils/feedbackService";

type FeedbackReaction = "like" | "neutral" | "dislike";

interface FeedbackWidgetProps {
  routeId?: string;
  generatedDistance?: number;
  routeCoordinates?: [number, number][];
  requestedDistance?: number;
  isAcceptFlow?: boolean;
  isNoFitFlow?: boolean;
  customTitle?: string;
  onClose: () => void;
}

export default function FeedbackWidget({
  routeId,
  generatedDistance,
  routeCoordinates,
  requestedDistance,
  isAcceptFlow = false,
  isNoFitFlow = false,
  customTitle,
  onClose,
}: FeedbackWidgetProps) {
  const t = useTranslations("Feedback");
  const [selectedReaction, setSelectedReaction] =
    useState<FeedbackReaction | null>(customTitle ? "like" : null);
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReactionSelect = (reaction: FeedbackReaction) => {
    if (reaction === "like") {
      onClose();
      return;
    }

    setSelectedReaction(reaction);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedReaction) return;

    setIsSubmitting(true);
    await sendFeedbackToDiscord({
      reaction: selectedReaction,
      routeId,
      routeCoordinates,
      routeDistanceMeters: generatedDistance,
      generatedDistance: generatedDistance
        ? generatedDistance / 1000
        : undefined,
      requestedDistance,
      additionalFeedback,
      isNoFitFlow: isNoFitFlow || (isAcceptFlow === false && !!customTitle),
    });
    setIsSubmitting(false);
    setTimeout(onClose, 500);
  };

  const reactions: Array<{
    key: FeedbackReaction;
    emoji: string;
    label: string;
  }> = [
    { key: "like", emoji: "👍", label: t("like") },
    { key: "neutral", emoji: "😐", label: t("neutral") },
    { key: "dislike", emoji: "👎", label: t("dislike") },
  ];

  const displayTitle =
    customTitle ||
    (isAcceptFlow ? t("feedbackAfterAccept") : t("feedbackPrompt"));

  return (
    <div className="fixed bottom-24 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-lg z-9999 max-w-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-medium text-slate-100 mb-1">{displayTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition"
          aria-label="Close feedback"
        >
          <X size={16} />
        </button>
      </div>

      {!selectedReaction && !customTitle ? (
        <div className="flex gap-4 justify-center">
          {reactions.map(({ key, emoji, label }) => (
            <button
              key={key}
              onClick={() => handleReactionSelect(key)}
              className="text-3xl hover:scale-125 transition-transform duration-200 bg-slate-800 rounded-md w-12 h-12 flex items-center justify-center"
              title={label}
              aria-label={label}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : selectedReaction ? (
        <div className="space-y-2">
          <textarea
            value={additionalFeedback}
            onChange={(e) => setAdditionalFeedback(e.target.value)}
            placeholder={t("feedbackPlaceholder")}
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-500 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            {!customTitle && (
              <button
                onClick={() => {
                  setSelectedReaction(null);
                  setAdditionalFeedback("");
                }}
                className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sm text-slate-100 rounded transition"
                disabled={isSubmitting}
              >
                {t("back")}
              </button>
            )}
            <button
              onClick={handleSubmitFeedback}
              className={`${customTitle ? "w-full" : "flex-1"} px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm text-white rounded transition disabled:opacity-50`}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("sending") : t("send")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
