import { A, useNavigate } from "@solidjs/router";
import AnonymousIcon from "lucide-solid/icons/hat-glasses";
import { createSignal, Match, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { GenericButton } from "~/components/button";
import { AUTH_CLIENT } from "~/server/lib/auth-client";
import { revalidateUserLoginData } from "~/utils/user-query";

export default function LoginPage() {
	const [form, setForm] = createStore({
		email: "",
		password: "",
		username: "",
	});
	const [isLoading, setIsLoading] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);
	const [loginMode, setLoginMode] = createSignal<"sign-up" | "sign-in">(
		"sign-in",
	);

	const navigate = useNavigate();

	const handleSignIn = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await AUTH_CLIENT.signIn.email({
				email: form.email,
				password: form.password,
			});

			if (result.error) {
				setError(result.error.message || "Sign in failed");
			} else {
				await revalidateUserLoginData();

				navigate("/user");
			}
		} catch {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSignUp = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await AUTH_CLIENT.signUp.email({
				name: form.username,
				email: form.email,
				password: form.password,
			});

			if (result.error) {
				setError(result.error.message || "Sign up failed");
			} else {
				await revalidateUserLoginData();

				navigate("/user");
			}
		} catch {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div class="size-full overflow-auto">
			<div class="hero min-h-screen bg-base-100">
				<div class="hero-content flex-col gap-4 lg:flex-row-reverse lg:gap-8">
					<div class="text-center lg:max-w-2/5 lg:text-left">
						<h1 class="font-bold text-5xl text-primary">ParkTrack</h1>
						<p class="py-6 text-lg">
							Discover and explore parks & restaurants in AMAC, Abuja. Sign in
							to access personalized recommendations and save your favorite
							locations.
						</p>
					</div>

					<div class="card w-full max-w-sm shrink-0 bg-base-200 shadow-2xl">
						<form
							class="card-body"
							onSubmit={(e) => {
								if (loginMode() === "sign-in") {
									handleSignIn(e);
								} else {
									handleSignUp(e);
								}
							}}
						>
							<Show when={loginMode() === "sign-up"}>
								<fieldset class="fieldset">
									<legend class="fieldset-legend">
										Username <span class="text-error">*</span>
									</legend>

									<input
										type="text"
										placeholder="Enter your username"
										class="input"
										value={form.username}
										onInput={(e) => setForm("username", e.currentTarget.value)}
										required
									/>
								</fieldset>
							</Show>

							<fieldset class="fieldset">
								<legend class="fieldset-legend">
									Email <span class="text-error">*</span>
								</legend>

								<input
									type="email"
									placeholder="Enter your email"
									class="input"
									value={form.email}
									onInput={(e) => setForm("email", e.currentTarget.value)}
									required
								/>
							</fieldset>

							<fieldset class="fieldset">
								<legend class="fieldset-legend">
									Password <span class="text-error">*</span>
								</legend>
								<input
									type="password"
									placeholder="Enter your password"
									class="input"
									value={form.password}
									onInput={(e) => setForm("password", e.currentTarget.value)}
									required
								/>
								<Show when={loginMode() === "sign-in"}>
									<p class="label">
										<A href="#" class="label-text-alt link link-hover">
											Forgot password?
										</A>
									</p>
								</Show>
							</fieldset>

							<Show when={error()}>
								<div class="alert alert-error">
									<span>{error()}</span>
								</div>
							</Show>

							<div class="mt-2 flex items-center justify-center">
								<GenericButton
									type="submit"
									class="btn-primary"
									disabled={isLoading()}
								>
									<Switch>
										<Match when={isLoading()}>
											<span class="loading loading-spinner loading-sm"></span>
											Signing In...
										</Match>

										<Match when={loginMode() === "sign-in"}>Sign In</Match>

										<Match when={loginMode() === "sign-up"}>Sign Up</Match>
									</Switch>
								</GenericButton>
							</div>

							{/* Extensible section for future OAuth providers */}
							<div class="divider">OR</div>

							<div class="m-auto flex w-fit flex-col items-center justify-center gap-4 *:w-full">
								<GenericButton
									class="btn-neutral"
									onClick={() => {
										// TODO: Implement Google OAuth
										setError("Google Sign In coming soon!");
									}}
								>
									<svg class="mr-2 h-5 w-5" viewBox="0 0 24 24">
										<title>Google Icon</title>
										<path
											fill="currentColor"
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										/>
										<path
											fill="currentColor"
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										/>
										<path
											fill="currentColor"
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
										/>
										<path
											fill="currentColor"
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
										/>
									</svg>
									Continue with Google
								</GenericButton>

								<button
									type="button"
									class="btn btn-accent"
									onClick={async () => {
										await AUTH_CLIENT.signOut();

										await revalidateUserLoginData();

										navigate("/user");
									}}
								>
									<AnonymousIcon />
									Continue as Guest
								</button>
							</div>

							<div class="text-center">
								<Show
									when={loginMode() === "sign-in"}
									fallback={
										<>
											<span class="text-sm">Already have an account? </span>
											<button
												type="button"
												class="link link-primary text-sm"
												onClick={(_) => setLoginMode("sign-in")}
											>
												Sign in here
											</button>
										</>
									}
								>
									<span class="text-sm">Don't have an account? </span>
									<button
										type="button"
										class="link link-primary text-sm"
										onClick={(_) => setLoginMode("sign-up")}
									>
										Sign up here
									</button>
								</Show>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}
