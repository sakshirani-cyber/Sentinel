export interface User {
    name: string;
    email: string;
    role: 'admin' | 'user';
    isPublisher: boolean;
}

export interface Option {
    id: string;
    text: string;
}

export interface Poll {
    id: string;
    title?: string; // Optional for backward compatibility, but required for new polls
    question: string;
    options: Option[];
    publisherEmail: string;
    publisherName: string;
    deadline: string;
    status: 'active' | 'completed' | 'scheduled' | 'deleted';
    scheduledFor?: string;
    consumers: string[];
    defaultResponse?: string;
    showDefaultToConsumers: boolean;
    anonymityMode: 'anonymous' | 'record';
    isPersistentAlert: boolean;
    alertBeforeMinutes: number;
    publishedAt: string;
    isPersistentFinalAlert?: boolean;
    isEdited?: boolean;
    updatedAt?: string;
    cloudSignalId?: number;
    syncStatus?: 'synced' | 'pending' | 'error';
    labels?: string[];
    anonymousReasons?: string[];
}

export interface Response {
    pollId: string;
    consumerEmail: string;
    response: string;
    submittedAt: string;
    isDefault: boolean;
    skipReason?: string;
}
