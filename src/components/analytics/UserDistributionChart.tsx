import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserDistributionChartProps {
  data: Array<{
    name: string;
    students: number;
    professeurs: number;
    tutors: number;
    directors: number;
    deputyDirectors: number;
  }>;
}

const UserDistributionChart = ({ data }: UserDistributionChartProps) => {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Distribution des Utilisateurs par Établissement</CardTitle>
        <CardDescription>Nombre d'élèves et de personnel par établissement.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
            <YAxis stroke="hsl(var(--foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend />
            <Bar dataKey="students" fill="hsl(var(--primary))" name="Élèves" stackId="a" />
            <Bar dataKey="professeurs" fill="hsl(var(--secondary))" name="Professeurs" stackId="a" />
            <Bar dataKey="tutors" fill="hsl(var(--accent))" name="Tuteurs" stackId="a" />
            <Bar dataKey="directors" fill="hsl(var(--destructive))" name="Directeurs" stackId="a" />
            <Bar dataKey="deputyDirectors" fill="hsl(var(--muted-foreground))" name="Directeurs Adjoints" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default UserDistributionChart;