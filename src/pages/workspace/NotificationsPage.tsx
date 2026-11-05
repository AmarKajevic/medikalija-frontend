import { useState } from "react";
import { LuBell, LuCheck, LuCheckCheck } from "react-icons/lu";
import PageHeader from "@shared/ui/page/PageHeader";
import { Card } from "@shared/ui/card/Card";
import Tabs from "@shared/ui/tabs/Tabs";
import Button from "@shared/ui/button/Button";
import EmptyState, { ErrorState } from "@shared/ui/feedback/EmptyState";
import { Skeleton } from "@shared/ui/feedback/Spinner";
import { relativeTime, useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@features/notifications/hooks";

export default function NotificationsPage() {
  const { data = [], isLoading, isError, refetch } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();
  const [filter, setFilter] = useState<"unread" | "all">("unread");

  const unread = data.filter((n) => !n.isRead);
  const rows = filter === "unread" ? unread : data;

  return (
    <>
      <PageHeader
        title="Obaveštenja"
        description="Upozorenja o zalihama i unosima osoblja."
        actions={
          unread.length > 0 && (
            <Button variant="outline" size="sm" startIcon={<LuCheckCheck className="h-4 w-4" />} loading={markAll.isPending} onClick={() => markAll.mutate()}>
              Označi sve kao pročitano
            </Button>
          )
        }
      />
      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "unread", label: "Nepročitana", count: unread.length },
          { value: "all", label: "Sva", count: data.length },
        ]}
      />
      {isError ? (
        <ErrorState message="Obaveštenja nisu učitana." onRetry={() => refetch()} />
      ) : (
        <Card>
          {isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : rows.length === 0 ? (
            <EmptyState icon={<LuBell />} title={filter === "unread" ? "Sve je pročitano" : "Nema obaveštenja"} />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((n) => (
                <li key={n._id} className="flex items-start gap-3 px-5 py-4">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-gray-200 dark:bg-gray-700" : "bg-brand-500"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.isRead ? "text-gray-600 dark:text-gray-400" : "font-medium text-gray-900 dark:text-white"}`}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {relativeTime(n.createdAt)} · {new Date(n.createdAt).toLocaleString("sr-Latn-RS")}
                    </p>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="xs" startIcon={<LuCheck className="h-3.5 w-3.5" />} onClick={() => markOne.mutate(n._id)}>
                      Pročitano
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
