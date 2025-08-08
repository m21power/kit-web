import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { ApiService } from "../services/api";

import { FeedbackButton } from "./FeedbackButton";

interface RatingSystemProps {
  username: string;
}

interface RatingData {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({ username }) => {
  const [ratingData, setRatingData] = useState<RatingData>({
    averageRating: 0,
    totalRatings: 0,
    userRating: null,
  });
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRatingData();
  }, [username]);

  const loadRatingData = async () => {
    try {
      const response = await ApiService.getRating(username);
      if (response.success && response.data) {
        setRatingData(response.data);
      }
    } catch (error) {
      console.error("Failed to load rating data:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await ApiService.submitRating(username, rating);
      if (response.success && response.data) {
        setRatingData(response.data);
      }
    } catch (error) {
      console.error("Failed to submit rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = hoveredStar
        ? starValue <= hoveredStar
        : starValue <= (ratingData.userRating || 0);

      return (
        <button
          key={index}
          onClick={() => handleRating(starValue)}
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(null)}
          disabled={isSubmitting}
          className="p-2 hover:bg-[#3c3c3c] rounded transition-colors duration-150 disabled:opacity-50"
        >
          <Star
            className={`w-6 h-6 transition-colors duration-150 ${
              isActive
                ? "text-yellow-400 fill-yellow-400"
                : "text-[#969696] hover:text-yellow-300"
            }`}
          />
        </button>
      );
    });
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#252526] border-t border-[#3c3c3c]">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-[#cccccc] mr-3 font-medium">
            Rate My Work 🥹:
          </span>
          <div className="flex items-center">{renderStars()}</div>
        </div>

        {ratingData.totalRatings > 0 && (
          <div className="flex items-center space-x-2 text-sm text-[#cccccc]">
            <div className="w-px h-5 bg-[#3c3c3c]"></div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-medium">
                {ratingData.averageRating.toFixed(1)}
              </span>
              <span>
                ({ratingData.totalRatings}{" "}
                {ratingData.totalRatings === 1 ? "rating" : "ratings"})
              </span>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="text-sm text-[#cccccc]">Submitting...</div>
        )}
      </div>

      <FeedbackButton username={username} />
    </div>
  );
};
