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

interface PedagogicalStructureChartProps {
  data: Array<{
    name: string;
    curricula: number;
    classes: number;
  }>;
}

const PedagogicalStructureChart = ({ data }: PedagogicalStructureChartProps) => {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Structure Pédagogique par Établissement</CardTitle>
        <CardDescription>Nombre de cursus et de classes par établissement.</CardDescription>
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
            <Bar dataKey="curricula" fill="hsl(var(--primary))" name="Cursus" />
            <Bar dataKey="classes" fill="hsl(var(--secondary))" name="Classes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PedagogicalStructureChart;