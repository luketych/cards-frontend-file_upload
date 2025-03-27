export interface FileData {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    thumbnail?: string;
}

export interface Molecule {
    id: number;
    title: string;
    coverImage: string;
    files: FileData[];
    isLoading?: boolean;
}

export interface StorageInfo {
    size: number;
    maxSize: number;
} 