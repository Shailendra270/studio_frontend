import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ShimmerCardProps {
  variant?: "video" | "clip";
}

const ShimmerCard: React.FC<ShimmerCardProps> = ({ variant = "video" }) => {
  return (
    <Card className="bg-[#1A1B1E] overflow-hidden border border-transparent animate-pulse">
      <div className="relative">
        {/* Thumbnail Skeleton */}
        <div
          className="aspect-video bg-gray-700"
          style={{ borderRadius: "12px 12px 0 0" }}
        >
          <div className="w-full h-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%] animate-shimmer"></div>
        </div>

        {/* Top Overlays */}
        <div className="absolute top-2 left-2">
          <div className="w-16 h-6 bg-gray-600 rounded animate-pulse"></div>
        </div>

        <div className="absolute top-2 right-2">
          <div className="w-8 h-6 bg-gray-600 rounded animate-pulse"></div>
        </div>

        {/* Bottom Badge */}
        <div className="absolute bottom-2 left-2">
          <div className="w-12 h-6 bg-gray-600 rounded animate-pulse"></div>
        </div>

        {variant === "clip" && (
          <div className="absolute top-2 left-2">
            <div className="w-4 h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <div className="w-3/4 h-4 bg-gray-600 rounded mb-2 animate-pulse"></div>
        <div className="w-1/2 h-4 bg-gray-600 rounded mb-3 animate-pulse"></div>

        {/* Date */}
        <div className="w-1/3 h-3 bg-gray-600 rounded mb-3 animate-pulse"></div>

        {variant === "clip" && (
          <>
            {/* Tags */}
            <div className="flex gap-2 mb-3">
              <div className="w-16 h-5 bg-gray-600 rounded animate-pulse"></div>
              <div className="w-12 h-5 bg-gray-600 rounded animate-pulse"></div>
              <div className="w-14 h-5 bg-gray-600 rounded animate-pulse"></div>
            </div>

            {/* Rating and other info */}
            <div className="flex justify-between items-center">
              <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
            </div>
          </>
        )}

        {variant === "video" && (
          <div className="flex items-center justify-between">
            <div className="w-16 h-6 bg-gray-600 rounded animate-pulse"></div>
            <div className="w-12 h-6 bg-gray-600 rounded animate-pulse"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShimmerCard;
