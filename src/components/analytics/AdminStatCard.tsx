import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent onClick={onClick}>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default AdminStatCard;