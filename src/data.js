export const CURRENT_STUDENT = {
  name: "Ananya Sharma",
  id: "STU-2026-1042",
  program: "B.Tech",
  year: "3rd Year",
  avatar: "https://i.pravatar.cc/150?img=47"
};

export const DEPARTMENTS = [
  "Counselling & Wellbeing",
  "Academic Support",
  "Student Finance",
  "Hostel & Accommodation",
  "Career Services",
  "Health Services",
  "IT & Digital Support",
  "Student Affairs",
  "International Student Support",
  "Disability Services",
  "Library Services",
  "Registrar's Office"
];

export const SELF_HELP_RESOURCES = [
  {
    id: 1,
    title: "2-Minute Breathing Exercise",
    type: "Quick Exercise",
    description: "A simple box breathing technique to reduce immediate stress and center yourself.",
    icon: "Wind"
  },
  {
    id: 2,
    title: "Grounding Technique (5-4-3-2-1)",
    type: "Mental Exercise",
    description: "Focus on your surroundings to manage anxiety and feeling overwhelmed.",
    icon: "Focus"
  },
  {
    id: 3,
    title: "Short Study-Break Guide",
    type: "Productivity",
    description: "How to take effective 10-minute breaks to maintain concentration.",
    icon: "Coffee"
  }
];

export const PAST_SESSIONS = [
  {
    id: 1,
    category: "Academic Support",
    date: "12 Sept 2026",
    counsellor: "Prof. Rajesh Kumar",
    summary: "Help with project deadlines and time management",
    department: "Academic Support",
    outcome: "Resolved",
    feedback: "Ananya is doing well but needs to build a daily timetable to avoid last-minute anxiety. We mapped out her schedule for the next month."
  },
  {
    id: 2,
    category: "Financial Aid",
    date: "03 Sept 2026",
    counsellor: "Mr. Amit Patel",
    summary: "Scholarship renewal inquiry",
    department: "Student Finance",
    outcome: "Resolved",
    feedback: "All documents successfully verified. Advised student to submit the forms before Oct 1st to ensure no delays in disbursement."
  },
  {
    id: 3,
    category: "Counselling & Wellbeing",
    date: "28 Aug 2026",
    counsellor: "Dr. Meera Kapoor",
    summary: "Initial consultation for stress management",
    department: "Counselling & Wellbeing",
    outcome: "Completed",
    feedback: "Student reported mild test anxiety. Walked through grounding techniques. Recommended a follow-up session during midterms."
  }
];

const mockTimeSlots = [
  { time: '09:00 AM', slot: 'Morning' },
  { time: '11:30 AM', slot: 'Morning' },
  { time: '02:00 PM', slot: 'Afternoon' },
  { time: '04:00 PM', slot: 'Evening' }
];

export const MOCK_COUNSELLORS = {
  "Counselling & Wellbeing": [
    { id: 'cw1', name: "Dr. Meera Kapoor", role: "Senior Counsellor", availableDays: ['Monday', 'Wednesday'] },
    { id: 'cw2', name: "Dr. Riya Malhotra", role: "Wellbeing Specialist", availableDays: ['Tuesday', 'Thursday'] }
  ],
  "Academic Support": [
    { id: 'as1', name: "Prof. Rajesh Kumar", role: "Academic Advisor", availableDays: ['Monday', 'Tuesday', 'Friday'] },
    { id: 'as2', name: "Ms. Neha Gupta", role: "Study Coach", availableDays: ['Wednesday', 'Thursday'] }
  ],
  "Student Finance": [
    { id: 'sf1', name: "Mr. Amit Patel", role: "Financial Aid Officer", availableDays: ['Monday', 'Thursday'] }
  ],
  "Hostel & Accommodation": [
    { id: 'ha1', name: "Warden Sunita", role: "Chief Warden", availableDays: ['Tuesday', 'Friday'] }
  ],
  "Career Services": [
    { id: 'cs1', name: "Mr. Vikram Singh", role: "Career Coach", availableDays: ['Wednesday'] }
  ],
  "Health Services": [
    { id: 'hs1', name: "Dr. Anita Desai", role: "Campus Doctor", availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] }
  ]
};

export const getCounsellorsForDept = (dept) => {
  return MOCK_COUNSELLORS[dept] || [
    { id: `mock-${dept.replace(/\s+/g, '')}`, name: `Staff Member (${dept})`, role: "Support Staff", availableDays: ['Monday', 'Tuesday', 'Wednesday'] }
  ];
};

export const generateAvailability = (counsellor) => {
  const slots = [];
  counsellor.availableDays.forEach(day => {
    mockTimeSlots.forEach((ts, idx) => {
      slots.push({
        id: `${counsellor.id}-${day}-${idx}`,
        day,
        time: ts.time,
        slot: ts.slot
      });
    });
  });
  return slots;
};
