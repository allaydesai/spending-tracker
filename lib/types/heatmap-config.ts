import { z } from 'zod';

export interface HeatmapConfig {
  colorScale: {
    min: string; // CSS color for minimum spending
    mid: string; // CSS color for medium spending
    max: string; // CSS color for maximum spending
    empty: string; // CSS color for days with no spending
  };
  thresholds: {
    low: number; // Amount threshold for low spending
    high: number; // Amount threshold for high spending
  };
}

const cssColorRegex = /^(#[0-9A-Fa-f]{3,8}|(rgb|hsl)a?\([^)]+\)|[a-zA-Z]+)$/;

export const HeatmapConfigSchema = z.object({
  colorScale: z.object({
    min: z.string().regex(cssColorRegex, 'Must be a valid CSS color'),
    mid: z.string().regex(cssColorRegex, 'Must be a valid CSS color'),
    max: z.string().regex(cssColorRegex, 'Must be a valid CSS color'),
    empty: z.string().regex(cssColorRegex, 'Must be a valid CSS color')
  }),
  thresholds: z.object({
    low: z.number().min(0, 'Low threshold must be non-negative'),
    high: z.number().min(0, 'High threshold must be non-negative')
  }).refine((data) => data.low <= data.high, {
    message: 'Low threshold must be less than or equal to high threshold',
    path: ['high']
  })
});

export const validateHeatmapConfig = (data: unknown): HeatmapConfig => {
  return HeatmapConfigSchema.parse(data);
};

export const defaultHeatmapConfig: HeatmapConfig = {
  colorScale: {
    min: 'hsl(120, 50%, 90%)', // Light green
    mid: 'hsl(60, 50%, 70%)',  // Yellow
    max: 'hsl(0, 50%, 50%)',   // Red
    empty: 'hsl(0, 0%, 95%)'   // Light gray
  },
  thresholds: {
    low: 50,   // Increased from 25 to better handle typical spending amounts
    high: 200  // Increased from 75 to better differentiate high spending days
  }
};