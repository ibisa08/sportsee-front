export const mockUserInfo = () => ({
  profile: {
    firstName: "Sophie",
    lastName: "Martin",
    createdAt: "2025-01-01",
    age: 32,
    weight: 60,
    height: 165,
    profilePicture: "http://localhost:8000/images/sophie.jpg",
  },
  statistics: {
    totalDistance: "2250.2",
    totalSessions: 348,
    totalDuration: 14625,
  },
});

export const mockUserActivity = () => ([
  { date: "2025-01-04", distance: 5.8, duration: 38, caloriesBurned: 422, heartRate: { min: 140, max: 178, average: 163 } },
  { date: "2025-01-05", distance: 3.2, duration: 20, caloriesBurned: 248, heartRate: { min: 148, max: 184, average: 171 } },
  { date: "2025-01-09", distance: 6.4, duration: 42, caloriesBurned: 468, heartRate: { min: 140, max: 176, average: 163 } },
]);
