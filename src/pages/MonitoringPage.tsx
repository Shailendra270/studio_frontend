import React, { useEffect, useState } from "react";
import Sidebar from "../layouts/dashboard/Sidebar";
import { getAuditLogs, type AuditLogRecord } from "../api/auditLogsApi";
import { toast } from "sonner";
import { Eye, X } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
  restore: "Restore",
  request: "View",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function rowBgClass(action: string): string {
  const base = "border-t border-[#252527] text-gray-200";
  if (action === "update") return `${base} bg-amber-500/10`;
  if (action === "delete") return `${base} bg-red-500/10`;
  return base;
}

const MonitoringPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    ip: "",
    country: "",
  });
  const [detailLog, setDetailLog] = useState<AuditLogRecord | null>(null);

  const loadLogs = async (nextPage = page) => {
    try {
      setLoading(true);
      const response = await getAuditLogs({
        page: nextPage,
        limit: 25,
        ...filters,
      });
      setLogs(response.logs);
      setPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || "Failed to load monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-full bg-[#0f0f10] flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-white text-2xl font-semibold">Platform Monitoring</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track create/update/delete/view actions with actor, IP, and country.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <select
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded px-3 py-2 text-sm text-white"
            placeholder="Type"
            value={filters.action}
            onChange={(e) => setFilters((s) => ({ ...s, action: e.target.value }))}
          >
            <option value="">Type (all)</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="request">View</option>
            <option value="restore">Restore</option>
          </select>
          <input
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded px-3 py-2 text-sm text-white"
            placeholder="Entity"
            value={filters.entity}
            onChange={(e) => setFilters((s) => ({ ...s, entity: e.target.value }))}
          />
          <input
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded px-3 py-2 text-sm text-white"
            placeholder="IP"
            value={filters.ip}
            onChange={(e) => setFilters((s) => ({ ...s, ip: e.target.value }))}
          />
          <input
            className="bg-[#1b1b1d] border border-[#2a2a2d] rounded px-3 py-2 text-sm text-white"
            placeholder="Country"
            value={filters.country}
            onChange={(e) => setFilters((s) => ({ ...s, country: e.target.value }))}
          />
          <button
            className="bg-[#0051ff] hover:bg-[#0048e0] text-white rounded px-3 py-2 text-sm"
            onClick={() => loadLogs(1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>

        <div className="border border-[#2a2a2d] rounded-lg overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-[#171719] text-gray-300">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Entity</th>
                <th className="text-left p-3">Actor</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Country</th>
                <th className="text-left p-3">Organization</th>
                <th className="text-left p-3 max-w-[280px] w-[280px]">Path</th>
                <th className="text-left p-3 w-12 min-w-[3rem] shrink-0">View</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className={rowBgClass(log.action)}>
                  <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">{actionLabel(log.action)}</td>
                  <td className="p-3">{log.entity}</td>
                  <td className="p-3">{log.actorId || "-"}</td>
                  <td className="p-3">{log.ip || "-"}</td>
                  <td className="p-3">{log.country || "-"}</td>
                  <td className="p-3">
                    {typeof log.orgId === "object" && log.orgId?.name
                      ? log.orgId.name
                      : "-"}
                  </td>
                  <td className="p-3 max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap" title={log.path || "-"}>
                    {log.path || "-"}
                  </td>
                  <td className="p-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDetailLog(log)}
                      className="text-[#0051ff] hover:text-[#3078ff] p-1 rounded"
                      title="View full detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td className="p-4 text-gray-400" colSpan={9}>
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            className="px-3 py-1.5 rounded bg-[#1b1b1d] border border-[#2a2a2d] text-gray-200 disabled:opacity-40"
            onClick={() => loadLogs(Math.max(1, page - 1))}
            disabled={loading || page <= 1}
          >
            Prev
          </button>
          <span className="text-gray-300 text-sm">
            Page {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            className="px-3 py-1.5 rounded bg-[#1b1b1d] border border-[#2a2a2d] text-gray-200 disabled:opacity-40"
            onClick={() => loadLogs(Math.min(totalPages, page + 1))}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {detailLog != null && (
        <DetailModal log={detailLog} onClose={() => setDetailLog(null)} />
      )}
    </div>
  );
};

function DetailModal({
  log,
  onClose,
}: {
  log: AuditLogRecord;
  onClose: () => void;
}) {
  const orgName =
    typeof log.orgId === "object" && log.orgId?.name ? log.orgId.name : "-";
  const rows = [
    { label: "Time", value: new Date(log.createdAt).toLocaleString() },
    { label: "Type", value: actionLabel(log.action) },
    { label: "Action", value: log.action },
    { label: "Entity", value: log.entity },
    { label: "Entity ID", value: log.entityId ?? "-" },
    { label: "Actor", value: log.actorId ?? "-" },
    { label: "Organization", value: orgName },
    { label: "IP", value: log.ip ?? "-" },
    { label: "Country", value: log.country ?? "-" },
    { label: "Method", value: log.method ?? "-" },
    { label: "Path", value: log.path ?? "-" },
    { label: "Status", value: log.statusCode ?? "-" },
    { label: "Request ID", value: log.requestId ?? "-" },
  ];
  const hasObject =
    (log.before != null && Object.keys(log.before).length > 0) ||
    (log.after != null && Object.keys(log.after).length > 0) ||
    (log.metadata != null && Object.keys(log.metadata).length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1b1b1d] border border-[#2a2a2d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2d]">
          <h2 className="text-white font-semibold">Log detail</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-auto space-y-4">
          <table className="w-full text-sm text-gray-200">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="py-1 pr-3 text-gray-400 w-28">{r.label}</td>
                  <td className="py-1 break-all">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasObject && (
            <>
              {log.before != null && Object.keys(log.before).length > 0 && (
                <div>
                  <h3 className="text-gray-300 font-medium mb-1">Before (object)</h3>
                  <pre className="bg-[#0f0f10] border border-[#2a2a2d] rounded p-3 text-xs text-gray-300 overflow-auto max-h-48">
                    {JSON.stringify(log.before, null, 2)}
                  </pre>
                </div>
              )}
              {log.after != null && Object.keys(log.after).length > 0 && (
                <div>
                  <h3 className="text-gray-300 font-medium mb-1">After (object)</h3>
                  <pre className="bg-[#0f0f10] border border-[#2a2a2d] rounded p-3 text-xs text-gray-300 overflow-auto max-h-48">
                    {JSON.stringify(log.after, null, 2)}
                  </pre>
                </div>
              )}
              {log.metadata != null && Object.keys(log.metadata).length > 0 && (
                <div>
                  <h3 className="text-gray-300 font-medium mb-1">Metadata (object)</h3>
                  <pre className="bg-[#0f0f10] border border-[#2a2a2d] rounded p-3 text-xs text-gray-300 overflow-auto max-h-48">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MonitoringPage;
