"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase, Meeting, Response } from "@/lib/supabase";
import { calculateRanking, formatDate } from "@/lib/ranking";
import MeetingForm from "./MeetingForm";
import RankingList from "./RankingList";
import { ChevronDown, ChevronUp, LogOut, Trash2 } from "lucide-react";

type MeetingWithStats = {
  meeting: Meeting;
  responses: Response[];
  expanded: boolean;
  confirmDelete: boolean;
};

export default function AdminDashboard() {
  const [items, setItems] = useState<MeetingWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: meetings } = await supabase
      .from("meetings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!meetings) {
      setLoading(false);
      return;
    }

    const results: MeetingWithStats[] = [];
    for (const m of meetings as Meeting[]) {
      const { data: responses } = await supabase
        .from("responses")
        .select("*")
        .eq("meeting_id", m.id);
      results.push({
        meeting: m,
        responses: (responses as Response[]) ?? [],
        expanded: false,
        confirmDelete: false,
      });
    }

    setItems(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function toggleExpand(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.meeting.id === id
          ? { ...item, expanded: !item.expanded, confirmDelete: false }
          : item
      )
    );
  }

  function requestDelete(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.meeting.id === id ? { ...item, confirmDelete: true } : item
      )
    );
  }

  function cancelDelete(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.meeting.id === id ? { ...item, confirmDelete: false } : item
      )
    );
  }

  async function confirmDelete(id: string) {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }
    setItems((prev) => prev.filter((item) => item.meeting.id !== id));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">관리자</h1>
          <button
            onClick={handleLogout}
            className="btn-glass flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            <LogOut size={13} />
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <MeetingForm onCreated={fetchAll} />

        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            회의 목록 ({items.length})
          </h2>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">불러오는 중…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">아직 생성된 회의가 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {items.map(({ meeting, responses, expanded, confirmDelete: showConfirm }) => {
                const respondedNames = new Set(responses.map((r) => r.name));
                const notRespondedNames = meeting.participants.filter(
                  (n) => !respondedNames.has(n)
                );
                const ranking = calculateRanking(responses, meeting);

                return (
                  <div key={meeting.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 flex items-start gap-3">
                      {/* 클릭 영역 — 제목/상태 */}
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left"
                        onClick={() => toggleExpand(meeting.id)}
                      >
                        <p className="font-semibold text-sm truncate">{meeting.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {meeting.dates.map((d) => formatDate(d)).join(", ")}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-semibold text-white bg-black rounded-full px-2.5 py-0.5">
                            응답 {respondedNames.size}/{meeting.participants.length}명
                          </span>
                          {notRespondedNames.length > 0 && (
                            <span className="text-xs text-gray-400">
                              미응답: {notRespondedNames.join(", ")}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* 우측 버튼 영역 */}
                      <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        {showConfirm ? (
                          <>
                            <button
                              type="button"
                              onClick={() => confirmDelete(meeting.id)}
                              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              삭제 확인
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelDelete(meeting.id)}
                              className="text-xs font-medium text-gray-500 hover:text-black px-2 py-1.5 transition-colors"
                            >
                              취소
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestDelete(meeting.id)}
                            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                            title="회의 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExpand(meeting.id)}
                          className="p-1.5 text-gray-400 hover:text-black transition-colors"
                        >
                          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        {responses.length === 0 ? (
                          <p className="text-sm text-gray-400">아직 응답이 없습니다.</p>
                        ) : (
                          <RankingList
                            slots={ranking}
                            totalParticipants={meeting.participants.length}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
