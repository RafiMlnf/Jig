import Cookies from 'js-cookie';

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const BASE = 'http://localhost:3001';

function getToken(): string {
  return Cookies.get('auth_token') || '';
}

/** Fetch all items for the design/abnormality dropdown */
export async function fetchDesignItems() {
  const res = await fetch(`${BASE}/api/design/items`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch design items');
  return res.json();
}

/** Submit a design revision update */
export async function submitDesignUpdate(itemId: string, data: {
  revStatus: string;
  designDateNew?: string;
  docLocation2D?: string;
  docLocation3D?: string;
  revisionNote?: string;
  vendorId?: string;
  poNumber?: string;
  cost?: number;
  leadTime?: number;
}) {
  const res = await fetch(`${BASE}/api/design/${itemId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to submit design revision');
  }
  return res.json();
}

/** Fetch all abnormality reports */
export async function fetchAbnormalities() {
  const res = await fetch(`${BASE}/api/abnormality`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch abnormalities');
  return res.json();
}

/** Submit a new abnormality report */
export async function createAbnormality(data: {
  itemId: string;
  type: string;
  description: string;
  dateFound?: string;
  foundBy: string;
  rootCause: string;
  tempAction: string;
  correctiveAction: string;
  actionPic: string;
  status?: 'OPEN' | 'MONITORING' | 'CLOSED';
  linkToRevision?: boolean;
  linkToSpare?: boolean;
}) {
  const res = await fetch(`${BASE}/api/abnormality`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create abnormality report');
  }
  return res.json();
}

/** Update abnormality status */
export async function updateAbnormalityStatus(id: string, status: 'OPEN' | 'MONITORING' | 'CLOSED') {
  const res = await fetch(`${BASE}/api/abnormality/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update abnormality status');
  return res.json();
}

/** Fetch dashboard high-priority alerts */
export async function fetchDashboardAlerts() {
  const res = await fetch(`${BASE}/api/inventory/alerts`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard alerts');
  return res.json();
}

/** Fetch all vendors list */
export async function fetchVendors() {
  const res = await fetch(`${BASE}/api/design/vendors`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new HttpError('Failed to fetch vendors list', res.status);
  return res.json();
}

/** Fetch full detailed master list */
export async function fetchMasterList() {
  const res = await fetch(`${BASE}/api/design/master-list`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new HttpError('Failed to fetch master list', res.status);
  return res.json();
}
