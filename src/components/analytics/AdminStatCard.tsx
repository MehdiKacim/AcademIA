import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatCardProps {
  title: string;
  description: string;
  value: string | number;
}

const AdminStatCard = ({ title, description, value }: AdminStatCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </CardContent>
    </Card>
  );
};

export default AdminStatCard;