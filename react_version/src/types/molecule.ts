import { FileData } from './file';

export interface Molecule {
    id: number;
    title: string;
    coverImage?: string;
    files: FileData[];
    uploadResponses?: any[];
    indexHtml?: string;
} 