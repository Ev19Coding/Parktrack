import { createSignal, Show } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import { AUTH_CLIENT } from "~/server/lib/auth-client";
import { GenericButton } from "~/components/button";

export default function LoginPage() {
	const [email, setEmail] = createSignal("");
	const [password, setPassword] = createSignal("");
	const [isLoading, setIsLoading] = createSignal(false);
	const [error, setError] = createSignal<string | null>(null);

	const naviaget = useNavigate()

	const handleLogin = async (e: Event) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			const result = await AUTH_CLIENT.signIn.email({
				email: email(),
				password: password(),
			});

			if (result.error) {
				setError(result.error.message || "Login failed");
			} else {
				// Redirect to user dashboard on successful login
				window.location.href = "/user";
			}
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div class="overflow-auto size-full">
		<div class="hero min-h-screen bg-base-100">
			<div class="hero-content flex-col gap-4 lg:gap-8 lg:flex-row-reverse">
				<div class="text-center lg:text-left lg:max-w-2/5">
					<h1 class="text-5xl font-bold text-primary">ParkTrack</h1>
					<p class="py-6 text-lg">
						Discover and explore parks & restaurants in AMAC, Abuja.
						Sign in to access personalized recommendations and save your favorite locations.
					</p>
				</div>

				<div class="card w-full max-w-sm shrink-0 bg-base-200 shadow-2xl">
					<form class="card-body" onSubmit={handleLogin}>
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Email
							</legend>

							<input
								type="email"
								placeholder="Enter your email"
								class="input"
								value={email()}
								onInput={(e) => setEmail(e.currentTarget.value)}
								required
							/>
						</fieldset>

						<fieldset class="fieldset">
						<legend class="fieldset-legend">Password
						</legend>
							<input
								type="password"
								placeholder="Enter your password"
								class="input"
								value={password()}
								onInput={(e) => setPassword(e.currentTarget.value)}
								required
							/>
							<p class="label">
								<A href="#" class="label-text-alt link link-hover">
									Forgot password?
								</A>
							</p>
						</fieldset>

						<Show when={error()}>
							<div class="alert alert-error">
								<span>{error()}</span>
							</div>
						</Show>

						<div class="flex justify-center items-center mt-2">
							<GenericButton
								type="submit"
								class="btn-primary"
								disabled={isLoading()}
							>
								<Show when={isLoading()} fallback="Sign In">
									<span class="loading loading-spinner loading-sm"></span>
									Signing In...
								</Show>
							</GenericButton>
						</div>

						{/* Extensible section for future OAuth providers */}
						<div class="divider">OR</div>

						<div class="flex justify-center items-center">
							<GenericButton
								type="button"
								class="btn-neutral"
								onClick={() => {
									// TODO: Implement Google OAuth
									setError("Google Sign In coming soon!");
								}}
							>
								<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
									<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
									<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
									<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
									<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
								</svg>
								Continue with Google
							</GenericButton>
						</div>

						<div class="text-center">
							<span class="text-sm">Don't have an account? </span>
							<A href="#" class="link link-primary text-sm">
								Sign up here
							</A>
						</div>
					</form>
				</div>
			</div>
		</div>
		</div>
	);
}
