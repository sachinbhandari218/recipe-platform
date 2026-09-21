export const initialUsers = [
  {
    uid: "usr-1",
    id: "usr-1",
    email: "admin@recipes.com",
    display_name: "Sachin Bhandari (Admin)",
    name: "Sachin Bhandari (Admin)",
    password: "admin",
    role: "admin",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-09-01T08:00:00Z"
  },
  {
    uid: "usr-2",
    id: "usr-2",
    email: "aarav@recipes.com",
    display_name: "Aarav Sharma",
    name: "Aarav Sharma",
    password: "password123",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-09-02T09:30:00Z"
  },
  {
    uid: "usr-3",
    id: "usr-3",
    email: "priya@recipes.com",
    display_name: "Priya Patel",
    name: "Priya Patel",
    password: "password123",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-09-03T11:15:00Z"
  },
  {
    uid: "usr-4",
    id: "usr-4",
    email: "rohan@recipes.com",
    display_name: "Rohan Kulkarni",
    name: "Rohan Kulkarni",
    password: "password123",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-09-04T14:45:00Z"
  },
  {
    uid: "usr-5",
    id: "usr-5",
    email: "ananya@recipes.com",
    display_name: "Ananya Verma",
    name: "Ananya Verma",
    password: "password123",
    role: "user",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    created_at: "2026-09-05T16:20:00Z"
  }
];

export const initialRecipes = [];

export const initialReviews = [];

export const initialInteractions = [];

export const initialActivities = [];

export const initialSettings = {
  platformName: "Online Recipe Sharing Platform",
  allowGuestBrowsing: true,
  autoApproveVerified: true,
  allowPhotoUploads: true,
  contentModeration: true,
  maxPhotosPerRecipe: 5,
  contactEmail: "admin@recipes.com",
  maintenanceMode: false
};
