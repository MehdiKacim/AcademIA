import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, MotionCard } from "@/components/ui/card"; // Import MotionCard
import { ElementType } from 'react'; // Import ElementType

interface AdminStatCardProps {
  title: string;
  description: string;
  value: string | number;
  icon?: ElementType; // Optional icon component
  onClick?: () => void; // Optional click handler
}

const AdminStatCard = ({ title, description, value, icon: Icon, onClick }: AdminStatCardProps) => {
  return (
    <MotionCard 
      className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow hover:scale-[1.02] transition-transform rounded-android-tile" : "hover:scale-[1.02] transition-transform rounded-android-tile"}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </MotionCard>
  );
};

export default AdminStatCard;