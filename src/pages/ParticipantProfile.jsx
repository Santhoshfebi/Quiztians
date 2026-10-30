import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Award,
    BookOpen,
    CheckCircle2,
    Clock3,
    Eye,
    EyeOff,
    Languages,
    KeyRound,
    Loader2,
    LockKeyhole,
    LogIn,
    LogOut,
    MapPin,
    Medal,
    Phone,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserRound,
} from "lucide-react";

import { supabase } from "../supabaseClient";

const SESSION_STORAGE_KEY = "quiztians-participant-session";
const ACTIVATION_STORAGE_KEY = "quiztians-profile-activation-token";

/* ==========================================================
   HELPERS
========================================================== */

function getStoredSession() {
    if (typeof window === "undefined") return "";

    try {
        return window.localStorage.getItem(SESSION_STORAGE_KEY) || "";
    } catch {
        return "";
    }
}

function saveSession(token) {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(SESSION_STORAGE_KEY, token);
    } catch {
        // Local storage unavailable.
    }
}

function removeSession() {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // Local storage unavailable.
    }
}

function getActivationToken() {
    if (typeof window === "undefined") return "";

    try {
        return (
            window.sessionStorage.getItem(ACTIVATION_STORAGE_KEY) ||
            window.localStorage.getItem(ACTIVATION_STORAGE_KEY) ||
            ""
        );
    } catch {
        return "";
    }
}

function removeActivationToken() {
    if (typeof window === "undefined") return;

    try {
        window.sessionStorage.removeItem(ACTIVATION_STORAGE_KEY);
        window.localStorage.removeItem(ACTIVATION_STORAGE_KEY);
    } catch {
        // Storage unavailable.
    }
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatTime(seconds) {
    const value = Number(seconds);

    if (!Number.isFinite(value) || value <= 0) {
        return "—";
    }

    const minutes = Math.floor(value / 60);
    const remainingSeconds = Math.floor(value % 60);

    if (minutes <= 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
}

/* ==========================================================
   PAGE
========================================================== */

export default function ParticipantProfile() {
    const navigate = useNavigate();

    const [pageState, setPageState] = useState("loading");

    const [sessionToken, setSessionToken] = useState(() =>
        getStoredSession()
    );

    const [activationToken, setActivationToken] = useState(() =>
        getActivationToken()
    );

    const [profileData, setProfileData] = useState(null);

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [checkedPhone, setCheckedPhone] = useState("");
    const [claimCode, setClaimCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    /* ========================================================
       LOAD PROFILE
    ======================================================== */

    const loadProfile = useCallback(async (token) => {
        if (!token) return false;

        try {
            const { data, error } = await supabase.functions.invoke(
                "participant-profile",
                {
                    body: {
                        session_token: token,
                    },
                }
            );

            if (error) {
                console.error("Participant profile error:", error);
                return false;
            }

            if (!data?.success) {
                console.error(
                    "Participant profile rejected:",
                    data?.error
                );

                return false;
            }

            setProfileData(data);
            setPageState("profile");

            return true;
        } catch (error) {
            console.error("Unable to load participant profile:", error);

            return false;
        }
    }, []);

    /* ========================================================
       INITIAL SESSION RESTORE
    ======================================================== */

    useEffect(() => {
        let active = true;

        const restore = async () => {
            if (sessionToken) {
                const valid = await loadProfile(sessionToken);

                if (!active) return;

                if (valid) {
                    return;
                }

                removeSession();
                setSessionToken("");
            }

            if (!active) return;

            if (activationToken) {
                setPageState("activate");
            } else {
                setPageState("phone");
            }
        };

        restore();

        return () => {
            active = false;
        };
    }, [activationToken, loadProfile, sessionToken]);

    /* ========================================================
       PHONE-FIRST PROFILE LOOKUP
    ======================================================== */

    const handlePhoneContinue = async (event) => {
        event.preventDefault();

        if (submitting) return;

        setErrorMessage("");
        setSuccessMessage("");

        const cleanPhone = (checkedPhone || phone).trim();

        if (!/^[0-9]{10}$/.test(cleanPhone)) {
            setErrorMessage("Enter a valid 10-digit phone number.");
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "participant-profile-status",
                { body: { phone: cleanPhone } }
            );

            if (error || !data?.success) {
                console.error("Participant status error:", error || data?.error);
                setErrorMessage("Unable to check your profile right now. Please try again.");
                return;
            }

            setCheckedPhone(cleanPhone);

            if (data.status === "activated") {
                setPassword("");
                setPageState("login");
                return;
            }

            if (data.status === "unactivated") {
                if (activationToken) {
                    setNewPassword("");
                    setConfirmPassword("");
                    setPageState("activate");
                } else {
                    setPageState("verification-required");
                }
                return;
            }

            setPageState("not-found");
        } catch (error) {
            console.error("Participant status lookup failed:", error);
            setErrorMessage("Unable to check your profile right now. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       LOGIN
    ======================================================== */

    const handleLogin = async (event) => {
        event.preventDefault();

        if (submitting) return;

        setErrorMessage("");
        setSuccessMessage("");

        const cleanPhone = phone.trim();

        if (!/^[0-9]{10}$/.test(cleanPhone)) {
            setErrorMessage(
                "Enter a valid 10-digit phone number."
            );
            return;
        }

        if (!password) {
            setErrorMessage("Enter your password.");
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "participant-login",
                {
                    body: {
                        phone: cleanPhone,
                        password,
                    },
                }
            );

            if (error) {
                console.error("Participant login error:", error);

                setErrorMessage(
                    data?.error ||
                    "Unable to sign in. Please check your details."
                );

                return;
            }

            if (!data?.success || !data?.session_token) {
                setErrorMessage(
                    data?.error ||
                    "Invalid phone number or password."
                );

                return;
            }

            const token = data.session_token;

            saveSession(token);
            setSessionToken(token);

            setPassword("");

            const loaded = await loadProfile(token);

            if (!loaded) {
                removeSession();
                setSessionToken("");

                setErrorMessage(
                    "Signed in, but we couldn't load your profile. Please try again."
                );

                setPageState("login");
            }
        } catch (error) {
            console.error("Participant login failed:", error);

            setErrorMessage(
                "Unable to sign in right now. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       ACTIVATE PROFILE
    ======================================================== */

    const handleActivation = async (event) => {
        event.preventDefault();

        if (submitting) return;

        setErrorMessage("");
        setSuccessMessage("");

        if (!activationToken) {
            setErrorMessage(
                "Your activation session is unavailable. Complete a quiz to activate your profile."
            );
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword.length > 128) {
            setErrorMessage("Password is too long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "activate-profile",
                {
                    body: {
                        activation_token: activationToken,
                        password: newPassword,
                    },
                }
            );

            if (error) {
                console.error("Profile activation error:", error);

                setErrorMessage(
                    data?.error ||
                    "Unable to activate your profile."
                );

                return;
            }

            if (!data?.success || !data?.session_token) {
                setErrorMessage(
                    data?.error ||
                    "Unable to activate your profile."
                );

                return;
            }

            const token = data.session_token;

            saveSession(token);
            removeActivationToken();

            setActivationToken("");
            setSessionToken(token);

            setNewPassword("");
            setConfirmPassword("");

            setSuccessMessage(
                "Your QUIZTIANS profile is ready!"
            );

            const loaded = await loadProfile(token);

            if (!loaded) {
                setErrorMessage(
                    "Your profile was activated, but we couldn't load it. Please sign in again."
                );

                removeSession();
                setSessionToken("");
                setPageState("login");
            }
        } catch (error) {
            console.error("Profile activation failed:", error);

            setErrorMessage(
                "Unable to activate your profile right now."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       CLAIM PROFILE WITH SAVED CODE
    ======================================================== */

    const handleClaimActivation = async (event) => {
        event.preventDefault();

        if (submitting) return;

        setErrorMessage("");
        setSuccessMessage("");

        const cleanPhone = (checkedPhone || phone).trim();
        const cleanClaimCode = claimCode.trim().toUpperCase().replace(/\s+/g, "");

        if (!/^[0-9]{10}$/.test(cleanPhone)) {
            setErrorMessage("Enter a valid 10-digit phone number.");
            return;
        }

        if (!cleanClaimCode) {
            setErrorMessage("Enter your Profile Claim Code.");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword.length > 128) {
            setErrorMessage("Password is too long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "claim-participant-profile",
                {
                    body: {
                        phone: cleanPhone,
                        claim_code: cleanClaimCode,
                        password: newPassword,
                    },
                }
            );

            if (error) {
                console.error("Profile claim activation error:", error);

                setErrorMessage(
                    data?.error ||
                    "Unable to activate your profile with this claim code."
                );

                return;
            }

            if (!data?.success || !data?.session_token) {
                setErrorMessage(
                    data?.error ||
                    "Unable to activate your profile with this claim code."
                );

                return;
            }

            const token = data.session_token;

            saveSession(token);
            removeActivationToken();

            setActivationToken("");
            setSessionToken(token);
            setClaimCode("");
            setNewPassword("");
            setConfirmPassword("");

            setSuccessMessage("Your QUIZTIANS profile is ready!");

            const loaded = await loadProfile(token);

            if (!loaded) {
                removeSession();
                setSessionToken("");

                setErrorMessage(
                    "Your profile was activated, but we couldn't load it. Please sign in again."
                );

                setPageState("login");
            }
        } catch (error) {
            console.error("Profile claim activation failed:", error);

            setErrorMessage(
                "Unable to activate your profile right now. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       RESET FORGOTTEN PASSWORD
    ======================================================== */

    const handlePasswordRecovery = async (event) => {
        event.preventDefault();

        if (submitting) return;

        setErrorMessage("");
        setSuccessMessage("");

        const cleanPhone = (checkedPhone || phone).trim();
        const cleanRecoveryCode = recoveryCode
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");

        if (!/^[0-9]{10}$/.test(cleanPhone)) {
            setErrorMessage("Enter a valid 10-digit phone number.");
            return;
        }

        if (!cleanRecoveryCode) {
            setErrorMessage("Enter the recovery code provided by QUIZTIANS.");
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage("Password must contain at least 8 characters.");
            return;
        }

        if (newPassword.length > 128) {
            setErrorMessage("Password is too long.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            const { data, error } = await supabase.functions.invoke(
                "reset-participant-password",
                {
                    body: {
                        phone: cleanPhone,
                        recovery_code: cleanRecoveryCode,
                        password: newPassword,
                    },
                }
            );

            if (error) {
                console.error("Participant password recovery error:", error);

                let message = data?.error || "Unable to reset your password.";

                try {
                    if (error.context) {
                        const responseData = await error.context.json();
                        if (responseData?.error) message = responseData.error;
                    }
                } catch {
                    // Keep the safe fallback message.
                }

                setErrorMessage(message);
                return;
            }

            if (!data?.success) {
                setErrorMessage(
                    data?.error || "Unable to reset your password."
                );
                return;
            }

            // The server revokes every participant session after recovery.
            removeSession();
            setSessionToken("");
            setProfileData(null);
            setPassword("");
            setRecoveryCode("");
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setPageState("login");
            setSuccessMessage(
                data?.message ||
                "Password reset successfully. Sign in with your new password."
            );
        } catch (error) {
            console.error("Participant password recovery failed:", error);
            setErrorMessage(
                "Unable to reset your password right now. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ========================================================
       LOGOUT
    ======================================================== */

    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        const token = sessionToken;

        /*
          Clear this browser first.
    
          Even if the network request fails, the participant is
          still signed out from the current browser.
        */

        removeSession();

        setSessionToken("");
        setProfileData(null);
        setPassword("");
        setClaimCode("");
        setRecoveryCode("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (token) {
                const { error } = await supabase.functions.invoke(
                    "participant-logout",
                    {
                        body: {
                            session_token: token,
                        },
                    }
                );

                if (error) {
                    console.error(
                        "Server session revocation failed:",
                        error
                    );
                }
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setCheckedPhone("");
            setPhone("");
            setPageState("phone");
            setLoggingOut(false);
        }
    };

    /* ========================================================
       PROFILE VALUES
    ======================================================== */

    const profile = profileData?.profile || null;
    const stats = profileData?.stats || {};
    const history = profileData?.history || [];

    const initials = useMemo(() => {
        const value = profile?.display_name?.trim();

        if (!value) return "Q";

        return value
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join("");
    }, [profile?.display_name]);

    /* ========================================================
       LOADING
    ======================================================== */

    if (pageState === "loading") {
        return (
            <PageShell>
                <div className="flex min-h-[70vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/[0.07]">
                            <Loader2
                                size={22}
                                className="animate-spin text-violet-400"
                            />
                        </div>

                        <p className="mt-4 text-sm font-bold text-zinc-400">
                            Loading your profile...
                        </p>

                        <p className="mt-1 text-xs text-zinc-600">
                            Preparing your QUIZTIANS journey
                        </p>
                    </div>
                </div>
            </PageShell>
        );
    }

    /* ========================================================
       PHONE FIRST
    ======================================================== */

    if (pageState === "phone") {
        return (
            <PageShell>
                <AuthContainer
                    icon={UserRound}
                    eyebrow="My Profile"
                    title="Find your profile"
                    description="Enter the phone number you used for QUIZTIANS. We'll take you to the right profile setup or sign-in screen."
                    onBack={() => navigate("/")}
                >
                    <form onSubmit={handlePhoneContinue} className="mt-7 space-y-4">
                        <PhoneField phone={phone} setPhone={setPhone} />
                        <MessageBox error={errorMessage} success={successMessage} />
                        <button type="submit" disabled={submitting} className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                            {submitting ? <><Loader2 size={17} className="animate-spin" />Checking...</> : <><ArrowLeft size={17} className="rotate-180" />Continue</>}
                        </button>
                        <p className="px-3 text-center text-[10px] leading-5 text-zinc-700">Use the same phone number you entered when joining the quiz.</p>
                    </form>
                </AuthContainer>
            </PageShell>
        );
    }

    if (pageState === "verification-required") {
        return (
            <PageShell>
                <AuthContainer
                    icon={ShieldCheck}
                    eyebrow="Profile Found"
                    title="Verification required"
                    description="Your QUIZTIANS profile exists, but this browser no longer has the secure activation proof from your quiz."
                    onBack={() => {
                        setPageState("phone");
                        setErrorMessage("");
                    }}
                >
                    <div className="mt-7 space-y-4">
                        <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
                            <p className="text-xs font-black text-amber-300">
                                Existing profile found
                            </p>

                            <p className="mt-2 text-[11px] leading-5 text-zinc-600">
                                For your privacy, a phone number alone cannot be used to create a password. If you saved the Profile Claim Code shown after your quiz, you can use it to securely activate this profile.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setClaimCode("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setErrorMessage("");
                                setSuccessMessage("");
                                setPageState("claim");
                            }}
                            className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5"
                        >
                            <ShieldCheck size={17} />
                            I Have a Profile Claim Code
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setPageState("phone");
                                setCheckedPhone("");
                                setErrorMessage("");
                            }}
                            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 text-sm font-black text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                        >
                            Use Another Number
                        </button>
                    </div>
                </AuthContainer>
            </PageShell>
        );
    }

    /* ========================================================
       CLAIM PROFILE
    ======================================================== */

    if (pageState === "claim") {
        return (
            <PageShell>
                <AuthContainer
                    icon={ShieldCheck}
                    eyebrow="Profile Recovery"
                    title="Use your Claim Code"
                    description="Enter the Profile Claim Code you saved after your quiz, then create a password for your QUIZTIANS profile."
                    onBack={() => {
                        setPageState("verification-required");
                        setClaimCode("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setErrorMessage("");
                        setSuccessMessage("");
                    }}
                >
                    <div className="mt-5 rounded-2xl border border-white/[0.055] bg-white/[0.02] px-4 py-3 text-xs font-bold text-zinc-500">
                        <Phone size={14} className="mr-2 inline text-violet-400" />
                        {checkedPhone || phone}
                    </div>

                    <form
                        onSubmit={handleClaimActivation}
                        className="mt-7 space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-zinc-600">
                                Profile Claim Code
                            </label>

                            <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 transition focus-within:border-violet-500/40">
                                <ShieldCheck
                                    size={16}
                                    className="shrink-0 text-zinc-600"
                                />

                                <input
                                    type="text"
                                    value={claimCode}
                                    onChange={(event) =>
                                        setClaimCode(
                                            event.target.value
                                                .toUpperCase()
                                                .replace(/\s+/g, "")
                                        )
                                    }
                                    autoCapitalize="characters"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    placeholder="QZ-ABC-XYZ"
                                    className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold uppercase tracking-[0.08em] text-white outline-none placeholder:text-zinc-700"
                                />
                            </div>

                            <p className="mt-2 px-1 text-[9px] leading-4 text-zinc-700">
                                Use the code that was shown on your quiz result screen.
                            </p>
                        </div>

                        <PasswordField
                            label="Create Password"
                            value={newPassword}
                            onChange={setNewPassword}
                            visible={showNewPassword}
                            onToggle={() =>
                                setShowNewPassword((current) => !current)
                            }
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                        />

                        <PasswordField
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            visible={showConfirmPassword}
                            onToggle={() =>
                                setShowConfirmPassword((current) => !current)
                            }
                            placeholder="Enter password again"
                            autoComplete="new-password"
                        />

                        <MessageBox
                            error={errorMessage}
                            success={successMessage}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                    Activating...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={17} />
                                    Activate My Profile
                                </>
                            )}
                        </button>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex gap-3">
                                <LockKeyhole
                                    size={15}
                                    className="mt-0.5 shrink-0 text-violet-400"
                                />

                                <p className="text-[11px] leading-5 text-zinc-600">
                                    Your Claim Code is one-time proof of ownership. After successful activation it cannot be used again.
                                </p>
                            </div>
                        </div>
                    </form>
                </AuthContainer>
            </PageShell>
        );
    }

    if (pageState === "not-found") {
        return (
            <PageShell>
                <AuthContainer icon={BookOpen} eyebrow="My Profile" title="No profile found" description="We couldn't find a QUIZTIANS participant profile for that phone number." onBack={() => { setPageState("phone"); setErrorMessage(""); }}>
                    <div className="mt-7 space-y-3">
                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4 text-[11px] leading-5 text-zinc-600">Complete a QUIZTIANS quiz using this phone number first. Your participant profile will be created automatically after a successful submission.</div>
                        <button type="button" onClick={() => navigate("/")} className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white"><BookOpen size={16} />Go to Quiz</button>
                        <button type="button" onClick={() => { setPageState("phone"); setCheckedPhone(""); }} className="flex min-h-[48px] w-full items-center justify-center text-xs font-bold text-zinc-600 transition hover:text-white">Try Another Number</button>
                    </div>
                </AuthContainer>
            </PageShell>
        );
    }

    /* ========================================================
       ACTIVATION
    ======================================================== */

    if (pageState === "activate") {
        return (
            <PageShell>
                <AuthContainer
                    icon={ShieldCheck}
                    eyebrow="Profile Activation"
                    title="Set up your profile"
                    description="Create a password to securely access your QUIZTIANS history and achievements."
                    onBack={() => navigate("/")}
                >
                    {checkedPhone && <div className="mt-5 rounded-2xl border border-white/[0.055] bg-white/[0.02] px-4 py-3 text-xs font-bold text-zinc-500"><Phone size={14} className="mr-2 inline text-violet-400" />{checkedPhone}</div>}
                    <form
                        onSubmit={handleActivation}
                        className="mt-7 space-y-4"
                    >
                        <PasswordField
                            label="Create Password"
                            value={newPassword}
                            onChange={setNewPassword}
                            visible={showNewPassword}
                            onToggle={() =>
                                setShowNewPassword((current) => !current)
                            }
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                        />

                        <PasswordField
                            label="Confirm Password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            visible={showConfirmPassword}
                            onToggle={() =>
                                setShowConfirmPassword(
                                    (current) => !current
                                )
                            }
                            placeholder="Enter password again"
                            autoComplete="new-password"
                        />

                        <MessageBox
                            error={errorMessage}
                            success={successMessage}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                    Activating...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={17} />
                                    Activate My Profile
                                </>
                            )}
                        </button>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex gap-3">
                                <LockKeyhole
                                    size={15}
                                    className="mt-0.5 shrink-0 text-violet-400"
                                />

                                <p className="text-[11px] leading-5 text-zinc-600">
                                    Your password is securely hashed. QUIZTIANS
                                    never stores your readable password.
                                </p>
                            </div>
                        </div>
                    </form>
                </AuthContainer>
            </PageShell>
        );
    }

    /* ========================================================
       FORGOT PASSWORD
    ======================================================== */

    if (pageState === "forgot-password") {
        return (
            <PageShell>
                <AuthContainer
                    icon={KeyRound}
                    eyebrow="Profile Recovery"
                    title="Reset your password"
                    description="Enter the temporary recovery code provided by a QUIZTIANS superadmin, then create a new password."
                    onBack={() => {
                        setRecoveryCode("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setErrorMessage("");
                        setSuccessMessage("");
                        setPageState("login");
                    }}
                >
                    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 py-3.5">
                        <span className="flex items-center gap-3 text-sm font-semibold text-zinc-300">
                            <Phone size={16} className="text-zinc-600" />
                            {checkedPhone || phone}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setPageState("phone");
                                setCheckedPhone("");
                                setRecoveryCode("");
                                setNewPassword("");
                                setConfirmPassword("");
                                setErrorMessage("");
                                setSuccessMessage("");
                            }}
                            className="text-[10px] font-black text-violet-400 transition hover:text-violet-300"
                        >
                            Change
                        </button>
                    </div>

                    <form
                        onSubmit={handlePasswordRecovery}
                        className="mt-7 space-y-4"
                    >
                        <div>
                            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-zinc-600">
                                Recovery Code
                            </label>

                            <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 transition focus-within:border-violet-500/40">
                                <KeyRound
                                    size={16}
                                    className="shrink-0 text-zinc-600"
                                />

                                <input
                                    type="text"
                                    value={recoveryCode}
                                    onChange={(event) =>
                                        setRecoveryCode(
                                            event.target.value
                                                .toUpperCase()
                                                .replace(/\s+/g, "")
                                        )
                                    }
                                    autoCapitalize="characters"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    placeholder="QZ-7K9P-M4TX-82RW-H6JN"
                                    className="min-w-0 flex-1 bg-transparent font-mono text-sm font-bold uppercase tracking-[0.06em] text-white outline-none placeholder:text-zinc-700"
                                />
                            </div>

                            <p className="mt-2 px-1 text-[9px] leading-4 text-zinc-700">
                                Recovery codes are temporary, one-time credentials provided by QUIZTIANS support.
                            </p>
                        </div>

                        <PasswordField
                            label="New Password"
                            value={newPassword}
                            onChange={setNewPassword}
                            visible={showNewPassword}
                            onToggle={() =>
                                setShowNewPassword((current) => !current)
                            }
                            placeholder="Minimum 8 characters"
                            autoComplete="new-password"
                        />

                        <PasswordField
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={setConfirmPassword}
                            visible={showConfirmPassword}
                            onToggle={() =>
                                setShowConfirmPassword((current) => !current)
                            }
                            placeholder="Enter new password again"
                            autoComplete="new-password"
                        />

                        <MessageBox
                            error={errorMessage}
                            success={successMessage}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <KeyRound size={17} />
                                    Reset Password
                                </>
                            )}
                        </button>

                        <div className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-4">
                            <div className="flex gap-3">
                                <ShieldCheck
                                    size={15}
                                    className="mt-0.5 shrink-0 text-violet-400"
                                />

                                <p className="text-[11px] leading-5 text-zinc-600">
                                    After a successful reset, the recovery code is consumed and all existing profile sessions are signed out for security.
                                </p>
                            </div>
                        </div>
                    </form>
                </AuthContainer>
            </PageShell>
        );
    }

    /* ========================================================
       LOGIN
    ======================================================== */

    if (pageState === "login") {
        return (
            <PageShell>
                <AuthContainer
                    icon={UserRound}
                    eyebrow="My Profile"
                    title="Welcome back"
                    description="Sign in to view your quiz history, performance and achievements."
                    onBack={() => navigate("/")}
                >
                    <form
                        onSubmit={handleLogin}
                        className="mt-7 space-y-4"
                    >
                        <div className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 py-3.5">
                            <span className="flex items-center gap-3 text-sm font-semibold text-zinc-300"><Phone size={16} className="text-zinc-600" />{checkedPhone || phone}</span>
                            <button type="button" onClick={() => { setPageState("phone"); setCheckedPhone(""); setPassword(""); setErrorMessage(""); }} className="text-[10px] font-black text-violet-400 transition hover:text-violet-300">Change</button>
                        </div>

                        <PasswordField
                            label="Password"
                            value={password}
                            onChange={setPassword}
                            visible={showPassword}
                            onToggle={() =>
                                setShowPassword((current) => !current)
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                        />

                        <div className="flex justify-end px-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setRecoveryCode("");
                                    setNewPassword("");
                                    setConfirmPassword("");
                                    setErrorMessage("");
                                    setSuccessMessage("");
                                    setPageState("forgot-password");
                                }}
                                className="inline-flex items-center gap-1.5 text-[10px] font-black text-violet-400 transition hover:text-violet-300"
                            >
                                <KeyRound size={12} />
                                Forgot Password?
                            </button>
                        </div>

                        <MessageBox
                            error={errorMessage}
                            success={successMessage}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            className="group flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_18px_45px_-18px_rgba(124,58,237,0.9)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <Loader2
                                        size={17}
                                        className="animate-spin"
                                    />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <LogIn size={17} />
                                    Sign In
                                </>
                            )}
                        </button>

                        <p className="px-3 text-center text-[10px] leading-5 text-zinc-700">
                            New participant? Complete a QUIZTIANS quiz first
                            to activate your profile.
                        </p>
                    </form>
                </AuthContainer>
            </PageShell>
        );
    }

    /* ========================================================
       PROFILE DASHBOARD
    ======================================================== */

    return (
        <PageShell>
            <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-9 lg:px-8">
                {/* TOP BAR */}

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 text-xs font-bold text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                    >
                        <ArrowLeft size={15} />
                        Home
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex min-h-10 items-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.04] px-3 text-xs font-bold text-red-400/80 transition hover:border-red-500/20 hover:bg-red-500/[0.08] hover:text-red-300 disabled:opacity-50"
                    >
                        {loggingOut ? (
                            <Loader2
                                size={14}
                                className="animate-spin"
                            />
                        ) : (
                            <LogOut size={14} />
                        )}

                        Sign Out
                    </button>
                </div>

                {/* PROFILE HERO */}

                <motion.section
                    initial={{
                        opacity: 0,
                        y: 16,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        duration: 0.45,
                    }}
                    className="relative mt-5 overflow-hidden rounded-[28px] border border-white/[0.065] bg-[#111114]/90 p-5 shadow-2xl shadow-black/20 sm:p-7"
                >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />

                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/[0.08] blur-[90px]" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-violet-500/20 bg-gradient-to-br from-violet-500/15 to-indigo-500/10 text-xl font-black text-violet-300 shadow-lg shadow-violet-950/20">
                            {initials}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                                    Participant Profile
                                </p>

                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/10 bg-emerald-500/[0.05] px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-emerald-400">
                                    <CheckCircle2 size={9} />
                                    Active
                                </span>
                            </div>

                            <h1 className="mt-2 truncate text-[26px] font-black tracking-[-0.04em] text-white sm:text-[32px]">
                                {profile?.display_name || "Participant"}
                            </h1>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-zinc-600">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={12} />
                                    {profile?.place || "—"}
                                </span>

                                <span className="flex items-center gap-1.5">
                                    <Languages size={12} />
                                    {profile?.preferred_language || "—"}
                                </span>

                                <span className="flex items-center gap-1.5">
                                    <Phone size={12} />
                                    {profile?.phone
                                        ? `••••••${profile.phone.slice(-4)}`
                                        : "—"}
                                </span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/[0.055] bg-black/15 px-4 py-3 sm:text-right">
                            <p className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-700">
                                Member Since
                            </p>

                            <p className="mt-1 text-xs font-black text-zinc-400">
                                {formatDate(profile?.member_since)}
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* STATS */}

                <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                        icon={BookOpen}
                        label="Quizzes"
                        value={stats.total_quizzes ?? 0}
                        helper="Completed"
                    />

                    <StatCard
                        icon={Award}
                        label="Accuracy"
                        value={`${stats.average_accuracy ?? 0}%`}
                        helper="Overall"
                    />

                    <StatCard
                        icon={Trophy}
                        label="Best Rank"
                        value={
                            stats.best_rank
                                ? `#${stats.best_rank}`
                                : "—"
                        }
                        helper="Leaderboard"
                    />

                    <StatCard
                        icon={CheckCircle2}
                        label="Correct"
                        value={stats.total_correct ?? 0}
                        helper={`of ${stats.total_questions ?? 0}`}
                    />
                </section>

                {/* PERFORMANCE */}

                <section className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoCard
                        icon={Medal}
                        label="Best Accuracy"
                        value={`${stats.best_accuracy ?? 0}%`}
                    />

                    <InfoCard
                        icon={Clock3}
                        label="Total Quiz Time"
                        value={formatTime(stats.total_time_taken)}
                    />
                </section>

                {/* HISTORY */}

                <section className="mt-8">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                                Your Journey
                            </p>

                            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-white">
                                Quiz History
                            </h2>
                        </div>

                        <span className="rounded-full border border-white/[0.055] bg-white/[0.025] px-3 py-1.5 text-[9px] font-black text-zinc-600">
                            {history.length}{" "}
                            {history.length === 1 ? "quiz" : "quizzes"}
                        </span>
                    </div>

                    {history.length === 0 ? (
                        <div className="mt-4 rounded-[24px] border border-dashed border-white/[0.07] bg-white/[0.015] px-5 py-12 text-center">
                            <BookOpen
                                size={25}
                                className="mx-auto text-zinc-700"
                            />

                            <p className="mt-3 text-sm font-black text-zinc-400">
                                No quiz history yet
                            </p>

                            <p className="mt-1 text-xs text-zinc-700">
                                Your completed challenges will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {history.map((attempt, index) => (
                                <HistoryCard
                                    key={attempt.id}
                                    attempt={attempt}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </PageShell>
    );
}

/* ==========================================================
   PAGE SHELL
========================================================== */

function PageShell({ children }) {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#09090B] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-[-260px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-violet-600/[0.10] blur-[160px]" />

                <div className="absolute -left-[260px] top-[620px] h-[520px] w-[520px] rounded-full bg-indigo-600/[0.06] blur-[160px]" />

                <div className="absolute -right-[280px] top-[300px] h-[560px] w-[560px] rounded-full bg-violet-700/[0.06] blur-[180px]" />
            </div>

            <header className="relative z-50 border-b border-white/[0.055] bg-[#09090B]/85 backdrop-blur-xl">
                <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        className="flex items-center gap-2.5"
                    >
                        <img
                            src="/branding/quiztians-q.png"
                            alt=""
                            className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                        />

                        <div className="text-left">
                            <img
                                src="/branding/quiztians-wordmark.png"
                                alt="QUIZTIANS"
                                className="h-[28px] w-auto max-w-[130px] object-contain object-left sm:h-[36px] sm:max-w-[220px]"
                            />

                            <div className="hidden text-[8px] font-semibold uppercase tracking-[0.2em] text-zinc-700 sm:block">
                                My Profile
                            </div>
                        </div>
                    </button>

                    <div className="flex items-center gap-2 rounded-full border border-violet-500/10 bg-violet-500/[0.04] px-3 py-1.5">
                        <ShieldCheck
                            size={11}
                            className="text-violet-400"
                        />

                        <span className="text-[8px] font-black uppercase tracking-[0.13em] text-violet-300">
                            Secure Profile
                        </span>
                    </div>
                </div>
            </header>

            {children}
        </div>
    );
}

/* ==========================================================
   AUTH CONTAINER
========================================================== */

function AuthContainer({
    icon: Icon,
    eyebrow,
    title,
    description,
    onBack,
    children,
}) {
    return (
        <main className="relative z-10 mx-auto flex min-h-[calc(100svh-68px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
            <motion.div
                initial={{
                    opacity: 0,
                    y: 20,
                    scale: 0.98,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                transition={{
                    duration: 0.45,
                }}
                className="w-full max-w-[460px]"
            >
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 flex items-center gap-2 text-xs font-bold text-zinc-600 transition hover:text-white"
                >
                    <ArrowLeft size={14} />
                    Back to Home
                </button>

                <div className="relative overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#111114]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />

                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/[0.08] blur-[90px]" />

                    <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/[0.07] text-violet-400">
                            <Icon size={20} />
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                            <Sparkles
                                size={11}
                                className="text-violet-400"
                            />

                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-400">
                                {eyebrow}
                            </p>
                        </div>

                        <h1 className="mt-2 text-[28px] font-black tracking-[-0.045em] text-white">
                            {title}
                        </h1>

                        <p className="mt-2 max-w-sm text-xs leading-6 text-zinc-600">
                            {description}
                        </p>

                        {children}
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

function PhoneField({ phone, setPhone }) {
    return (
        <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-zinc-600">Phone Number</label>
            <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 transition focus-within:border-violet-500/40">
                <Phone size={16} className="shrink-0 text-zinc-600" />
                <input type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} placeholder="10-digit phone number" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-700" />
            </div>
        </div>
    );
}

/* ==========================================================
   PASSWORD FIELD
========================================================== */

function PasswordField({
    label,
    value,
    onChange,
    visible,
    onToggle,
    placeholder,
    autoComplete,
}) {
    return (
        <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-zinc-600">
                {label}
            </label>

            <div className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#0D0D10] px-4 transition focus-within:border-violet-500/40">
                <LockKeyhole
                    size={16}
                    className="shrink-0 text-zinc-600"
                />

                <input
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={(event) =>
                        onChange(event.target.value)
                    }
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-700"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={
                        visible ? "Hide password" : "Show password"
                    }
                    className="text-zinc-700 transition hover:text-zinc-400"
                >
                    {visible ? (
                        <EyeOff size={16} />
                    ) : (
                        <Eye size={16} />
                    )}
                </button>
            </div>
        </div>
    );
}

/* ==========================================================
   MESSAGE
========================================================== */

function MessageBox({ error, success }) {
    if (!error && !success) return null;

    return (
        <div
            className={`rounded-2xl border px-4 py-3 text-[11px] font-semibold leading-5 ${error
                ? "border-red-500/10 bg-red-500/[0.05] text-red-300"
                : "border-emerald-500/10 bg-emerald-500/[0.05] text-emerald-300"
                }`}
        >
            {error || success}
        </div>
    );
}

/* ==========================================================
   STAT CARD
========================================================== */

function StatCard({
    icon: Icon,
    label,
    value,
    helper,
}) {
    return (
        <div className="rounded-[22px] border border-white/[0.06] bg-[#111114]/80 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.05] text-violet-400">
                <Icon size={15} />
            </div>

            <p className="mt-4 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-700">
                {label}
            </p>

            <p className="mt-1 text-[24px] font-black tracking-[-0.04em] text-white">
                {value}
            </p>

            <p className="mt-1 text-[9px] font-bold text-zinc-700">
                {helper}
            </p>
        </div>
    );
}

/* ==========================================================
   INFO CARD
========================================================== */

function InfoCard({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="flex items-center justify-between rounded-[20px] border border-white/[0.055] bg-white/[0.018] p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.055] bg-white/[0.025] text-zinc-500">
                    <Icon size={15} />
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">
                    {label}
                </p>
            </div>

            <p className="text-sm font-black text-zinc-300">
                {value}
            </p>
        </div>
    );
}

/* ==========================================================
   HISTORY CARD
========================================================== */

function HistoryCard({ attempt, index }) {
    return (
        <motion.article
            initial={{
                opacity: 0,
                y: 12,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay: Math.min(index * 0.04, 0.25),
            }}
            className="rounded-[22px] border border-white/[0.055] bg-[#111114]/75 p-4 sm:p-5"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/10 bg-violet-500/[0.05] text-violet-400">
                            <BookOpen size={15} />
                        </div>

                        <div>
                            <h3 className="text-sm font-black text-zinc-200">
                                {attempt.chapter || "Quiz"}
                            </h3>

                            <p className="mt-0.5 text-[9px] font-semibold text-zinc-700">
                                {formatDate(attempt.created_at)}
                                {attempt.language
                                    ? ` • ${attempt.language}`
                                    : ""}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-white/[0.055] bg-[#0D0D10]">
                    <HistoryMetric
                        label="Score"
                        value={`${attempt.score}/${attempt.total}`}
                    />

                    <HistoryMetric
                        label="Accuracy"
                        value={`${attempt.accuracy}%`}
                        border
                    />

                    <HistoryMetric
                        label="Rank"
                        value={
                            attempt.rank
                                ? `#${attempt.rank}`
                                : "—"
                        }
                        border
                    />

                    <HistoryMetric
                        label="Time"
                        value={formatTime(attempt.time_taken)}
                        border
                    />
                </div>
            </div>
        </motion.article>
    );
}

function HistoryMetric({
    label,
    value,
    border = false,
}) {
    return (
        <div
            className={`min-w-[68px] px-2 py-3 text-center ${border
                ? "border-l border-white/[0.05]"
                : ""
                }`}
        >
            <p className="text-[7px] font-black uppercase tracking-[0.1em] text-zinc-700">
                {label}
            </p>

            <p className="mt-1 text-[11px] font-black text-zinc-300">
                {value}
            </p>
        </div>
    );
}