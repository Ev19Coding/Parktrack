import CheckIcon from "lucide-solid/icons/check";
import ClockIcon from "lucide-solid/icons/clock";
import FlagIcon from "lucide-solid/icons/flag";
import MessageSquareIcon from "lucide-solid/icons/message-square";
import UserIcon from "lucide-solid/icons/user";
import { type JSXElement, Show } from "solid-js";
import type { ReportSchema } from "~/server/database/schema";
import { formatDateFull, formatDateRelative } from "~/utils/formatting";

export interface BaseReportCardProps {
	report: ReportSchema;
	locationTitle?: string;
	userType: "user" | "owner";
	actions: JSXElement;
	isUpdating?: boolean;
}

export function BaseReportCard(props: BaseReportCardProps) {
	return (
		<div
			class={`card bg-base-100 shadow-lg ${props.report.isResolved ? "border-l-4 border-l-success" : "border-l-4 border-l-warning"}`}
		>
			<div class="card-body p-4">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<div class="min-w-0 flex-1">
						<div class="mb-3 flex flex-wrap items-center gap-2">
							<div
								class={`badge ${props.report.isResolved ? "badge-success" : "badge-warning"} badge-lg gap-1`}
							>
								{props.report.isResolved ? (
									<>
										<CheckIcon size={12} />
										Resolved
									</>
								) : (
									<>
										<ClockIcon size={12} />
										Pending
									</>
								)}
							</div>
							<Show when={props.locationTitle}>
								<div class="badge badge-outline badge-primary">
									{props.locationTitle}
								</div>
							</Show>
						</div>

						<h3 class="mb-2 break-words font-semibold text-base">
							{props.report.title}
						</h3>

						<Show when={props.report.message}>
							<p class="mb-3 break-words text-base-content/80 text-sm">
								{props.report.message}
							</p>
						</Show>

						<div class="mb-3 flex flex-wrap items-center gap-4 text-base-content/60 text-xs">
							<div class="flex items-center gap-1">
								{props.userType === "user" ? (
									<FlagIcon size={12} />
								) : (
									<UserIcon size={12} />
								)}
								Report ID: {props.report.id}
							</div>
							<div class="flex items-center gap-1">
								<ClockIcon size={12} />
								{props.userType === "user"
									? `Submitted ${formatDateRelative(props.report.createdAt)}`
									: formatDateRelative(props.report.createdAt)}
							</div>
						</div>

						<Show when={props.report.ownerReply}>
							<div class="alert alert-success">
								<div class="flex items-start gap-2">
									<MessageSquareIcon size={16} />
									<div class="flex-1">
										<div class="font-semibold text-sm">
											{props.userType === "user"
												? "Owner Response"
												: "Your Response"}
										</div>
										<p class="mt-1 break-words text-sm">
											{props.report.ownerReply}
										</p>
										<Show when={props.report.ownerReplyAt}>
											<p class="mt-1 text-base-content/60 text-xs">
												{props.userType === "user"
													? `Responded on ${props.report.ownerReplyAt ? formatDateFull(props.report.ownerReplyAt) : ""}`
													: props.report.ownerReplyAt
														? formatDateFull(props.report.ownerReplyAt)
														: ""}
											</p>
										</Show>
									</div>
								</div>
							</div>
						</Show>
					</div>

					<div class="flex flex-col gap-2">{props.actions}</div>
				</div>
			</div>
		</div>
	);
}
