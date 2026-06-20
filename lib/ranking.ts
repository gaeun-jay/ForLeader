import type { Response, Meeting } from "./supabase";

export type RankedSlot = {
  date: string;
  startTime: string;
  endTime: string;
  people: string[];
  notes: Record<string, string>;
  durationMinutes: number;
};

export function calculateRanking(responses: Response[], meeting: Meeting): RankedSlot[] {
  if (responses.length === 0) return [];

  const slotPeople = new Map<string, Set<string>>();
  const personNotes = new Map<string, string>();

  for (const r of responses) {
    if (r.note) personNotes.set(r.name, r.note);
    for (const slot of r.available_slots) {
      if (!slotPeople.has(slot)) slotPeople.set(slot, new Set());
      slotPeople.get(slot)!.add(r.name);
    }
  }

  const allSlots: string[] = [];
  for (const date of meeting.dates) {
    allSlots.push(...generateSlots(date, meeting.start_time, meeting.end_time, meeting.step_minutes));
  }

  const groups: RankedSlot[] = [];
  let i = 0;

  while (i < allSlots.length) {
    const slot = allSlots[i];
    const people = slotPeople.get(slot);

    if (!people || people.size === 0) {
      i++;
      continue;
    }

    const [date, time] = slot.split("_");
    let j = i + 1;

    while (j < allSlots.length) {
      const [nextDate] = allSlots[j].split("_");
      if (nextDate !== date) break;
      const nextPeople = slotPeople.get(allSlots[j]);
      if (!nextPeople || !setsEqual(people, nextPeople)) break;
      j++;
    }

    const [, lastTime] = allSlots[j - 1].split("_");
    const endTime = addMinutes(lastTime, meeting.step_minutes);
    const durationMinutes = (j - i) * meeting.step_minutes;

    const notes: Record<string, string> = {};
    for (const person of people) {
      if (personNotes.has(person)) notes[person] = personNotes.get(person)!;
    }

    groups.push({ date, startTime: time, endTime, people: Array.from(people), notes, durationMinutes });
    i = j;
  }

  groups.sort((a, b) => {
    if (b.people.length !== a.people.length) return b.people.length - a.people.length;
    if (b.durationMinutes !== a.durationMinutes) return b.durationMinutes - a.durationMinutes;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  return groups;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}

export function generateSlots(
  date: string,
  startTime: string,
  endTime: string,
  stepMinutes: number
): string[] {
  const slots: string[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (current < end) {
    slots.push(`${date}_${minutesToTime(current)}`);
    current += stepMinutes;
  }
  return slots;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number): string {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${month}월 ${day}일`;
}

export function generateTimeOptions(start: number, end: number, step: number): string[] {
  const options: string[] = [];
  for (let m = start; m <= end; m += step) {
    options.push(minutesToTime(m));
  }
  return options;
}
