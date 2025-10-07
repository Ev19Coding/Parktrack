import { createAsync, useRouteData } from "@solidjs/router";
import { createMemo, For, Show } from "solid-js";
import { getReportsByOwnerId } from "~/server/database/user/report-query";
import { queryAuthenticatedUser } from "~/utils/user-query";

export function routeData() {
  return createAsync(async () => {
    const user = await queryAuthenticatedUser();
    if (!user) {
      throw new Error("Not authenticated");
    }
    return getReportsByOwnerId(user.id);
  });
}

export default function ReportsPage() {
  const reports = useRouteData<typeof routeData>();
  
  return (
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-6">Location Reports</h1>
      
      <Show when={reports()?.length} fallback={
        <div class="text-center text-gray-500 mt-8">
          No reports found
        </div>
      }>
        <div class="grid gap-4">
          <For each={reports()}>
            {(report) => (
              <div class="card bg-base-100 shadow-lg">
                <div class="card-body">
                  <div class="flex justify-between items-start">
                    <div>
                      <h2 class="card-title">{report.locationName}</h2>
                      <p class="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div class={`badge ${
                      report.status === "resolved" ? "badge-success" :
                      report.status === "rejected" ? "badge-error" :
                      "badge-warning"
                    }`}>
                      {report.status}
                    </div>
                  </div>
                  
                  <div class="mt-4">
                    <h3 class="font-semibold">Reason</h3>
                    <p>{report.reason}</p>
                  </div>
                  
                  <Show when={report.details}>
                    <div class="mt-4">
                      <h3 class="font-semibold">Details</h3>
                      <p>{report.details}</p>
                    </div>
                  </Show>
                  
                  <Show when={report.email}>
                    <div class="mt-4">
                      <h3 class="font-semibold">Contact Email</h3>
                      <a href={`mailto:${report.email}`} class="link link-primary">
                        {report.email}
                      </a>
                    </div>
                  </Show>
                  
                  <Show when={report.photo}>
                    <div class="mt-4">
                      <h3 class="font-semibold">Attached Photo</h3>
                      <img 
                        src={URL.createObjectURL(report.photo)} 
                        alt="Report attachment"
                        class="mt-2 max-w-sm rounded-lg shadow-md" 
                      />
                    </div>
                  </Show>
                  
                  <div class="card-actions justify-end mt-4">
                    <button 
                      class="btn btn-sm btn-success"
                      onClick={() => updateStatus(report.id, "resolved")}
                      disabled={report.status === "resolved"}
                    >
                      Mark as Resolved
                    </button>
                    <button 
                      class="btn btn-sm btn-error"
                      onClick={() => updateStatus(report.id, "rejected")}
                      disabled={report.status === "rejected"}
                    >
                      Reject Report
                    </button>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

async function updateStatus(reportId: string, status: "resolved" | "rejected") {
  try {
    const response = await fetch(`/api/reports/${reportId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    // Refresh the page to show updated status
    window.location.reload();
  } catch (error) {
    console.error("Error updating report status:", error);
    alert("Failed to update report status");
  }
}