export type Role = 'landlord' | 'tenant' | null;
export type Crumb = { label: string; onClick?: () => void };
export type Step = { label: string; status: 'done' | 'active' | 'pending' };
export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';
export type RequestStatus = 'pending' | 'in_progress' | 'finished' | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'emergency';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'gcash' | 'card' | 'other';

export interface AuthProps {
    goBack: () => void;
    setUserRole: (role: Role) => void;
    setUserId: (id: number) => void;
    onForgotPassword?: () => void;
}

export interface UserDataProps {
    id: number;
    username: string;
    role: Role;
    created_at: string;
}

export interface ViewProfileProps {
    goBack: () => void;
    userRole: Role;
    userId: number;
    onUpdateProfile: () => void;
}

export interface ProfileDataProps{
    user_id: number;
    first_name: string;
    middle_name: string;
    last_name: string;
    ext_name: string;
    email: string;
    contact_num: string;
    role: Role;
}

export interface UpdateProfileProps {
    goBack: () => void;
    userRole: Role;
    userId: number;
    restrictToCredentials?: boolean;
    onSuccess: () => void;
}

export interface MarketplaceProps {
    userId: number;
    userRole: Role;
    onViewDetails: (property: PropertyDataProps) => void;
    onViewApplyRental: (property: PropertyDataProps) => void;
    onViewRentalApplications: () => void;
}

export interface PropertiesProps {
    goBack: () => void;
    userRole: Role;
    userId: number;
    setUserId: (id: number) => void;
    setUserRole: (role: Role) => void;
    onViewDetails: (property: PropertyDataProps) => void;
    onCreateRequest: (property: PropertyDataProps) => void;
    onUpdateProperty: (property: PropertyDataProps) => void;
    onViewPayment: (property: PropertyDataProps) => void;
    onTerminateLease: (property: PropertyDataProps) => void;
}

export interface PropertyDataProps {
    id: number;
    property_name: string;
    landlord_id: number;
    tenant_id: number | null;
    images?: string | null;
    tenant_first_name: string | null;
    tenant_last_name: string | null;
    tenant_ext_name: string | null; 
    address: string,
    status: string;
    price: number;
    description: string;
    category: string;
    bedroom_count: number;
    kitchen_count: number;
    bathroom_count: number;
    other_rooms: string;
    other_rooms_count: number;
    max_occupants: number;
    pets_allowed: boolean;
    pet_count: number;
    amenities: {
        wifi: boolean;
        aircon: boolean;
        parking: boolean;
    };
    other_amenities: string[];
    other_amenities_count: number;
}

export interface FilterState {
    priceMin: string;
    priceMax: string;
    category: string;
    hasBedroom: boolean;
    hasKitchen: boolean;
    hasBathroom: boolean;
    hasOtherRooms: boolean; 
    hasWifi: boolean;
    hasAircon: boolean;
    hasParking: boolean;
    hasOtherAmenities: boolean;
    occupancy: string;
    hasPets: boolean;
}

export interface PropertySearchProps {
    query: string;
    filters: FilterState;
    onQueryChange: (q: string) => void;
    onFiltersChange: (f: FilterState) => void;
    renderSearchSummary?: () => React.ReactNode;
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface ViewDetailsProps {
    goBack?: () => void;
    userRole?: Role;
    userId?: number;
    property?: PropertyDataProps;
    showHeader?: boolean;
    showActions?: boolean;
    onViewApplyRental?: () => void;
    onViewRentalApplications?: () => void;
    onTerminateLease?: () => void;
}

export interface TerminateLeaseProps {
    property: any;
    userId: number;
    userRole: Role;
    onSuccess: () => void;
    onCancel: () => void;
}

export interface AddPropertyProps {
    goBack: () => void;
    userId: number;
}

export interface UpdatePropertyProps {
    goBack: () => void;
    property: PropertyDataProps;
    onSuccess: () => void;
}

export type PropertyFormProps = | ({ mode: 'add' } & AddPropertyProps) | ({ mode: 'update' } & UpdatePropertyProps);

export interface ApplyRentalProps {
    property: any;
    userId: number;
    userRole: Role;
    onSuccess: () => void;
    onCancel: () => void;
    editMode?: boolean;
    existingApplication?: RentalApplicationDataProps | null;
}

export interface RentalApplicationDataProps {
    id: number;
    property_id: number;
    property_name: string;
    status: ApplicationStatus;
    applied_at: string;
    message?: string;
    lease_term: number;
    move_in_date: string;
    tenant_fullname: string;
    tenant_contact: string; 
    tenant_email: string;
}

export interface RentalApplicationsProps {
    goBack: () => void;
    userId: number;
    userRole: Role;
    onViewDetails: (property: PropertyDataProps) => void;
}

export interface CreateRequestsProps {
    property: any;
    userId: number;
    userRole: Role;
    onSuccess: () => void;
    onCancel: () => void;
    editMode?: boolean;
    existingRequest?: MaintenanceRequestsDataProps | null;
}

export interface MaintenanceRequestsDataProps {
    id: number;
    property_id: number;
    property_name: string;
    issue_title: string;
    issue_field: string;
    issue_description: string;
    priority: PriorityLevel;
    status: RequestStatus;
    request_date: string;
    resolved_date: string;
    tenant_fullname: string;
    tenant_contact: string; 
    tenant_email: string;
}

export interface MaintenanceRequestsProps {
    goBack: () => void;
    userId: number;
    userRole: Role;
    onViewDetails: (property: PropertyDataProps) => void;
}

export interface PaymentHistoryDataProps {
    id: number;
    property_id: number;
    property_name: string;
    tenant_id: number;
    landlord_id: number;
    amount: number;
    payment_method: PaymentMethod;
    period_covered: string;
    payment_date: string;
    status: PaymentStatus;
    notes: string;
    recorded_by: string;
    created_at: string;
}

export interface PaymentHistoryProps {
    goBack: () => void;
    userId: number;
    userRole: Role;
    onViewDetails: (property: PropertyDataProps) => void;
}

export interface PaymentProps {
    goBack: () => void;
}