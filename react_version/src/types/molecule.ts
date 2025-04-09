import { FileData } from './file';

export interface Molecule {
    id: number;
    title: string;
    coverImage?: string;
    files: FileData[];
    uploadResponses?: Array<{ url?: string; error?: string; status?: string; file?: string }>;
    indexHtml?: string;
    isLoading?: boolean;
} 