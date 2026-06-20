"use client";

import { RankedSlot, formatDate } from "@/lib/ranking";

type Props = {
  slots: RankedSlot[];
  totalParticipants: number;
};

export default function RankingList({ slots, totalParticipants }: Props) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        아직 응답이 없습니다.
      </p>
    );
  }

  return (
    <ol className="space-y-2">
      {slots.map((slot, idx) => {
        const isAll = slot.people.length === totalParticipants;
        const peopleDisplay = isAll
          ? "전체"
          : slot.people
              .map((p) => (slot.notes[p] ? `${p} (${slot.notes[p]})` : p))
              .join(", ");

        return (
          <li key={idx} className="flex gap-3 items-start py-2 border-b border-gray-100 last:border-0">
            <span className="text-xs font-bold text-gray-400 w-5 shrink-0 mt-0.5">
              {idx + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-900 text-sm">
                {formatDate(slot.date)}&nbsp;
                {slot.startTime}~{slot.endTime}
              </span>
              <span className="text-gray-400 text-sm mx-1">·</span>
              <span className="text-sm">
                <span className="text-gray-500">가능 인원: </span>
                <span className={isAll ? "font-bold text-black" : "text-gray-700"}>
                  {peopleDisplay}
                </span>
              </span>
            </div>
            <span className="shrink-0 text-xs font-semibold text-white bg-black rounded-full px-2 py-0.5">
              {slot.people.length}/{totalParticipants}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
