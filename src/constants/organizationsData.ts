// Shared dummy organization data used by OrganizationsPage and OrganizationDetailPage

export interface Organization {
    id: string;
    name: string;
    contactEmail: string;
    contactPhone: string;
    status: "Active" | "Suspended";
    usersCount: number;
    streamsCount: number;
    highlightsCount: number;
    createdAt: string;
}

export const DUMMY_ORGS: Organization[] = [
    { id: "org-001", name: "Acme Sports", contactEmail: "admin@acmesports.com", contactPhone: "+1 234 567 8900", status: "Active", usersCount: 24, streamsCount: 312, highlightsCount: 1870, createdAt: "2024-03-12" },
    { id: "org-002", name: "Global Football League", contactEmail: "ops@gfl.com", contactPhone: "+44 20 1234 5678", status: "Active", usersCount: 87, streamsCount: 1205, highlightsCount: 8432, createdAt: "2023-11-05" },
    { id: "org-003", name: "TechSport Media", contactEmail: "hello@techsportmedia.io", contactPhone: "+49 30 9876 5432", status: "Suspended", usersCount: 12, streamsCount: 89, highlightsCount: 543, createdAt: "2024-06-20" },
    { id: "org-004", name: "Arena Basketball Club", contactEmail: "contact@arenabasket.com", contactPhone: "+33 1 4567 8901", status: "Active", usersCount: 6, streamsCount: 45, highlightsCount: 210, createdAt: "2024-08-15" },
    { id: "org-005", name: "Rugby World Network", contactEmail: "admin@rwn.org", contactPhone: "+61 2 9876 5432", status: "Active", usersCount: 143, streamsCount: 2780, highlightsCount: 19640, createdAt: "2023-07-01" },
    { id: "org-006", name: "eSports United", contactEmail: "ops@esportsunited.gg", contactPhone: "+1 800 999 0001", status: "Active", usersCount: 38, streamsCount: 654, highlightsCount: 4321, createdAt: "2024-01-18" },
    { id: "org-007", name: "Pacific Swimming Federation", contactEmail: "info@psf.au", contactPhone: "+61 3 1234 5678", status: "Suspended", usersCount: 5, streamsCount: 22, highlightsCount: 98, createdAt: "2024-09-10" },
    { id: "org-008", name: "Champions Tennis Tour", contactEmail: "ctt@tennistour.com", contactPhone: "+34 91 234 5678", status: "Active", usersCount: 19, streamsCount: 187, highlightsCount: 1120, createdAt: "2024-02-28" },
    { id: "org-009", name: "Nordic Ice Hockey", contactEmail: "contact@nordichockey.no", contactPhone: "+47 21 234 567", status: "Active", usersCount: 57, streamsCount: 890, highlightsCount: 5670, createdAt: "2023-09-14" },
    { id: "org-010", name: "Sunset Athletics Club", contactEmail: "info@sunsetathletics.com", contactPhone: "+1 555 678 9012", status: "Active", usersCount: 8, streamsCount: 67, highlightsCount: 389, createdAt: "2024-10-03" },
    { id: "org-011", name: "MMA Global Hub", contactEmail: "admin@mmaglobal.com", contactPhone: "+55 11 2345 6789", status: "Active", usersCount: 31, streamsCount: 422, highlightsCount: 2890, createdAt: "2024-04-22" },
    { id: "org-012", name: "Volleyball World Series", contactEmail: "contact@vws.sport", contactPhone: "+39 06 1234 5678", status: "Suspended", usersCount: 44, streamsCount: 670, highlightsCount: 4100, createdAt: "2023-12-11" },
];
