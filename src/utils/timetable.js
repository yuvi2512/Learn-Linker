export const WEEKDAYS = [
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
];

export const TIME_SLOTS = [
  "8-9 AM",
  "9-10 AM",
  "10-11 AM",
  "11-12 PM",
  "12-1 PM",
  "2-3 PM",
  "3-4 PM",
];

export const TIME_SLOT_LABELS = {
  "8-9 AM": "08:00 – 09:00",
  "9-10 AM": "09:00 – 10:00",
  "10-11 AM": "10:00 – 11:00",
  "11-12 PM": "11:00 – 12:00",
  "12-1 PM": "12:00 – 13:00",
  "2-3 PM": "14:00 – 15:00",
  "3-4 PM": "15:00 – 16:00",
};

export function weekdayLabel(value) {
  return WEEKDAYS.find((day) => day.value === Number(value))?.full || "";
}
