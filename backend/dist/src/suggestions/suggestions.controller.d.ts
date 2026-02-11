import { SuggestionsService } from './suggestions.service';
import { SuggestionStatus } from '@prisma/client';
export declare class SuggestionsController {
    private service;
    constructor(service: SuggestionsService);
    create(tenantId: string, text: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SuggestionStatus;
        userId: string | null;
        text: string;
        category: string | null;
        tags: string[];
        adminNote: string | null;
    }>;
    findAll(tenantId: string, page?: number, limit?: number, status?: SuggestionStatus): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: import(".prisma/client").$Enums.SuggestionStatus;
            userId: string | null;
            text: string;
            category: string | null;
            tags: string[];
            adminNote: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    updateStatus(id: string, tenantId: string, body: {
        status: SuggestionStatus;
        adminNote?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SuggestionStatus;
        userId: string | null;
        text: string;
        category: string | null;
        tags: string[];
        adminNote: string | null;
    }>;
    updateTags(id: string, tenantId: string, body: {
        tags: string[];
        category?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.SuggestionStatus;
        userId: string | null;
        text: string;
        category: string | null;
        tags: string[];
        adminNote: string | null;
    }>;
    getKeywords(tenantId: string): Promise<{
        word: string;
        count: number;
    }[]>;
}
