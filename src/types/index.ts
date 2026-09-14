export interface Student {
  id: string;
  code: string;
  name: string;
  answers?: string[];
  score?: number;
  photoPath?: string | null;
}
