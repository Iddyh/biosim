
export interface SimulationStep {
  title: string;
  description: string;
  prompt: string;
  type: 'image' | 'video';
}

export type VideoStyle = 'animation' | 'realistic' | 'documentary';
